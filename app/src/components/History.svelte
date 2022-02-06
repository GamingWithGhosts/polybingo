<!--
  (c) 2022 Gaming With Ghosts
  This code is licensed under MIT license (see LICENSE for details)
-->
<script>
	export let takenNumbers = [];
</script>


<style>
	#history {
		position: sticky;
		top: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
	}

	#short-history {
		position: sticky;
		top: 20px;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 5px;

		padding-inline: 20px;
		padding-block: 5px;

		font-size: 72px;
	}

	#short-history #recent,
	#short-history #next p {
		display: flex;
		justify-content: center;
		align-items: center;

		width: 108px;
		height: 108px;

		padding: 5px;
		border: 10px solid green;
		border-radius: 50%;

		background-color: white;
	}

	#short-history #next {
		display: flex;
		flex-direction: row;
		gap: 5px;
		height: fit-content;

		padding: 2px;

		border-radius: 50px;
	}

	#short-history #next p {
		width: 48px;
		height: 48px;
		font-size: 36px;
		border-width: 5px;
	}

	#short-history #next p:first-child {
		border-color: blue;
	}

	#short-history #next p:nth-child(2) {
		border-color: red;
	}

	#short-history #next p:nth-child(4) {
		border-color: yellow;
	}

	#short-history #next p:nth-child(4) {
		border-color: blueviolet;
	}

	#full-history {
		position: sticky;
		top: 170px;
		display: flex;
		flex-direction: column;
		align-items: center;

		padding: 10px;

		font-size: 28px;

		background-color: rgba(209, 209, 209, 0.37);
	}
	#full-history > p {
		font-size: 48px;
		background-color: rgb(112, 112, 112);
		padding: 0 22px;
		color: white;
		margin-bottom: 12px;
		border-radius: 48px;
	}
	#full-history ul {
		display: grid;
		grid-template: repeat(9, 48px) / repeat(10, 48px);

		color: grey;
		padding: 0;

		list-style: none;
	}

	#full-history ul li {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	#full-history ul li.taken {
		color: white;
		font-weight: bold;
		border-radius: 50%;
		background-color: rgb(0, 0, 0);
	}
</style>


<div id="history">
	<div id="short-history">
		<p id="recent">{takenNumbers.length > 1 ? takenNumbers.slice(-1) : ' '}</p>

		<div id="next">
			<p>{takenNumbers.length > 1 ? takenNumbers.slice(-2, takenNumbers.length - 1) : ' '}</p>
			<p>{takenNumbers.length > 2 ? takenNumbers.slice(-3, takenNumbers.length - 2) : ' '}</p>
			<p>{takenNumbers.length > 3 ? takenNumbers.slice(-4, takenNumbers.length - 3) : ' '}</p>
			<p>{takenNumbers.length > 4 ? takenNumbers.slice(-5, takenNumbers.length - 4) : ' '}</p>
		</div>
	</div>

	<div id="full-history">
		<p>{`${takenNumbers.length} / 90`}</p>
		<ul>
			{#each Array(90) as _, index}
				<li class:taken={takenNumbers.indexOf(index + 1) !== -1}>{index + 1}</li>
			{/each}
		</ul>
	</div>
</div>
