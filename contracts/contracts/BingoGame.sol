// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "hardhat/console.sol";

contract BingoGame is ERC721, ChainlinkClient, VRFConsumerBase {
    using Counters for Counters.Counter;
    using Chainlink for Chainlink.Request;

    /*************************** Structs and enums ****************************/
    enum PrizeType {
        ROW_0,
        ROW_1,
        ROW_2,
        WHOLE_CARD
    }

    enum GameState {
        TICKET_SALE,
        WAITING_FOR_TICKET_FULFILLMENT,
        GAME_IN_PROGRESS,
        GAME_FINISHED
    }

    struct GameSettings {
        string  gameName;
        string  gameSymbol;
        uint256 ticketPrice; // 1 matic = 10 ** 18
        uint24  minSecondsBeforeGameStarts;
        uint16  minSecondsBetweenSteps;
        string  ipfsDirectoryURI;
    }

    struct TicketGenerationOracle {
        address oracle;
        bytes32 jobID;
        uint256 fee;
    }

    struct RandomnessOracle {
        address oracle;
        bytes32 keyHash;
        uint256 fee;
    }

    /********************************* Events *********************************/
    event TicketSaleEnded();
    event GameStarted();
    event NewNumberDrawn(uint8 number);
    event PrizeClaimed(address claimer, uint32 ticketID, PrizeType prizeType);
    event PrizeMoneySent(address claimer, uint256 amount);

    /***************************** Game settings ******************************/
    address public immutable owner;
    uint256 public immutable ticketPrice;
    uint256 public immutable minGameStartTime;
    uint16  public immutable minSecondsBetweenSteps;

    string private _ipfsDirectoryURI;
    TicketGenerationOracle private _apiOracle;
    RandomnessOracle private _randOracle;

    /********************************* Tickets ********************************/
    mapping(uint32 => bytes15) public ticketIDToTicket;
    mapping(bytes32 => uint32) private _requestToTicketID;
    Counters.Counter private _tokenIDs;
    uint32 private _unfulfilledRequestCount = 0;

    /******************************* Game state *******************************/
    GameState public gameState = GameState.TICKET_SALE;
    uint96 public drawnNumbersBitmap;
    bool private _unfulfilledRandomness = false;
    uint256 private _lastStepTime;

    /********************************* Prizes *********************************/
    uint256 public prizePool;
    uint256 private _unclaimedPrizePool;

    mapping(address => uint256) private _balances;
    mapping(PrizeType => bool) private _wasClaimed;
    mapping(PrizeType => address[]) private _prizeClaimers;

    /************************* Game control functions **************************/
    constructor(
        GameSettings memory settings,
        RandomnessOracle memory randomnessOracleSettings,
        TicketGenerationOracle memory apiOracleSettings,
        address linkTokenAddress
    )
        ERC721(
            settings.gameName,
            settings.gameSymbol
        )
        VRFConsumerBase(
            randomnessOracleSettings.oracle,
            linkTokenAddress
        )
    {
        owner = msg.sender;

        ticketPrice = settings.ticketPrice;
        minGameStartTime = block.timestamp + settings.minSecondsBeforeGameStarts;
        minSecondsBetweenSteps = settings.minSecondsBetweenSteps;
        _ipfsDirectoryURI = settings.ipfsDirectoryURI;

        _randOracle = randomnessOracleSettings;
        _apiOracle = apiOracleSettings;
        if (linkTokenAddress == address(0)) {
            setPublicChainlinkToken();
        } else {
            setChainlinkToken(linkTokenAddress);
        }
    }

    function startGame() external {
        require(block.timestamp >= minGameStartTime, "Too early to start the game");
        require(gameState < GameState.GAME_IN_PROGRESS, "Game already started");

        if (gameState == GameState.TICKET_SALE) {
            gameState = GameState.WAITING_FOR_TICKET_FULFILLMENT;
            emit TicketSaleEnded();
        }

        if ((gameState == GameState.WAITING_FOR_TICKET_FULFILLMENT) &&
            (_unfulfilledRequestCount == 0)) {
            gameState = GameState.GAME_IN_PROGRESS;
            emit GameStarted();
        }
    }

    function finalizeStepAndDrawNextNumber() external {
        require(_unfulfilledRandomness == false, "Waiting for previous random number");
        require(gameState == GameState.GAME_IN_PROGRESS, "Game not in progress");
        require(block.timestamp >= (_lastStepTime + minSecondsBetweenSteps), "Not enough time since last step");

        _distributePrizes(PrizeType.ROW_0);
        _distributePrizes(PrizeType.ROW_1);
        _distributePrizes(PrizeType.ROW_2);
        _distributePrizes(PrizeType.WHOLE_CARD);

        if (_hasGameEnded()) {
            _finishGame();
        } else {
            _requestRandomNumber();
        }

        _lastStepTime = block.timestamp;
    }

    /* NO CODE SIZE LEFT :o
    function withdrawLink() external {
        uint256 linkLeft = LINK.balanceOf(address(this));
        bool success = LINK.transfer(owner, linkLeft);
        require(success, "LINK transfter failed");
    }
    */

    /**************************** Player functions ****************************/
    function buyTicket() external payable returns (uint32 ticketID) {
        require(gameState == GameState.TICKET_SALE, "Ticket sale has ended");
        require(msg.value >= ticketPrice, "Not enough coin for ticket");

        _tokenIDs.increment();
        uint32 _ticketID = uint32(_tokenIDs.current());

        _requestTicket(_ticketID);
        _mint(msg.sender, _ticketID);

        prizePool += ticketPrice;
        _unclaimedPrizePool += ticketPrice;

        return _ticketID;
    }

    function claimPrize(
        uint32 ticketID,
        PrizeType prizeType
    ) external returns (bool didClaim) {
        require(_wasClaimed[prizeType] == false, "Prize was already claimed");

        bytes15 ticket = ticketIDToTicket[ticketID];
        require(_isWinningTicket(ticket, prizeType) == true, "Non winning ticket");

        address claimer = ownerOf(ticketID);
        _prizeClaimers[prizeType].push(claimer);

        emit PrizeClaimed(claimer, ticketID, prizeType);
        return true;
    }

    function withdraw() public {
        uint256 amount = _balances[msg.sender];
        _balances[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");

        if (success == false) {
            _balances[msg.sender] = amount;
            revert("Failed to send coin");
        }
    }

    /********************* Winner ticket checking functions ********************/
    function _isWinningTicket(
        bytes15 ticket,
        PrizeType prizeType
    ) private view returns (bool) {
        if (prizeType == PrizeType.ROW_0) {
            return _isWinningRow(_getBytes5(ticket, 0));

        } else if (prizeType == PrizeType.ROW_1) {
            return _isWinningRow(_getBytes5(ticket, 5));

        } else if (prizeType == PrizeType.ROW_2) {
            return _isWinningRow(_getBytes5(ticket, 10));

        } else if (prizeType == PrizeType.WHOLE_CARD) {
            return (
                _isWinningRow(_getBytes5(ticket, 0)) &&
                _isWinningRow(_getBytes5(ticket, 5)) &&
                _isWinningRow(_getBytes5(ticket, 10))
            );
        }

        return false;
    }

    function _isWinningRow(bytes5 row) private view returns (bool) {
        for (uint8 i = 0; i < 5; i++) {
            uint96 numberSelector = uint96(1) << uint8(row[i]);
            if ((numberSelector & drawnNumbersBitmap) == 0) {
                return false;
            }
        }
        return true;
    }

    function _getBytes5(
        bytes15 byteArray,
        uint8 startIndex
    ) private pure returns (bytes5) {
        uint8 bitsToShiftForArrayTrim = 8 * startIndex;
        return bytes5(byteArray << bitsToShiftForArrayTrim);
    }

    /********************** Prize distribution functions **********************/
    function _distributePrizes(PrizeType prizeType) private {
        if ((_wasClaimed[prizeType] == true) ||
            (_prizeClaimers[prizeType].length == 0)) {
            return;
        }

        _wasClaimed[PrizeType.ROW_0] = true;

        uint8 prizePercentage = 18;
        if (prizeType == PrizeType.WHOLE_CARD) {
            prizePercentage *= 2;

        }

        uint256 numberOfClaimers = _prizeClaimers[prizeType].length;
        uint256 prizePerClaimer = (
            ((prizePool * prizePercentage) / 100) / numberOfClaimers
        );

        for (uint256 i = numberOfClaimers - 1; i >= 0; i--) {
            address claimer = _prizeClaimers[prizeType][i];
            _prizeClaimers[prizeType].pop();

            _balances[claimer] += prizePerClaimer;
            _unclaimedPrizePool -= prizePerClaimer;
        }
    }

    function _hasGameEnded() private view returns (bool) {
        return _wasClaimed[PrizeType.WHOLE_CARD];
    }

    function _finishGame() private {
        gameState = GameState.GAME_FINISHED;

        _balances[owner] += _unclaimedPrizePool;
        _unclaimedPrizePool = 0;
    }

    /**************************** Oracle functions ****************************/
    function _requestTicket(uint32 ticketID) private {
        Chainlink.Request memory request = buildChainlinkRequest(
            _apiOracle.jobID,
            address(this),
            this.fulfillTicketRequest.selector
        );

        string memory getURL = string(
            abi.encodePacked(
                "https://polybingo.com/api/v1/", // TODO - Update API URI
                "?gameid=",symbol(),
                "&ticketid=",Strings.toString(ticketID)
            )
        );

        request.add("get", getURL);
        request.add("path", "ticket");

        bytes32 requestID = sendChainlinkRequestTo(
            _apiOracle.oracle,
            request,
            _apiOracle.fee
        );

        _requestToTicketID[requestID] = ticketID;
        _unfulfilledRequestCount++;
    }

    function fulfillTicketRequest(
        bytes32 requestID,
        bytes32 ticket
    ) public recordChainlinkFulfillment(requestID) {
        require(_requestToTicketID[requestID] > 0, "Request was already fulfilled");

        // TODO - verify how API failures are handled
        uint32 ticketID = _requestToTicketID[requestID];
        uint8 bitsToShiftForArrayTrim = 8 * (32 - 15);
        ticketIDToTicket[ticketID] = bytes15(ticket << bitsToShiftForArrayTrim);

        delete _requestToTicketID[requestID];
        _unfulfilledRequestCount--;
    }

    function _requestRandomNumber() private {
        require(LINK.balanceOf(address(this)) >= _randOracle.fee, "Not enough LINK");
        _unfulfilledRandomness = true;
        requestRandomness(_randOracle.keyHash, _randOracle.fee);
    }

    function fulfillRandomness(bytes32, uint256 randomness) internal override {
        uint8 drawnNumber = uint8((randomness % 90) + 1);
        drawnNumbersBitmap &= (uint96(1) << drawnNumber);

        emit NewNumberDrawn(drawnNumber);

        _unfulfilledRandomness = false;
    }

    /********************* NFT functions functions ********************/
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        return string(
            abi.encodePacked(
                _baseURI(),"/",symbol(),"/",Strings.toString(tokenId),".json" // TODO - verifty if the right path
            )
        );
    }

    function _baseURI() internal view override virtual returns (string memory) {
        return _ipfsDirectoryURI;
    }
}