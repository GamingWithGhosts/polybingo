// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import { OracleStructs } from "./OracleStructs.sol";
import { BingoGame } from "./BingoGame.sol";

import "hardhat/console.sol";

contract BingoGameFactory {
    BingoGame[] private _games;

    event BingoGameCreated(address gameAddress, string name, string symbol);

    OracleStructs.Randomness private _randomnessOracleSettings;
    OracleStructs.API private _apiOracleSettings;
    address private immutable _linkTokenAddress;

    constructor(
        OracleStructs.Randomness memory randomnessOracleSettings,
        OracleStructs.API memory apiOracleSettings,
        address linkTokenAddress
    ) {
        _randomnessOracleSettings = randomnessOracleSettings;
        _apiOracleSettings = apiOracleSettings;
        _linkTokenAddress = linkTokenAddress;
    }

    function createGame(
        BingoGame.GameSettings calldata gameSettings
    ) public {
        BingoGame game = new BingoGame(
            gameSettings,
            _randomnessOracleSettings,
            _apiOracleSettings,
            _linkTokenAddress
        );
        _games.push(game);

        emit BingoGameCreated(address(game), gameSettings.gameName, gameSettings.gameSymbol);
    }

    function getAllGames() external view returns (BingoGame[] memory) {
        return _games;
    }
}