// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import { BingoTickets } from "./BingoTickets.sol";
import { GameStructs } from "./GameStructs.sol";
import { OracleStructs } from "./OracleStructs.sol";

import "hardhat/console.sol";

contract BingoTicketsDeployer {
    function deploy(
        address owner,
        address linkTokenAddress,
        OracleStructs.API calldata apiOracleSettings,
        GameStructs.GameSettings calldata gameSettings
    ) public returns(address ticketsAddress) {
        BingoTickets tickets = new BingoTickets(
            owner,
            gameSettings.gameName,
            gameSettings.gameSymbol,
            gameSettings.ipfsDirectoryURI,
            linkTokenAddress,
            apiOracleSettings
        );

        return address(tickets);
    }
}

