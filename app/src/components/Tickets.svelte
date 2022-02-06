<!--
  (c) 2022 Gaming With Ghosts
  This code is licensed under MIT license (see LICENSE for details)
-->
<script>
	import { onMount } from 'svelte';

	import { getTicketMatrixFromArray } from '$lib/utils.js';
	import { moralis } from "$lib/stores.js";

	import BINGOGAME from '$lib/BingoGame.json';
	import BINGOTICKETS from '$lib/BingoTickets.json';

	export let takenNumbers;
	export let selectedNumbers = [];


	let tickets = [];

	onMount(() => {
		const unsubscribe = $moralis.onWeb3Enabled(async () => {
			unsubscribe();

			await findTickets();
			await getNumberHistory();
			await listenForNumberStream();
		});
	})

	function handleNumberClick(event) {
		const selected = Number?.parseInt(event.target.innerText);
		if (takenNumbers.indexOf(selected) >= 0) {
			selectedNumbers = [...selectedNumbers, selected];
		}
	}

	async function handleBuyTicket() {
		const chainId = await $moralis.chainId;
		if (chainId !== 80001) {
			await $moralis.switchNetwork(chainId);
		}

		const options = {
			contractAddress: import.meta.env.CLIENT_GAME_CONTRACT,
			functionName: "buyTicket",
			abi: BINGOGAME,
			msgValue: $moralis.Units.ETH("0.1")
		};

		const transaction = await $moralis.executeFunction(options);
		const receipt = await transaction.wait();
		console.log(transaction, receipt)

		findTickets();
	}

	async function findTickets() {
		tickets = [];

		$moralis.executeFunction({
			contractAddress: import.meta.env.CLIENT_TICKETS_CONTRACT,
			functionName: "getAllTicketIDs",
			abi: BINGOTICKETS,
			params: {
				owner: $moralis.User.current().get('ethAddress')
			}
		})
			.then((ticketIds) => {
				let cards = [];

				ticketIds.forEach(async (id) => {
					const card = await $moralis.executeFunction({
						contractAddress: import.meta.env.CLIENT_TICKETS_CONTRACT,
						functionName: "ticketIDToTicket",
						abi: BINGOTICKETS,
						params: {
							"": id
						}
					});

					setTicketsFromCard(card);
				});

				return cards;
			})
			.catch(error => {
				console.log(error)
			});
	}

	function setTicketsFromCard(card) {
		let numbersArray = [];
		let hexString = card.toString(16);

		for (let index = 2; index < hexString.length; index += 2) {
			const hex = hexString.charAt(index) + hexString.charAt(index + 1);
			numbersArray.push(parseInt("0x" + hex, 16));
		}

		const matrix = getTicketMatrixFromArray(numbersArray);
		tickets = [...tickets, [...matrix.row1, ...matrix.row2, ...matrix.row3]];
	}

	async function getNumberHistory() {
		const hexMap = await $moralis.executeFunction({
			contractAddress: import.meta.env.CLIENT_GAME_CONTRACT,
			functionName: "drawnNumbersBitmap",
			abi: BINGOGAME
		});

		const hexString = hexMap.toHexString();
		const bitmap = parseInt(hexString, 16).toString(2);

		for (let bit = 0; bit < bitmap.length; bit++) {
			if (bitmap.charAt(bit) === '1') {
				takenNumbers.push(bit);
			}

			takenNumbers = takenNumbers;

			console.log(takenNumbers)
		}
	}

	async function listenForNumberStream() {
		const provider = await $moralis.enableWeb3();
		const ethers = $moralis.web3Library

		const gameContract = new ethers.Contract(import.meta.env.CLIENT_GAME_CONTRACT, BINGOGAME, provider);
		gameContract.on('NewNumberDrawn', (number) => {
			takenNumbers = [...takenNumbers, number]
		})
	}
</script>

<style>
	#content {
		padding: 24px;
		border-radius: 24px;
		background-color: #77777765;
	}

	#header {
		display: flex;
		align-items: center;
		font-size: 36px;
		font-weight: bold;
		padding: 0 15px;

		color: #292929;
	}
	.numbers {
		display: grid;
		grid-template: repeat(3, 72px) / repeat(9, 1fr);
		column-gap: 5px;
		row-gap: 5px;
		font-size: 28px;
		padding: 10px;
		padding-inline: 10px;

		background-color: #000000;
	}

	.numbers li {
		background-color: #525252;
	}

	#boards .board-container {
		display: flex;
		align-items: flex-end;
		gap: 10px;
	}
	#boards .claim-buttons {
		display: flex;
		flex-direction: column;
		gap: 10px;
		font-size: 24px;
		font-weight: bold;
		padding: 10px;
	}
	#boards .claim-buttons > button {
		border: none;
		background-color: #677969;
		color: gold;
		cursor: pointer;
	}
	#boards .board {
		margin-block-start: 15px;
		flex-grow: 1;
	}

	#boards #buy-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		margin-block-start: 100px;
	}

	#boards #buy-container p {
		font-weight: bold;
		font-size: 36px;
		color: gray;
	}

	#boards #buy-container button {
		padding: 10px 20px;

		cursor: pointer;
		font-size: x-large;
		font-weight: 500;
		border: none;
		border-radius: 100px;
	}
	#boards .header {
		display: flex;
		justify-content: flex-end;
		align-content: center;
		gap: 30px;

		padding: 10px;
		font-size: 28px;
		font-weight: bold;
		color: #00ff22;
		background-color: #48738b;
	}

	#boards .header p:last-child {
		padding-inline: 7px;
	}

	.board .numbers :global(.hasNumber) {
		display: flex;
		justify-content: center;
		align-items: center;

		background-color: white;
		cursor: pointer;
	}

	.board .numbers .taken span {
		font-size: 32px;
		/*font-weight: 10px;*/
		padding: 5px 10px;
		border-radius: 45px;
		text-align: center;

		color: wheat;
		background-color: green;
	}
</style>

<div id="content">
	<div id="header">
		<p>Your Tickets</p>
	</div>
	<div id="boards">
		{#each tickets as ticket, boardIndex}
			<div class="board-container">
				<div class="board">
					<div class="header">
					</div>
					<ul class="numbers" on:click={handleNumberClick} data-boardid={boardIndex}>
						{#each ticket as item}
							<li class:hasNumber={item !== 0} class:taken={selectedNumbers.indexOf(item) >= 0}>
								<span>{item !== 0 ? item : ''}</span>
							</li>
						{/each}
					</ul>
				</div>
				<div class="claim-buttons">
					<button> Housie</button>
					<button> Top Line</button>

					<button> Middle Line</button>

					<button>Bottom Line</button>
				</div>
			</div>
		{:else}
			<div id="buy-container">
				<p>No tickets available</p>
<!--				<button on:click={() => goto('/create')}>Create new game</button>-->
				<button on:click={findTickets}>NFTs</button>
				<button on:click={handleBuyTicket}>Buy ticket</button>
			</div>
		{/each}
	</div>
</div>
