const networkConfig = {
    default: {
        name: 'hardhat',
        fee: '100000000000000',
        keyHash: '0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4',
        jobId: '29fa9aa13bf1468788b7cc4a500a45b8',
        fundAmount: "1000000000000000000",
        keepersUpdateInterval: "30"
    },
    31337: {
        name: 'localhost',
        fee: '100000000000000',
        keyHash: '0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4',
        jobId: '29fa9aa13bf1468788b7cc4a500a45b8',
        fundAmount: "1000000000000000000",
        keepersUpdateInterval: "30"
    },
    80001: {
        name: 'mumbai',
        linkToken: '0x326C977E6efc84E512bB9C30f76E30c160eD06FB',
        keyHash: '0x6e75b569a01ef56d18cab6a8e71e6600d6ce853834d4a5748b720d06f878b3a4',
        vrfCoordinator: '0x8C7382F9D8f56b33781fE506E897a4F1e2d17255',
        // // Mumbai Testnet - Matrixed.link
        // oracle: '0x0bDDCD124709aCBf9BB3F824EbC61C87019888bb',
        // jobId: 'c6a006e4f4844754a6524445acde84a0',
        // LinkRiver
        oracle: '0xc8D925525CA8759812d0c299B90247917d4d4b7C',
        jobId: 'a7330d0b4b964c05abc66a26307047c0',
        fee: '100000000000000000',
        fundAmount: "1000000000000000000",
        keepersUpdateInterval: "30"
    },
    137: {
        name: 'polygon',
        linkToken: '0xb0897686c545045afc77cf20ec7a532e3120e0f1',
        keyHash: '0xf86195cf7690c55907b2b611ebb7343a6f649bff128701cc542f0569e2c549da',
        vrfCoordinator: '0x3d2341ADb2D31f1c5530cDC622016af293177AE0',
        oracle: '0x0a31078cd57d23bf9e8e8f1ba78356ca2090569e',
        jobId: '12b86114fa9e46bab3ca436f88e1a912',
        fee: '100000000000000',
        fundAmount: "100000000000000"
    },
}

const developmentChains = ["hardhat", "localhost"]

const getNetworkIdFromName = async (networkIdName) => {
    for (const id in networkConfig) {
        if (networkConfig[id]['name'] == networkIdName) {
            return id
        }
    }
    return null
}

const autoFundCheck = async (contractAddr, networkName, linkTokenAddress, additionalMessage) => {
    const chainId = await getChainId()
    console.log("Checking to see if contract can be auto-funded with LINK:")
    const amount = networkConfig[chainId]['fundAmount']
    //check to see if user has enough LINK
    const accounts = await ethers.getSigners()
    const signer = accounts[0]
    const LinkToken = await ethers.getContractFactory("LinkToken")
    const linkTokenContract = new ethers.Contract(linkTokenAddress, LinkToken.interface, signer)
    const balanceHex = await linkTokenContract.balanceOf(signer.address)
    const balance = await ethers.BigNumber.from(balanceHex._hex).toString()
    const contractBalanceHex = await linkTokenContract.balanceOf(contractAddr)
    const contractBalance = await ethers.BigNumber.from(contractBalanceHex._hex).toString()
    if ((balance > amount) && (amount > 0) && (contractBalance < amount)) {
        //user has enough LINK to auto-fund
        //and the contract isn't already funded
        return true
    } else { //user doesn't have enough LINK, print a warning
        console.log("Account doesn't have enough LINK to fund contracts, or you're deploying to a network where auto funding isnt' done by default")
        console.log("Please obtain LINK via the faucet at https://" + networkName + ".chain.link/, then run the following command to fund contract with LINK:")
        console.log("npx hardhat fund-link --contract " + contractAddr + " --network " + networkName + additionalMessage)
        return false
    }
}

module.exports = {
    networkConfig,
    getNetworkIdFromName,
    autoFundCheck,
    developmentChains
}