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

  const bingoGame = await deploy('BingoGame', {
    from: deployer,
    args: [
      deployer,
      {
        "gameName": "SomeGame",
        "gameSymbol": "SMGM",
        "ticketPrice": "100000000000000000",
        "minSecondsBeforeGameStarts": 300,
        "minSecondsBetweenSteps": 30,
        "ipfsDirectoryURI": "ipns://k51qzi5uqu5djuxna2e4m5lkszmgj8z7bojvsin778i36nx3j0amujp8nj3z6z"
      },
      randomnessOracleSettings,
      linkTokenAddress,
    ],
    log: true
  });
  const bingoTickets = await deploy('BingoTickets', {
    from: deployer,
    args: [
      bingoGame.address,
      "SomeGame",
      "SMGM",
      "ipns://k51qzi5uqu5djuxna2e4m5lkszmgj8z7bojvsin778i36nx3j0amujp8nj3z6z",
      linkTokenAddress,
      apiOracleSettings
    ],
    log: true
  });

  log("Run BingoGame & Tickets contract with following command:");
  log("npx hardhat request-data --contract " + bingoGame.address + " --network " + networkName);
  log("npx hardhat request-data --contract " + bingoTickets.address + " --network " + networkName);
  log("----------------------------------------------------");
}

module.exports.tags = ['all', 'factory', 'main']
