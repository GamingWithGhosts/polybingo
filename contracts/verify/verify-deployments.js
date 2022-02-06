async function main() {
  deployer = "0x1E7E3B37a113F1F7163D86C51441f2569E3088f0"
  gameSettings = {
    "gameName": "TestGame2",
    "gameSymbol": "TST2",
    "ticketPrice": "100000000000000000",
    "minSecondsBeforeGameStarts": 300,
    "minSecondsBetweenSteps": 30,
    "ipfsDirectoryURI": "ipns://k51qzi5uqu5djuxna2e4m5lkszmgj8z7bojvsin778i36nx3j0amujp8nj3z6z"
  }
  vrfSettings = {
    "oracle": "0x8C7382F9D8f56b33781fE506E897a4F1e2d17255",
    "keyHash": "0x6e75b569a01ef56d18cab6a8e71e6600d6ce853834d4a5748b720d06f878b3a4",
    "fee": "100000000000000000"
  }
  apiSettings = {
    "oracle": "0xc8D925525CA8759812d0c299B90247917d4d4b7C",
    "jobID": ethers.utils.toUtf8Bytes("a7330d0b4b964c05abc66a26307047c0"),
    "fee": "100000000000000000"
  }
  linkAddress = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB"

  bingoGameAddress = "0x443B7173c9b92cdFed05c3e509403cc5F491F340"
  await hre.run("verify:verify", {
    address: bingoGameAddress,
    constructorArguments: [
      deployer,
      gameSettings,
      vrfSettings,
      linkAddress
    ],
  });

  bingoTicketsAddress = "0xa6fC4390b58F8486A2BaC451337b3261181e742B"
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

  bingoGameDeployer = "0x07163A75916e9a19B564E7b12EE064f3C006A707"
  bingoTicketsDeployer = "0x85f07e1257b8E7e106be82Fa3252Bebdc6B5A018"
  bingoGameFactoryAddress = "0x452F3f8019BC83E1118054046C9Be3bb3D796364"
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

