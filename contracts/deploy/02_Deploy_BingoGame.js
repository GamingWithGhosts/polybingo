let { networkConfig } = require('../helper-hardhat-config')

module.exports = async ({
  getNamedAccounts,
  deployments
}) => {
  const { deploy, log, get } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = await getChainId()
  let linkTokenAddress

  //set log level to ignore non errors
  ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

  // Only deploy for testing
  if (chainId == 31337) {
    let linkToken = await get('LinkToken')

    const apiJobId = ethers.utils.toUtf8Bytes(networkConfig[chainId]['jobId'])
    const MockOracle = await get('MockOracle')
    apiOracle = MockOracle.address

    const randomnessKeyHash = networkConfig[chainId]['keyHash']
    const VRFCoordinatorMock = await get('VRFCoordinatorMock')
    randomnessOracle = VRFCoordinatorMock.address

    linkTokenAddress = linkToken.address

    const fee = networkConfig[chainId]['fee']
    const networkName = networkConfig[chainId]['name']
    const gameSettings = {
      'gameName': "TestGame",
      'gameSymbol': "TST",
      'ticketPrice': "100000000000000000",
      'minSecondsBeforeGameStarts': 600, // 10 minutes
      'minSecondsBetweenSteps': 60,
      'ipfsDirectoryURI': "https://ipfs.io/something-static"
    }
    const randomnessOracleSettings = {
      'oracle': randomnessOracle,
      'keyHash': randomnessKeyHash,
      'fee': fee
    }
    const apiOracleSettings = {
      'oracle': apiOracle,
      'jobID': apiJobId,
      'fee': fee
    }

    const bingoGame = await deploy('BingoGame', {
      from: deployer,
      args: [
        gameSettings,
        randomnessOracleSettings,
        apiOracleSettings,
        linkTokenAddress
      ],
      log: true
    })

    log("Run API Consumer contract with following command:")
    log("npx hardhat request-data --contract " + bingoGame.address + " --network " + networkName)
    log("----------------------------------------------------")
  }
}
module.exports.tags = ['all', 'api', 'main']
