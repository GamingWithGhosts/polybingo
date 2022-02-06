<!--
  (c) 2022 Gaming With Ghosts
  This code is licensed under MIT license (see LICENSE for details)
-->
<script>
	import Dropdown from '@components/elements/Dropdown.svelte';
	import Button from '@components/elements/Button.svelte';
	import Moralis from 'moralis/dist/moralis.min.js';
	const userAddress =  Moralis.User.current().attributes.ethAddress;
	export let hasButton = true;
	export let hasMenu = true;

	export let menuLabels;
	export let buttonLabel;
</script>

<style>
	#wrapper {
		display: flex;
		gap: 18px;

		align-items: center;

		padding: 18px;
		background-color: rgb(73, 73, 73);
		color: rgb(228, 228, 228);
	}

	p {
		font-size: 108px;
		font-weight: bold;
		text-align: center;
		flex-grow: 1;
	}
	#current-username{
		display: flex;
		align-items: center;
		font-size: 36px;
		gap: 10px;
		padding: 10px 20px;
		background-color: rgb(146, 146, 146);
		color: black;
		border-radius: 100px;
	}
	#current-username img{
		background-color: rgb(255, 255, 255);
	}
</style>

<div id="wrapper">
	<p>PolyBingo</p>

	{#if (hasMenu)}
		<Dropdown on:itemSelected labels="{menuLabels}"  />
	{/if}

	{#if hasButton}
		<Button on:buttonClick label="{buttonLabel}" />
	{/if}
	<div id="current-username">
	<img src={"https://avatars.dicebear.com/api/identicon/"+userAddress+".svg"} width="48" alt=" account identicon ">
	<span >{userAddress.slice(0,10)+"..."}</span>
	</div>
</div>
