const chai = require('chai')
const { expect } = require('chai')
const BN = require('bn.js')
chai.use(require('chai-bn')(BN))
const skipIf = require('mocha-skip-if')
const { developmentChains } = require('../../helper-hardhat-config')

skip.if(developmentChains.includes(network.name)).
  describe('BingoGame Integration Tests', async function () {
    let bingoGameFactory, bingoGame, bingoTickets;

    beforeEach(async () => {
      const BingoGameFactory = await deployments.get('BingoGameFactory');
      bingoGameFactory = await ethers.getContractAt(
        'BingoGameFactory',
        BingoGameFactory.address
      );
      let allGames = await bingoGameFactory.getAllGames();
      if (allGames.length < 1) {
        console.log("No games, starting one...")
        const transcation = await bingoGameFactory.createGame({
            'gameName': "TestGame1",
            'gameSymbol': "TST1",
            'ticketPrice': "100000000000000000",
            'minSecondsBeforeGameStarts': 300, // 10 minutes
            'minSecondsBetweenSteps': 30,
            'ipfsDirectoryURI': "ipns://k51qzi5uqu5djuxna2e4m5lkszmgj8z7bojvsin778i36nx3j0amujp8nj3z6z"
        });
        await new Promise(resolve => setTimeout(resolve, 30000))
        const receipt = await transcation;
        console.log(receipt);

        allGames = await bingoGameFactory.getAllGames();
      }

      bingoGame = await hre.ethers.getContractAt("BingoGame", allGames[0]);
      bingoTickets = await hre.ethers.getContractAt(
        "BingoTickets",
        await bingoGame.bingoTickets()
      );

      console.log("factory %s:, game: %s, tickets: %s",
        bingoGameFactory.address,
        bingoGame.address,
        bingoTickets.address
      );
    });


    it('Should successfully make an external API request and get a result', async () => {
      let buyTicket = false;
      if (buyTicket) {
        await bingoGame.buyTicket({
          value: ethers.utils.parseEther("0.1")
        });

        //wait 30 secs for oracle to callback
        await new Promise(resolve => setTimeout(resolve, 30000));
        console.log("Done waiting");
      }

      const unfulfilled = await bingoTickets.unfulfilledRequestCount();
      const ticket = await bingoTickets.ticketIDToTicket(1);
      const uri = await bingoTickets.tokenURI(1);

      console.log("Waiting for tickets: ", unfulfilled);
      console.log("API gave dobby a ticket: ", ticket);
      console.log("Ticket URI: ", uri);
    });
  });