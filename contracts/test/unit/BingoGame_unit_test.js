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
  const bingoGame = await getContractByName(deployments, 'BingoGame');

  const networkName = networkConfig[chainId]['name']

  linkTokenAddress = linkToken.address
  additionalMessage = " --linkaddress " + linkTokenAddress

  if (await autoFundCheck(bingoGame.address, networkName, linkTokenAddress, additionalMessage)) {
    await hre.run("fund-link", { contract: bingoGame.address, linkaddress: linkTokenAddress })
  }

  return { linkToken, mockOracle, bingoGame };
}

skip.if(!developmentChains.includes(network.name)).
  describe('BingoGame Unit Tests', async function () {
    let linkToken, mockOracle, bingoGame;
    const approxDeploymentTime = parseInt(Date.now() / 1000);

    beforeEach(async () => {
      const contracts = await getContracts(deployments);
      linkToken = contracts.linkToken;
      mockOracle = contracts.mockOracle;
      bingoGame = contracts.bingoGame;
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
      it('Transaction fails with sale has ended', async () => {
        await bingoGame.startGame();
        const transactionPromise = bingoGame.buyTicket({
          value: ethers.utils.parseEther("0.1")
        });

        await expect(transactionPromise).to.be.revertedWith("Ticket sale has ended");
      });

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

      it('Token owned by buyer', async () => {
        const transaction = await bingoGame.buyTicket({
          value: ethers.utils.parseEther("0.1")
        });
        const receipt = await transaction.wait();

        const sender = receipt.from;
        const event = receipt.events.find(event => event.event === 'Transfer');
        const [_from, to, tokenID] = event.args;
        const tokenOwner = await bingoGame.ownerOf(tokenID);

        expect(to).to.equals(sender);
        expect(tokenOwner).to.equals(sender);
      });

      it('TokenID incremented', async () => {
        const transaction1 = await bingoGame.buyTicket({
          value: ethers.utils.parseEther("0.1")
        });
        const receipt1 = await transaction1.wait();
        const event1 = receipt1.events.find(event => event.event === 'Transfer');
        const [_from1, _to1, tokenID1] = event1.args;

        const transaction2 = await bingoGame.buyTicket({
          value: ethers.utils.parseEther("0.1")
        });
        const receipt2 = await transaction2.wait();
        const event2 = receipt2.events.find(event => event.event === 'Transfer');
        const [_from2, _to2, tokenID2] = event2.args;

        expect(tokenID2 - tokenID1).to.equals(1);
      });

      it('API request for ticket is sent', async () => {
          const transaction = await bingoGame.buyTicket({
            value: ethers.utils.parseEther("0.1")
          });
          const receipt = await transaction.wait();
          const event = receipt.events.find(event => event.event === 'ChainlinkRequested');
          const requestId = event.topics[1];

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
            const callbackValue = "0x0123456789ABCDEF0123456789ABCD";
            await mockOracle.fulfillOracleRequest(requestId, numToBytes32(callbackValue));

            const ticket = await bingoGame.ticketIDToTicket(1);

            expect(ticket).to.bignumber.equals(callbackValue)
            done();
        });

        bingoGame.buyTicket({
          value: ethers.utils.parseEther("0.1")
        });
      });
    });
  });