async function main() {
  deployer = "0x1E7E3B37a113F1F7163D86C51441f2569E3088f0"
  gameSettings = {
    "gameName": "SomeGame",
    "gameSymbol": "SMGM",
    "ticketPrice": "100000000000000000",
    "minSecondsBeforeGameStarts": 300,
    "minSecondsBetweenSteps": 30,
    "ipfsDirectoryURI": "ipns://k51qzi5uqu5djuxna2e4m5lkszmgj8z7bojvsin778i36nx3j0amujp8nj3z6z"
  }
  vrfSettings = {
    "oracle": "0x8C7382F9D8f56b33781fE506E897a4F1e2d17255",
    "keyHash": "0x6e75b569a01ef56d18cab6a8e71e6600d6ce853834d4a5748b720d06f878b3a4",
    "fee": "10000000000000010"
  }
  apiSettings = {
    "oracle": "0x0bDDCD124709aCBf9BB3F824EbC61C87019888bb",
    "jobID": ethers.utils.toUtf8Bytes("c6a006e4f4844754a6524445acde84a0"),
    "fee": "10000000000000010"
  }
  linkAddress = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB"

  bingoGameAddress = "0xb923119d1C7ADEaE11e4bfd94097C268E97Af609"
  await hre.run("verify:verify", {
    address: bingoGameAddress,
    constructorArguments: [
      deployer,
      gameSettings,
      vrfSettings,
      linkAddress
    ],
  });

  bingoTicketsAddress = "0x3cc94aD18aE584c4ae1Fa67500486B7C63C557f6"
  await hre.run("verify:verify", {
    address: bingoTicketsAddress,
    constructorArguments: [
      bingoGameAddress,
      gameSettings.gameName,
      gameSettings.gameSymbol,
      gameSettings.ipfsDirectoryURI,
      linkAddress,
      apiSettings
    ],
  });

  bingoGameDeployer = "0x28Da3b982987cF06359BAbF5Ef1cf20749905140"
  bingoTicketsDeployer = "0xdA7459c02CE2D85b93b389EE0400f42432189bC9"
  bingoGameFactoryAddress = "0xd4318EcdcDfdf7c5a7f21dc5507F0639339Ae6De"
  await hre.run("verify:verify", {
    address: bingoGameFactoryAddress,
    constructorArguments: [
      bingoGameDeployer,
      bingoTicketsDeployer,
      linkAddress,
      vrfSettings,
      apiSettings
    ],
  });
}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});

