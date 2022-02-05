const { networkConfig, autoFundCheck, developmentChains } = require('../../helper-hardhat-config')
const skipIf = require('mocha-skip-if')
const chai = require('chai')
const { expect } = require('chai')
const BN = require('bn.js')
const { getChainId } = require('hardhat')
const {numToBytes32} = require("@chainlink/test-helpers/dist/src/helpers");
chai.use(require('chai-bn')(BN))


async function getContractByName(deployments, name) {
  const Contract = await deployments.get(name);
  return await ethers.getContractAt(name, Contract.address);
}

async function getContracts(deployments) {
  const chainId = await getChainId();
  await deployments.fixture(['mocks', 'api'])

  const linkToken = await getContractByName(deployments, 'LinkToken');
  const mockOracle = await getContractByName(deployments, 'MockOracle');
  const mockVRF = await getContractByName(deployments, 'VRFCoordinatorMock');
  const bingoGame = await getContractByName(deployments, 'BingoGame');
  const bingoTickets = await hre.ethers.getContractAt(
    "BingoTickets",
    await bingoGame.bingoTickets()
  );

  const networkName = networkConfig[chainId]['name']

  linkTokenAddress = linkToken.address
  additionalMessage = " --linkaddress " + linkTokenAddress

  const contractsToFund = [bingoGame, bingoTickets];
  for (contract of contractsToFund) {
    if (await autoFundCheck(contract.address, networkName, linkTokenAddress, additionalMessage)) {
      await hre.run("fund-link", { contract: contract.address, linkaddress: linkTokenAddress })
    }
  }

  return { linkToken, mockOracle, mockVRF, bingoGame, bingoTickets };
}

async function incTimeAndStartGame(bingoGame) {
  await ethers.provider.send("evm_increaseTime", [700]);
  return bingoGame.startGame();
}

async function incTimeAndCallStep(bingoGame) {
  await ethers.provider.send("evm_increaseTime", [70]);
  return bingoGame.finalizeStepAndDrawNextNumber();
}

async function callStepAndFulfillNumber(bingoGame, mockVRF, number) {
  await incTimeAndCallStep(bingoGame);
  await mockVRF.callBackWithRandomness(numToBytes32(0), number - 1, bingoGame.address);
}

async function callStepAndFulfillNumbers(bingoGame, mockVRF, numberList) {
  for (number of numberList) {
    await callStepAndFulfillNumber(bingoGame, mockVRF, number)
  }
}

async function buyMockTicket(bingoGame, bingoTickets, mockOracle, ticketArray, account=null) {
  let requestId;
  bingoTickets.on("ChainlinkRequested", (_id) => {
    requestId = _id;
  });

  if (account) {
    await bingoGame.connect(account).buyTicket({
      value: ethers.utils.parseEther("0.1")
    });
  } else {
    await bingoGame.buyTicket({
      value: ethers.utils.parseEther("0.1")
    });
  }
  await new Promise(res => setTimeout(res, 5000));
  await mockOracle.fulfillOracleRequest(requestId, numToBytes32(ticketArray));
}

