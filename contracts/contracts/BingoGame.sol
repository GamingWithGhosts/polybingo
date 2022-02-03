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
    }

    struct TicketGenerationOracle {
        address oracleAddress;
        bytes32 oracleJobID;
        uint256 oracleFee;
        address linkTokenAddress;
    }

    address payable public immutable owner;
    uint256 public immutable ticketPrice;
    uint256 public immutable minGameStartTime;
    uint16  public immutable minSecondsBetweenSteps;

    GameState public gameState = GameState.TICKET_SALE;
    mapping(uint32 => bytes15) public ticketIDToTicket;

    Counters.Counter private _tokenIDs;
    TicketGenerationOracle private _oracle;

    mapping(bytes32 => uint32) private _requestToTicketID;
    uint32 private _unfulfilledRequestCount = 0;

    // uint96 public drawnNumbersBitmap;

    constructor(
        GameSettings memory settings,
        TicketGenerationOracle memory oracleSettings
    ) ERC721(settings.gameName, settings.gameSymbol) {
        owner = payable(msg.sender);

        ticketPrice = settings.ticketPrice;
        minGameStartTime = block.timestamp + settings.minSecondsBeforeGameStarts;
        minSecondsBetweenSteps = settings.minSecondsBetweenSteps;

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

        return _ticketID;
    }

    function startGame() external {
        /*
            1. Verify that minSecondsBeforeGameStarts passed
            2. Stop minting
            3. Verify fullfilment
            4. Stop additional calls to the function
        */
        gameState = GameState.GAME_STARTED;
    }

    function finalizeStepAndDrawNextNumber() external pure returns (uint8 nextNumber) {
        /*
            1. Distribute prizes from previous round
            2. Check if game has ended
            3. If game ended distribute money to owner & lock function
            4. Draw new number
        */
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
        return false;
    }

    function fulfillTicketRequest(
        bytes32 requestID,
        bytes32 ticket
    ) public recordChainlinkFulfillment(requestID) {
        require(_requestToTicketID[requestID] > 0, "Request was already fulfilled");

        uint8 bitsToShift = 8 * (32 - 15);
        ticketIDToTicket[_requestToTicketID[requestID]] = bytes15(ticket << bitsToShift);

        delete _requestToTicketID[requestID];
        _unfulfilledRequestCount--;
    }

    function _baseURI() internal view override virtual returns (string memory) {
        return "something ipfs bla bla bla";
    }

    function _requestTicket(uint32 ticketID) private {
        Chainlink.Request memory request = buildChainlinkRequest(
            _oracle.oracleJobID,
            address(this),
            this.fulfillTicketRequest.selector
        );

        string memory getURL = string(
            abi.encodePacked(
                " https://polybingo.com/api/v1.0/ticket?Id=",
                symbol(),
                "-",
                Strings.toString(ticketID)
            )
        );
        request.add("get", getURL);

        bytes32 requestID = sendChainlinkRequestTo(
            _oracle.oracleAddress,
            request,
            _oracle.oracleFee
        );

        _requestToTicketID[requestID] = ticketID;
        _unfulfilledRequestCount++;
    }

    // function withdrawLink() external {} - Implement a withdraw function to avoid locking your LINK in the contract


    // function transfer(address payable _to, uint _amount) public {
    //     // Note that "to" is declared as payable
    //     (bool success, ) = _to.call{value: _amount}("");
    //     require(success, "Failed to send Ether");
    // }
}