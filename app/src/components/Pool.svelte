<!--
  (c) 2022 Gaming With Ghosts
  This code is licensed under MIT license (see LICENSE for details)
-->
<script>
	import { onMount } from "svelte";

	import { moralis } from "$lib/stores.js";

	import BINGOGAME from "$lib/BingoGame.json";


	let pricePool = 0;


	onMount(async () => {
		const unsubscribe = $moralis.onWeb3Enabled(() => {
			unsubscribe();

			const ethers = $moralis.web3Library
			getPricePool(ethers);
		})
	})

	async function getPricePool(ethers) {
		const value = await $moralis.executeFunction({
			contractAddress: import.meta.env.CLIENT_GAME_CONTRACT,
			functionName: 'prizePool',
			abi: BINGOGAME
		});

		pricePool = ethers.utils.formatEther(value);
	}
</script>


<style>
	#content {
		position: sticky;
		top: 100px;
		display: flex;
		flex-direction: column;
		gap: 10px;

		height: fit-content;
		/* background-color: lightgray; */
	}

	#header {
		display: flex;
		align-items: flex-end;
		justify-content: space-around;
	}

	#pool div:first-child,
	#players div:first-child {
		font-size: 24px;
		font-weight: bold;
		text-transform: uppercase;
	}
	#pool,
	#players {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	#pool .info,
	#players .info {
		display: flex;
		justify-items: center;
		gap: 5px;
		font-size: 22px;
	}

	#pool img,
	#players img {
		display: inline;
		width: 20px;
	}

	#prizes {
		padding: 0;
	}

	#prizes li {
		display: flex;
		justify-content: space-between;
		gap: 5px;

		padding: 14px;

		font-size: 24px;
		font-weight: bold;

		border-top: 0;

		color: rgb(255, 255, 255);
		background-color: #e4985a;

		border-radius: 100px;
		margin-top: 10px;
	}

	#prizes img {
		width: 20px;
		/* error: justify-self: flex- end;*/
	}

	#prizes li:first-child span:first-child,
	#prizes li:nth-child(2) span:first-child,
	#prizes li:nth-child(3) span:first-child,
	#prizes li:nth-child(4) span:first-child {
		flex-grow: 1;
	}
</style>


<div id="content">
	<div id="header">
		<div id="pool">
			<div>Price pool</div>
			<div class="info">
				<span>{pricePool}</span>
				<img alt="" aria-hidden="true" src="matic.svg" />
			</div>
		</div>
		<div id="players">
			<div>Players</div>
			<div class="info">
				<img alt="" aria-hidden="true" src="matic.svg" />
				<span>50</span>
			</div>
		</div>
	</div>
	<ul id="prizes">
		<li>
			<span>Housie</span>
			<span>{pricePool * 0.36}</span>
			<img src="matic.svg" alt="matic logo" />
		</li>
		<li>
			<span>Top Line</span>
			<span>{pricePool * 0.18}</span>
			<img src="matic.svg" alt="matic logo" />
		</li>
		<li>
			<span>Mid Line</span>
			<span>{pricePool * 0.18}</span>
			<img src="matic.svg" alt="matic logo" />
		</li>
		<li>
			<span>Bottom Line</span>
			<span>{pricePool * 0.18}</span>
			<img src="matic.svg" alt="matic logo" />
		</li>
	</ul>
</div>
