// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

import { BingoTickets } from "./BingoTickets.sol";
import { GameStructs } from "./GameStructs.sol";
import { OracleStructs } from "./OracleStructs.sol";

import "hardhat/console.sol";

contract BingoGame is VRFConsumerBase {
    /********************************* Enums **********************************/
    enum PrizeType {
        ROW_0,
        ROW_1,
        ROW_2,
        WHOLE_CARD
    }

    enum GameState {
        NOT_INITIALIZED,
        TICKET_SALE,
        WAITING_FOR_TICKET_FULFILLMENT,
        GAME_IN_PROGRESS,
        GAME_FINISHED
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

    OracleStructs.Randomness private _randOracle;

    /********************************* Tickets ********************************/
    BingoTickets public bingoTickets;

    /******************************* Game state *******************************/
    GameState public gameState;
    uint96 public drawnNumbersBitmap;
    bool private _unfulfilledRandomness;
    uint256 private _lastStepTime;

    /********************************* Prizes *********************************/
    uint256 public prizePool;
    uint256 private _unclaimedPrizePool;

    mapping(address => uint256) public winnings;
    mapping(PrizeType => bool) private _wasClaimed;
    mapping(PrizeType => address[]) private _prizeClaimers;

    /************************* Game control functions **************************/
    constructor(
        address gameOwner,
        GameStructs.GameSettings memory settings,
        OracleStructs.Randomness memory randomnessOracleSettings,
        address linkTokenAddress
    ) VRFConsumerBase(randomnessOracleSettings.oracle, linkTokenAddress) {
        owner = gameOwner;

        ticketPrice = settings.ticketPrice;
        minGameStartTime = block.timestamp + settings.minSecondsBeforeGameStarts;
        minSecondsBetweenSteps = settings.minSecondsBetweenSteps;

        _randOracle = randomnessOracleSettings;
    }

    function setTicketsContract(address ticketsContractAddress) public {
        require(gameState == GameState.NOT_INITIALIZED, "Must be not inited");
        bingoTickets = BingoTickets(ticketsContractAddress);
        gameState = GameState.TICKET_SALE;
    }

    function startGame() external {
        require(block.timestamp >= minGameStartTime, "Too early to start the game");
        require(gameState != GameState.NOT_INITIALIZED, "Must be inited");
        require(gameState < GameState.GAME_IN_PROGRESS, "Game already started");

        if (gameState == GameState.TICKET_SALE) {
            gameState = GameState.WAITING_FOR_TICKET_FULFILLMENT;
            emit TicketSaleEnded();
        }

        if ((gameState == GameState.WAITING_FOR_TICKET_FULFILLMENT) &&
            (bingoTickets.unfulfilledRequestCount() == 0)) {
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

    function withdrawLink() external {
        require(gameState != GameState.NOT_INITIALIZED, "Must be inited");
        bingoTickets.withdrawLink();

        uint256 linkLeft = LINK.balanceOf(address(this));
        bool success = LINK.transfer(owner, linkLeft);
        require(success, "LINK transfter failed");
    }

    /**************************** Player functions ****************************/
    function buyTicket() external payable returns (uint32 ticketID) {
        require(gameState == GameState.TICKET_SALE, "Ticket sale has ended");
        require(msg.value >= ticketPrice, "Not enough coin for ticket");

        prizePool += ticketPrice;
        _unclaimedPrizePool += ticketPrice;

        return bingoTickets.mintTicket(msg.sender);
    }

    function claimPrize(
        uint32 ticketID,
        PrizeType prizeType
    ) external returns (bool didClaim) {
        require(gameState != GameState.NOT_INITIALIZED, "Must be inited");
        require(_wasClaimed[prizeType] == false, "Prize was already claimed");

        bytes15 ticket = bingoTickets.ticketIDToTicket(ticketID);
        require(_isWinningTicket(ticket, prizeType) == true, "Non winning ticket");

        address claimer = bingoTickets.ownerOf(ticketID);
        _prizeClaimers[prizeType].push(claimer);

        emit PrizeClaimed(claimer, ticketID, prizeType);
        return true;
    }

    function withdraw() public {
        uint256 amount = winnings[msg.sender];
        winnings[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");

        if (success == false) {
            winnings[msg.sender] = amount;
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

        _wasClaimed[prizeType] = true;

        uint8 prizePercentage = 18;
        if (prizeType == PrizeType.WHOLE_CARD) {
            prizePercentage *= 2;

        }

        uint256 numberOfClaimers = _prizeClaimers[prizeType].length;
        uint256 prizePerClaimer = (
            ((prizePool * prizePercentage) / 100) / numberOfClaimers
        );

        for (uint256 i = numberOfClaimers; i > 0; i--) {
            address claimer = _prizeClaimers[prizeType][i-1];
            _prizeClaimers[prizeType].pop();

            winnings[claimer] += prizePerClaimer;
            _unclaimedPrizePool -= prizePerClaimer;
        }
    }

    function _hasGameEnded() private view returns (bool) {
        return _wasClaimed[PrizeType.WHOLE_CARD];
    }

    function _finishGame() private {
        gameState = GameState.GAME_FINISHED;

        winnings[owner] += _unclaimedPrizePool;
        _unclaimedPrizePool = 0;
    }

    /**************************** Oracle functions ****************************/
    function _requestRandomNumber() private {
        require(LINK.balanceOf(address(this)) >= _randOracle.fee, "Not enough LINK");
        _unfulfilledRandomness = true;
        requestRandomness(_randOracle.keyHash, _randOracle.fee);
    }

    function fulfillRandomness(bytes32, uint256 randomness) internal override {
        uint8 drawnNumber = uint8((randomness % 90) + 1);
        drawnNumbersBitmap |= (uint96(1) << drawnNumber);

        emit NewNumberDrawn(drawnNumber);

        _unfulfilledRandomness = false;
    }
}