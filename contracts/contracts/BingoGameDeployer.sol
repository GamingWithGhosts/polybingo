// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import { BingoGame } from "./BingoGame.sol";
import { GameStructs } from "./GameStructs.sol";
import { OracleStructs } from "./OracleStructs.sol";

import "hardhat/console.sol";

contract BingoGameDeployer {
    function deploy(
        address owner,
        address linkTokenAddress,
        OracleStructs.Randomness calldata randomnessOracleSettings,
        GameStructs.GameSettings calldata gameSettings
    ) public returns(address gameAddress) {
        BingoGame game = new BingoGame(
            owner,
            gameSettings,
            randomnessOracleSettings,
            linkTokenAddress
        );

        return address(game);
    }
}