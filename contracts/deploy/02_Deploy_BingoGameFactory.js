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
  const apiFee = networkConfig[chainId]['apiFee'];
  const vrfFee = networkConfig[chainId]['vrfFee'];
  const networkName = networkConfig[chainId]['name'];

  const randomnessOracleSettings = {
    'oracle': vrfOracleAddress,
    'keyHash': vrfKeyHash,
    'fee': vrfFee
  };
  const apiOracleSettings = {
    'oracle': apiOracleAddress,
    'jobID': apiJobId,
    'fee': apiFee
  };

  const bingoGameDeployer = await deploy('BingoGameDeployer', {
    from: deployer,
    args: [],
    log: true
  });
  const bingoTicketsDeployer = await deploy('BingoTicketsDeployer', {
    from: deployer,
    args: [],
    log: true
  });
  const bingoGameFactory = await deploy('BingoGameFactory', {
    from: deployer,
    args: [
      bingoGameDeployer.address,
      bingoTicketsDeployer.address,
      linkTokenAddress,
      randomnessOracleSettings,
      apiOracleSettings,
    ],
    log: true
  });

  log("Run BingoGameFactory contract with following command:");
  log("npx hardhat request-data --contract " + bingoGameFactory.address + " --network " + networkName);
  log("----------------------------------------------------");
}

module.exports.tags = ['all', 'factory', 'main']
