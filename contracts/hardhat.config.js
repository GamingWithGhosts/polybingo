/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require("@appliedblockchain/chainlink-plugins-fund-link")
require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-ethers")
require("@nomiclabs/hardhat-truffle5")
require('hardhat-contract-sizer');
require("hardhat-deploy")
require("hardhat-gas-reporter")
require("solidity-coverage")

require('dotenv').config()

const POLYGON_TESTNET_MUMBAI_RPC_URL = process.env.POLYGON_TESTNET_MUMBAI_RPC_URL || "https://matic-mumbai.chainstacklabs.com/"
const POLYGON_MAINNET_RPC_URL = process.env.POLYGON_MAINNET_RPC_URL || "https://polygon-mainnet.alchemyapi.io/v2/your-api-key"
// optional
const PRIVATE_KEY = process.env.PRIVATE_KEY || "your private key"

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
        },
        localhost: {
        },
        mumbai: {
            url: POLYGON_TESTNET_MUMBAI_RPC_URL,
            accounts: [PRIVATE_KEY],
            gas: 10000000,
            gasPrice: 8000000000,
            saveDeployments: true,
        },
        polygon: {
            url: POLYGON_MAINNET_RPC_URL,
            accounts: [PRIVATE_KEY],
            saveDeployments: true,
        },
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS !== undefined,
        currency: "USD",
    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
            1: 0 // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
        },
        feeCollector: {
            default: 1
        }
    },
    solidity: {
        compilers: [
            {
                version: "0.8.7",
                optimizer: {
                   enabled: true,
                   runs: 20000,
               }
            },
            {
                version: "0.6.6",
                optimizer: {
                   enabled: true,
                   runs: 20000,
               }
            },
            {
                version: "0.4.24",
                optimizer: {
                   enabled: true,
                   runs: 20000,
               }
            }
        ]
    },
    mocha: {
        timeout: 300000
    }
}