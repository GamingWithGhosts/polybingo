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
    "fee": "1000000000000000"
  }
  apiSettings = {
    "oracle": "0x0bDDCD124709aCBf9BB3F824EbC61C87019888bb",
    "jobID": ethers.utils.toUtf8Bytes("c6a006e4f4844754a6524445acde84a0"),
    "fee": "10000000000000000"
  }
  linkAddress = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB"

  bingoGameAddress = "0x846DA56f1E4aD7bEbc4FB5a19db4411f36e2E91b"
  await hre.run("verify:verify", {
    address: bingoGameAddress,
    constructorArguments: [
      deployer,
      gameSettings,
      vrfSettings,
      linkAddress
    ],
  });

  bingoTicketsAddress = "0x128a72512609C48ED884FE3Aeb55c6E19eD7E35b"
  await hre.run("verify:verify", {
    address: bingoTicketsAddress,
    constructorArguments: [
      bingoGameAddress,
      gameSettings.gameName,
      gameSettings.gameSymbol,
      gameSettings.ipfsDirectoryURI,
      linkAddress,
      vrfSettings
    ],
  });

  bingoGameDeployer = "0x09E6ea4CC0c09c74E5fb905859da7568b5881c65"
  bingoTicketsDeployer = "0xD9b5845649334c252738D64ffEF9427a6D1C1d65"
  bingoGameFactoryAddress = "0xbe97F10e8b2Db69aC9e3CD5CbBeb8c5e708Cb0AD"
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

