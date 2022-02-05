// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import { BingoGame } from "./BingoGame.sol";
import { BingoGameDeployer } from "./BingoGameDeployer.sol";
import { BingoTickets } from "./BingoTickets.sol";
import { BingoTicketsDeployer } from "./BingoTicketsDeployer.sol";
import { GameStructs } from "./GameStructs.sol";
import { OracleStructs } from "./OracleStructs.sol";

import "hardhat/console.sol";

contract BingoGameFactory {
    address[] private _games;
    BingoGameDeployer private _gameDeployer;
    BingoTicketsDeployer private _ticketsDeployer;

    event BingoGameCreated(address gameAddress, string name, string symbol);

    OracleStructs.Randomness private _randomnessOracleSettings;
    OracleStructs.API private _apiOracleSettings;
    address private immutable _linkTokenAddress;

    constructor(
        address gameDeployerAddress,
        address ticketsDeployerAddress,
        address linkTokenAddress,
        OracleStructs.Randomness memory randomnessOracleSettings,
        OracleStructs.API memory apiOracleSettings
    ) {
        _gameDeployer = BingoGameDeployer(gameDeployerAddress);
        _ticketsDeployer = BingoTicketsDeployer(ticketsDeployerAddress);
        _linkTokenAddress = linkTokenAddress;
        _randomnessOracleSettings = randomnessOracleSettings;
        _apiOracleSettings = apiOracleSettings;
    }

    function createGame(
        GameStructs.GameSettings calldata gameSettings
    ) external returns (address gameAddress) {
        address newGameContract = _gameDeployer.deploy(
            msg.sender,
            _linkTokenAddress,
            _randomnessOracleSettings,
            gameSettings
        );

        address newTicketsContract = _ticketsDeployer.deploy(
            newGameContract,
            _linkTokenAddress,
            _apiOracleSettings,
            gameSettings
        );

        BingoGame(newGameContract).setTicketsContract(newTicketsContract);

        _games.push(newGameContract);

        emit BingoGameCreated(
            address(newGameContract),
            gameSettings.gameName,
            gameSettings.gameSymbol
        );

        return newGameContract;
    }

    function getAllGames() external view returns (address[] memory) {
        return _games;
    }
}