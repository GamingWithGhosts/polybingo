<!--
  (c) 2022 Gaming With Ghosts
  This code is licensed under MIT license (see LICENSE for details)
-->
<script>
	import { goto } from "$app/navigation";

	import { getTicketMatrixFromArray } from "$lib/utils.js";


	const matrix = getTicketMatrixFromArray();
	const tickets = [];

	export let takenNumbers = [19, 74];
	export let selectedNumbers = [];

	function handleNumberClick(event) {
		const selected = Number?.parseInt(event.target.innerText);
		if (takenNumbers.indexOf(selected) >= 0) {
			selectedNumbers = [...selectedNumbers, selected];
		}
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
						<p>#60382</p>
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
				<button on:click={() => goto('/create')}>Create new game</button>
				<button>Buy ticket</button>
			</div>
		{/each}
	</div>
</div>
