// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "hardhat/console.sol";

contract BingoGame is ERC721, ChainlinkClient {
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
        GAME_STARTED,
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
        address oracleAddress;
        bytes32 oracleJobID;
        uint256 oracleFee;
        address linkTokenAddress;
    }
    /********************************* Events *********************************/
    event TicketSaleEnded();
    event GameStarted();

    /***************************** Public members *****************************/
    address payable public immutable owner;
    uint256 public immutable ticketPrice;
    uint256 public immutable minGameStartTime;
    uint16  public immutable minSecondsBetweenSteps;

    GameState public gameState = GameState.TICKET_SALE;

    mapping(uint32 => bytes15) public ticketIDToTicket;

    uint96 public drawnNumbersBitmap;
    uint256 public prizePool;

    /***************************** Private members ****************************/
    string private _ipfsDirectoryURI;
    TicketGenerationOracle private _oracle;

    Counters.Counter private _tokenIDs;

    mapping(bytes32 => uint32) private _requestToTicketID;
    uint32 private _unfulfilledRequestCount = 0;

    /**************************** Public functions ****************************/
    constructor(
        GameSettings memory settings,
        TicketGenerationOracle memory oracleSettings
    ) ERC721(settings.gameName, settings.gameSymbol) {
        owner = payable(msg.sender);

        ticketPrice = settings.ticketPrice;
        minGameStartTime = block.timestamp + settings.minSecondsBeforeGameStarts;
        minSecondsBetweenSteps = settings.minSecondsBetweenSteps;
        _ipfsDirectoryURI = settings.ipfsDirectoryURI;

        _oracle = oracleSettings;
        if (oracleSettings.linkTokenAddress == address(0)) {
            setPublicChainlinkToken();
        } else {
            setChainlinkToken(oracleSettings.linkTokenAddress);
        }
    }

    function buyTicket() external payable returns (uint32 ticketID) {
        require(gameState == GameState.TICKET_SALE, "Ticket sale has ended");
        require(msg.value >= ticketPrice, "Not enough coin for ticket");

        _tokenIDs.increment();
        uint32 _ticketID = uint32(_tokenIDs.current());

        _requestTicket(_ticketID);
        _mint(msg.sender, _ticketID);

        prizePool += ticketPrice;

        return _ticketID;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        return string(
            abi.encodePacked(
                _baseURI(),"/",symbol(),"/",Strings.toString(tokenId),".json" // TODO - verifty if the right path
            )
        );
    }

    function startGame() external {
        require(block.timestamp >= minGameStartTime, "Too early to start the game");
        require(gameState < GameState.GAME_STARTED, "Game already started");

        if (gameState == GameState.TICKET_SALE) {
            gameState = GameState.WAITING_FOR_TICKET_FULFILLMENT;
            emit TicketSaleEnded();
        }

        if ((gameState == GameState.WAITING_FOR_TICKET_FULFILLMENT) &&
            (_unfulfilledRequestCount == 0)) {
            gameState = GameState.GAME_STARTED;
            emit GameStarted();
        }
        /*
            1. Verify that minSecondsBeforeGameStarts passed
            2. Stop minting
            3. Verify fullfilment
            4. Stop additional calls to the function
        */
    }

    function finalizeStepAndDrawNextNumber() external pure returns (uint8 nextNumber) {
        /*
            1. Distribute prizes from previous round
            2. Check if game has ended
            3. If game ended distribute money to owner & lock function
            4. Draw new number
        */

        // emit NumberDrawn

    // function transfer(address payable _to, uint _amount) public {
    //     // Note that "to" is declared as payable
    //     (bool success, ) = _to.call{value: _amount}("");
    //     require(success, "Failed to send Ether");
    // }
        return 0xFF;
    }

    function claimPrize(
        uint32 ticketID,
        PrizeType prizeType
    ) external pure returns (bool didClaim) {
        /*
            1. Check if prize is unclaimed.
            2. Check if ticket wins prize.
            3. Add ticket owner to claimers.
        */

        // emit PriceClaimed(claimer/tokenID/prizeType)

        return false;
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

    /**************************** Private functions ***************************/
    function _baseURI() internal view override virtual returns (string memory) {
        return _ipfsDirectoryURI;
    }

    function _requestTicket(uint32 ticketID) private {
        Chainlink.Request memory request = buildChainlinkRequest(
            _oracle.oracleJobID,
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
            _oracle.oracleAddress,
            request,
            _oracle.oracleFee
        );

        _requestToTicketID[requestID] = ticketID;
        _unfulfilledRequestCount++;
    }

    // TODO - function withdrawLink() external {} - Implement a withdraw function to avoid locking your LINK in the contract

}