skip.if(!developmentChains.includes(network.name)).
  describe('BingoGame Unit Tests', async function () {
    let linkToken, mockOracle, mockVRF, bingoGame, bingoTickets;
    const approxDeploymentTime = parseInt(Date.now() / 1000);

    beforeEach(async () => {
      const contracts = await getContracts(deployments);
      linkToken = contracts.linkToken;
      mockOracle = contracts.mockOracle;
      mockVRF = contracts.mockVRF
      bingoGame = contracts.bingoGame;
      bingoTickets = contracts.bingoTickets;
    });

    afterEach(async () => {
      mockOracle.removeAllListeners()
    });

    describe('Init', async function () {
      it('Owner is set to deployer', async () => {
        const owner = await bingoGame.owner();
        const { deployer } = await getNamedAccounts();

        expect(owner).to.equals(deployer);
      });

      it('gameState is set to TICKET_SALE', async () => {
        const gameState = await bingoGame.gameState();

        expect(gameState).to.equals(0);
      });

      it('ticketPrice is set to 0.1Matic', async () => {
        const ticketPrice = await bingoGame.ticketPrice();
        const expectedTokenPrice = "100000000000000000";

        expect(ticketPrice).to.equals(expectedTokenPrice);
      });

      it('baseURI is Updated', async () => {
        await bingoGame.buyTicket({
          value: ethers.utils.parseEther("0.1")
        });

        const tokenURI = await bingoTickets.tokenURI(1);
        const expectedTokenURI = "https://ipfs.io/something-static/TST/1.json"

        expect(tokenURI).to.equals(expectedTokenURI);
      });

      it('minGameStartTime is set to 10min from now', async () => {
        const minGameStartTime = await bingoGame.minGameStartTime();
        const expectedMinGameStartTime = (approxDeploymentTime + 600);
        const timeDiffSec = Math.abs(minGameStartTime - expectedMinGameStartTime);

        expect(timeDiffSec).to.lessThan(20);
      });

      it('minSecondsBetweenSteps is set to 60s', async () => {
        const minSecondsBetweenSteps = await bingoGame.minSecondsBetweenSteps();

        expect(minSecondsBetweenSteps).to.equals(60);
      });
    });

    describe('Buy ticket', async function () {
      it('Transaction fails if not enough money', async () => {
        const transactionPromise = bingoGame.buyTicket({
          value: ethers.utils.parseEther("0.09")
        });

        await expect(transactionPromise).to.be.revertedWith("Not enough coin for ticket");
      });

      it('Contract receives money', async () => {
        const provider = waffle.provider;
        const oldBalance = await provider.getBalance(bingoGame.address);

        await bingoGame.buyTicket({
          value: ethers.utils.parseEther("0.1")
        });

        const newBalance = await provider.getBalance(bingoGame.address);
        const addedMoney = (newBalance - oldBalance).toString();

        expect(addedMoney).to.equals(ethers.utils.parseEther("0.1"));
      });

      it('Prize pool updated', async () => {
        const oldPrizePool = await bingoGame.prizePool();

        await bingoGame.buyTicket({
          value: ethers.utils.parseEther("0.1")
        });

        const newPrizePool = await bingoGame.prizePool();
        const addedMoney = (newPrizePool - oldPrizePool).toString();

        expect(addedMoney).to.equals(ethers.utils.parseEther("0.1"));
      });

      it('Token owned by buyer', async () => {
        let to, tokenID;
        bingoTickets.on("Transfer", (_from,_to,_tokenID) => {
          to = _to;
          tokenID = _tokenID;
        });
        const transaction = await bingoGame.buyTicket({
          value: ethers.utils.parseEther("0.1")
        });
        await new Promise(res => setTimeout(res, 5000));

        const receipt = await transaction.wait();
        const sender = receipt.from;

        console.log(to, tokenID);
        const tokenOwner = await bingoTickets.ownerOf(tokenID);

        expect(to).to.equals(sender);
        expect(tokenOwner).to.equals(sender);
      });

      it('TokenID incremented', async () => {
        let tokenIDs = [];
        bingoTickets.on("Transfer", (_from,_to,_tokenID) => {
          tokenIDs.push(_tokenID);
        });

        await bingoGame.buyTicket({
          value: ethers.utils.parseEther("0.1")
        });

        await bingoGame.buyTicket({
          value: ethers.utils.parseEther("0.1")
        });
        await new Promise(res => setTimeout(res, 5000));

        expect(tokenIDs[1] - tokenIDs[0]).to.equals(1);
      });

      it('API request for ticket is sent', async () => {
        let requestId;
        bingoTickets.on("ChainlinkRequested", (_id) => {
          requestId = _id;
        });

        await bingoGame.buyTicket({
          value: ethers.utils.parseEther("0.1")
        });
        await new Promise(res => setTimeout(res, 5000));

        expect(requestId).to.not.be.null;
      });

      it('Ticket request is fulfilled', (done) => {
        mockOracle.once("OracleRequest", async (
          _specId,
          _sender,
          requestId,
          _payment,
          _cbAddress,
          _callbackFuncId,
          _expiration,
          _dataVersion,
          _data
        ) => {
            // Mock the fulfillment of the request
            const callbackData = [0x01,0x23,0x45,0x67,0x89,0xAB,0xCD,0xEF,0x01,0x23,0x45,0x67,0x89,0xAB,0xCD];
            const callbackDataBytes32 = numToBytes32(callbackData);
            await mockOracle.fulfillOracleRequest(requestId, callbackDataBytes32);

            const ticket = await bingoTickets.ticketIDToTicket(1);
            const ticketBytes32 = numToBytes32(ticket);
            expect(ticketBytes32).to.bignumber.equals(callbackDataBytes32);
            done();
        });

        bingoGame.buyTicket({
          value: ethers.utils.parseEther("0.1")
        });
      });
    });

    describe('Start game', async function () {
      it('Transaction fails if its too early to start game', async () => {
        const transactionPromise = bingoGame.startGame();
        await expect(transactionPromise).to.be.revertedWith("Too early to start the game");
      });

      it('Buy ticket transaction fails if sale has ended', async () => {
        await incTimeAndStartGame(bingoGame);
        const transactionPromise = bingoGame.buyTicket({
          value: ethers.utils.parseEther("0.1")
        });

        await expect(transactionPromise).to.be.revertedWith("Ticket sale has ended");
      });

      it('Transaction fails if game already started', async () => {
        await incTimeAndStartGame(bingoGame);
        const transactionPromise = incTimeAndStartGame(bingoGame);
        await expect(transactionPromise).to.be.revertedWith("Game already started");
      });

      it('Unfulfilled tickets - ticket sale ends, game doesnt start', async () => {
        await bingoGame.buyTicket({
          value: ethers.utils.parseEther("0.1")
        });

        const transaction = await incTimeAndStartGame(bingoGame);
        const receipt = await transaction.wait();

        const ticketSaleEndEvent = receipt.events.find(event => event.event === 'TicketSaleEnded');

        const gameState = await bingoGame.gameState();

        expect(ticketSaleEndEvent).to.not.be.null;
        expect(gameState).to.be.equals(1);
      });

      it('All tickets fulfilled - ticket sale ends, game starts', async () => {
        const transaction = await incTimeAndStartGame(bingoGame);
        const receipt = await transaction.wait();

        const ticketSaleEndEvent = receipt.events.find(event => event.event === 'TicketSaleEnded');
        const gameStartedEvent = receipt.events.find(event => event.event === 'GameStarted');

        const gameState = await bingoGame.gameState();

        expect(ticketSaleEndEvent).to.not.be.null;
        expect(gameStartedEvent).to.not.be.null;
        expect(gameState).to.be.equals(2);
      });
    });

    describe('Do game step and claim prizes', async function () {
      it('Step transaction fails if game not in process - ticket sale', async () => {
        const transactionPromise = bingoGame.finalizeStepAndDrawNextNumber();
        await expect(transactionPromise).to.be.revertedWith("Game not in progress");
      });

      it('Step transaction fails if game not in process - waiting for fulfillment', async () => {
        await bingoGame.buyTicket({
          value: ethers.utils.parseEther("0.1")
        });

        const transactionPromise = bingoGame.finalizeStepAndDrawNextNumber();
        await expect(transactionPromise).to.be.revertedWith("Game not in progress");
      });

      it('Step transaction fails if not enough time since last step', async () => {
        await incTimeAndStartGame(bingoGame);

        await bingoGame.finalizeStepAndDrawNextNumber();
        await mockVRF.callBackWithRandomness(numToBytes32(1), 123, bingoGame.address);

        const transactionPromise = bingoGame.finalizeStepAndDrawNextNumber();
        await expect(transactionPromise).to.be.revertedWith("Not enough time since last step");
      });

      it('Step transaction fails if randomness unfulfilled yet', async () => {
        await incTimeAndStartGame(bingoGame);

        await bingoGame.finalizeStepAndDrawNextNumber();

        const transactionPromise = incTimeAndCallStep(bingoGame);
        await expect(transactionPromise).to.be.revertedWith("Waiting for previous random number");
      });

      describe('Claim prize transaction fails if non winnig ticket', async function () {
        it('Row0', async () => {
          await buyMockTicket(
            bingoGame,
            bingoTickets,
            mockOracle,
            [1,25,33,57,77,17,37,58,78,81,4,28,46,65,85]
          );
          await incTimeAndStartGame(bingoGame);

          await callStepAndFulfillNumbers(
            bingoGame,
            mockVRF,
            [1, 25, 33, 57, 90]
          );

          let transactionPromise = bingoGame.claimPrize(1, 0);
          await expect(transactionPromise).to.be.revertedWith("Non winning ticket");
        });

        it('Row1', async () => {
          await buyMockTicket(
            bingoGame,
            bingoTickets,
            mockOracle,
            [1,25,33,57,77,17,37,58,78,81,4,28,46,65,85]
          );
          await incTimeAndStartGame(bingoGame);

          await callStepAndFulfillNumbers(
            bingoGame,
            mockVRF,
            [17, 37, 58]
          );

          let transactionPromise = bingoGame.claimPrize(1, 1);
          await expect(transactionPromise).to.be.revertedWith("Non winning ticket");
        });

        it('Row2', async () => {
          await buyMockTicket(
            bingoGame,
            bingoTickets,
            mockOracle,
            [1,25,33,57,77,17,37,58,78,81,4,28,46,65,85]
          );
          await incTimeAndStartGame(bingoGame);

          await callStepAndFulfillNumbers(
            bingoGame,
            mockVRF,
            [4, 46, 65]
          );

          let transactionPromise = bingoGame.claimPrize(1, 2);
          await expect(transactionPromise).to.be.revertedWith("Non winning ticket");
        });

        it('Whole card', async () => {
          await buyMockTicket(
            bingoGame,
            bingoTickets,
            mockOracle,
            [1,25,33,57,77,17,37,58,78,81,4,28,46,65,85]
          );
          await incTimeAndStartGame(bingoGame);

          await callStepAndFulfillNumbers(
            bingoGame,
            mockVRF,
            [1,25,33,57,77,17,58,78,81,4,28,46,65,85]
          );

          let transactionPromise = bingoGame.claimPrize(1, 3);
          await expect(transactionPromise).to.be.revertedWith("Non winning ticket");
        });
      });

      it('Winners prizes set as winnings', async () => {
        const [ _owner, user1, user2 ] = await ethers.getSigners();

        await buyMockTicket(
          bingoGame,
          bingoTickets,
          mockOracle,
          [1,25,33,57,77,17,37,58,78,81,4,28,46,65,85],
          user1
        );
        await buyMockTicket(
          bingoGame,
          bingoTickets,
          mockOracle,
          [1,25,33,57,77,17,37,58,78,81,4,28,46,65,85],
          user2
        );

        await incTimeAndStartGame(bingoGame);

        await callStepAndFulfillNumbers(
          bingoGame,
          mockVRF,
          [1,25,33,57,77]
        );

        await bingoGame.connect(user1).claimPrize(1, 0);
        await bingoGame.connect(user2).claimPrize(2, 0);

        await callStepAndFulfillNumber(bingoGame, mockVRF, 1);

        const user1Winnings = await bingoGame.winnings(user1.address);
        const user2Winnings = await bingoGame.winnings(user2.address);
        const expectedWinnings = (
          BigInt(await bingoGame.ticketPrice()) * BigInt(18) / BigInt(100)
        );

        expect(user1Winnings).to.be.equals(user2Winnings);
        expect(user1Winnings).to.be.equals(expectedWinnings);
      });

      it('Winners winnings zeroed after withdrawal', async () => {
        const [ _owner, user1 ] = await ethers.getSigners();
        await buyMockTicket(
          bingoGame,
          bingoTickets,
          mockOracle,
          [1,25,33,57,77,17,37,58,78,81,4,28,46,65,85],
          user1
        );
        await incTimeAndStartGame(bingoGame);
        await callStepAndFulfillNumbers(
          bingoGame,
          mockVRF,
          [1,25,33,57,77]
        );
        await bingoGame.connect(user1).claimPrize(1, 0);
        await callStepAndFulfillNumber(bingoGame, mockVRF, 1);
        await bingoGame.connect(user1).withdraw();
        const newWinnings = await bingoGame.winnings(user1.address);

        expect(newWinnings).to.be.equals(0);
      });

      it('Transaction fails if prize was claimed', async () => {
        await buyMockTicket(
          bingoGame,
          bingoTickets,
          mockOracle,
          [1,25,33,57,77,17,37,58,78,81,4,28,46,65,85]
        );
        await buyMockTicket(
          bingoGame,
          bingoTickets,
          mockOracle,
          [1,25,33,57,77,17,37,58,78,81,4,28,46,65,85]
        );
        await incTimeAndStartGame(bingoGame);
        await callStepAndFulfillNumbers(
          bingoGame,
          mockVRF,
          [4,28,46,65,85]
        );
        await bingoGame.claimPrize(1, 2);
        await callStepAndFulfillNumber(bingoGame, mockVRF, 1);

        let transactionPromise = bingoGame.claimPrize(2, 2);
        await expect(transactionPromise).to.be.revertedWith("Prize was already claimed");
      });

      it('Game ends after whole card is won', async () => {
        await buyMockTicket(
          bingoGame,
          bingoTickets,
          mockOracle,
          [1,25,33,57,77,17,37,58,78,81,4,28,46,65,85]
        );
        await incTimeAndStartGame(bingoGame);
        await callStepAndFulfillNumbers(
          bingoGame,
          mockVRF,
          [1,25,33,57,77,17,37,58,78,81,4,28,46,65,85]
        );

        await bingoGame.claimPrize(1, 3);
        await callStepAndFulfillNumber(bingoGame, mockVRF, 1);

        const gameState = await bingoGame.gameState();
        expect(gameState).to.be.equals(3);
      });

      it('Step transaction fails if game not in process - game finished', async () => {
        await buyMockTicket(
          bingoGame,
          bingoTickets,
          mockOracle,
          [1,25,33,57,77,17,37,58,78,81,4,28,46,65,85]
        );
        await incTimeAndStartGame(bingoGame);
        await callStepAndFulfillNumbers(
          bingoGame,
          mockVRF,
          [1,25,33,57,77,17,37,58,78,81,4,28,46,65,85]
        );

        await bingoGame.claimPrize(1, 3);
        await callStepAndFulfillNumber(bingoGame, mockVRF, 1);

        const transactionPromise = callStepAndFulfillNumber(bingoGame, mockVRF, 1);
        await expect(transactionPromise).to.be.revertedWith("Game not in progress");
      });

      it('Owner gets rest of money after game ends', async () => {
        const [ _, user1 ] = await ethers.getSigners();
        await buyMockTicket(
          bingoGame,
          bingoTickets,
          mockOracle,
          [1,25,33,57,77,17,37,58,78,81,4,28,46,65,85],
          user1
        );
        await incTimeAndStartGame(bingoGame);
        await callStepAndFulfillNumbers(
          bingoGame,
          mockVRF,
          [1,25,33,57,77,17,37,58,78,81,4,28,46,65,85]
        );

        await bingoGame.connect(user1).claimPrize(1, 3);
        await callStepAndFulfillNumber(bingoGame, mockVRF, 1);

        const owner = await bingoGame.owner();
        const ownerWinnings = await bingoGame.winnings(owner);
        const expectedWinnings = (
          BigInt(await bingoGame.ticketPrice()) * BigInt(64) / BigInt(100)
        );

        expect(ownerWinnings).to.be.equals(expectedWinnings);
      });
    });

    describe('Oracle operations', async function () {
      it('Owner can withdraw link', async () => {
        const owner = await bingoGame.owner();

        const expectedLinkBalance = (
          BigInt(await linkToken.balanceOf(owner)) +
          BigInt(await linkToken.balanceOf(bingoGame.address)) +
          BigInt(await linkToken.balanceOf(bingoTickets.address))
        ).toString()

        await bingoGame.withdrawLink();

        const linkBalance = await linkToken.balanceOf(owner);

        expect(linkBalance).to.be.equals(expectedLinkBalance);
      });
    });
  });