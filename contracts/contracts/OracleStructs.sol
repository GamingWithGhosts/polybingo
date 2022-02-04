// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

library OracleStructs {
    struct Randomness {
        address oracle;
        bytes32 keyHash;
        uint256 fee;
    }

    struct API {
        address oracle;
        bytes32 jobID;
        uint256 fee;
    }
}