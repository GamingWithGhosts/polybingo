const { networkConfig, autoFundCheck } = require('../helper-hardhat-config')
const { ethers, getNamedAccounts } = require('hardhat')

module.exports = async ({
  getNamedAccounts,
  deployments
}) => {
  const { deploy, log, get } = deployments
  const chainId = await getChainId()
  let linkTokenAddress
  let additionalMessage = ""
  //set log level to ignore non errors
  ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)
  const networkName = networkConfig[chainId]['name']

  // Fund only on local network
  if (chainId == 31337) {
    linkToken = await get('LinkToken')
    MockOracle = await get('MockOracle')
    linkTokenAddress = linkToken.address
    oracle = MockOracle.address
    additionalMessage = " --linkaddress " + linkTokenAddress

    //Try Auto-fund APIConsumer contract with LINK
    const BingoGame = await deployments.get('BingoGame')
    const bingoGame = await ethers.getContractAt('BingoGame', BingoGame.address)

    if (await autoFundCheck(bingoGame.address, networkName, linkTokenAddress, additionalMessage)) {
      await hre.run("fund-link", { contract: bingoGame.address, linkaddress: linkTokenAddress })
    } else {
      log("Then run BingoGame contract with following command:")
      log("npx hardhat request-data --contract " + bingoGame.address + " --network " + networkName)
    }
    log("----------------------------------------------------")
  }
}
module.exports.tags = ['all']
