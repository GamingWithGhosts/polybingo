// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

library GameStructs {
    struct GameSettings {
        string  gameName;
        string  gameSymbol;
        uint256 ticketPrice; // 1 matic = 10 ** 18
        uint24  minSecondsBeforeGameStarts;
        uint16  minSecondsBetweenSteps;
        string  ipfsDirectoryURI;
    }
}