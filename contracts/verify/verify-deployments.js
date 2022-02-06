async function main() {
  deployer = "0x1E7E3B37a113F1F7163D86C51441f2569E3088f0"
  gameSettings = {
    "gameName": "TestGame3",
    "gameSymbol": "TST3",
    "ticketPrice": "100000000000000000",
    "minSecondsBeforeGameStarts": 1,
    "minSecondsBetweenSteps": 1,
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

  bingoGameAddress = "0x06773A3F378F299aA6530be3d68aCD4a0F5BC25F"
  await hre.run("verify:verify", {
    address: bingoGameAddress,
    constructorArguments: [
      deployer,
      gameSettings,
      vrfSettings,
      linkAddress
    ],
  });

  bingoTicketsAddress = "0x1CB50b186d80c2E535E46295f704475AA72eab48"
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

  bingoGameDeployer = "0x9613F2131FEF8f55fC3343D0399E6Ce0F027a0d7"
  bingoTicketsDeployer = "0x85f07e1257b8E7e106be82Fa3252Bebdc6B5A018"
  bingoGameFactoryAddress = "0x9F1054DeC552EA5Eb3146D6Ec3cD0DcC52fE05E3"
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

