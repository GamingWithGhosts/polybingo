let { networkConfig } = require('../helper-hardhat-config')

module.exports = async ({
  getNamedAccounts,
  deployments,
  someArgs
}) => {
  const { deploy, log, get } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = await getChainId()
  let linkTokenAddress
  let oracle
  let additionalMessage = ""
  //set log level to ignore non errors
  ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

  // Only deploy for testing
  if (chainId == 31337) {
    let linkToken = await get('LinkToken')
    let MockOracle = await get('MockOracle')
    linkTokenAddress = linkToken.address
    oracle = MockOracle.address
    additionalMessage = " --linkaddress " + linkTokenAddress

    const jobId = ethers.utils.toUtf8Bytes(networkConfig[chainId]['jobId'])
    const fee = networkConfig[chainId]['fee']
    const networkName = networkConfig[chainId]['name']
    const gameSettings = {
      'gameName': "TestGame",
      'gameSymbol': "TST",
      'ticketPrice': "100000000000000000",
      'minSecondsBeforeGameStarts': 600, // 10 minutes
      'minSecondsBetweenSteps': 60
    }
    const oracleSettings = {
      'oracleAddress': oracle,
      'oracleJobID': jobId,
      'oracleFee': fee,
      'linkTokenAddress': linkTokenAddress
    }

    const bingoGame = await deploy('BingoGame', {
      from: deployer,
      args: [gameSettings, oracleSettings],
      log: true
    })

    log("Run API Consumer contract with following command:")
    log("npx hardhat request-data --contract " + bingoGame.address + " --network " + networkName)
    log("----------------------------------------------------")
  }
}
module.exports.tags = ['all', 'api', 'main']
