let { networkConfig } = require('../helper-hardhat-config')

module.exports = async ({
  getNamedAccounts,
  deployments
}) => {
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  let linkTokenAddress, apiOracleAddress, vrfOracleAddress;

  //set log level to ignore non errors
  ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR);

  // Only deploy for testing
  if (chainId == 31337) {
    const linkToken = await get('LinkToken');
    const MockOracle = await get('MockOracle');
    const VRFCoordinatorMock = await get('VRFCoordinatorMock');
    linkTokenAddress = linkToken.address;
    apiOracleAddress = MockOracle.address;
    vrfOracleAddress = VRFCoordinatorMock.address;
  } else {
    linkTokenAddress = networkConfig[chainId]['linkToken'];
    apiOracleAddress = networkConfig[chainId]['oracle'];
    vrfOracleAddress = networkConfig[chainId]['vrfCoordinator'];
  }
  const apiJobId = ethers.utils.toUtf8Bytes(networkConfig[chainId]['jobId']);
  const vrfKeyHash = networkConfig[chainId]['keyHash'];
  const fee = networkConfig[chainId]['fee'];
  const networkName = networkConfig[chainId]['name'];

  const randomnessOracleSettings = {
    'oracle': vrfOracleAddress,
    'keyHash': vrfKeyHash,
    'fee': fee
  };
  const apiOracleSettings = {
    'oracle': apiOracleAddress,
    'jobID': apiJobId,
    'fee': fee
  };

  const bingoGameFactory = await deploy('BingoGameFactory', {
    from: deployer,
    args: [
      randomnessOracleSettings,
      apiOracleSettings,
      linkTokenAddress
    ],
    log: true
  });

  log("Run BingoGameFactory contract with following command:");
  log("npx hardhat request-data --contract " + bingoGameFactory.address + " --network " + networkName);
  log("----------------------------------------------------");
}

module.exports.tags = ['all', 'api', 'main']
