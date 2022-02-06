<!--
  (c) 2022 Gaming With Ghosts
  This code is licensed under MIT license (see LICENSE for details)
-->
<script context="module">
	export const prerender = true;
</script>

<script>
	import { goto } from "$app/navigation";

	import Header from '@components/Header.svelte';
	import History from '@components/History.svelte';
	import Tickets from '@components/Tickets.svelte';
	import Pool from '@components/Pool.svelte';

	let takenNumbers = [];
</script>


<style>
	#content {
		display: grid;
		grid-template-columns: 500px 5fr 2fr;
		column-gap: 45px;
		padding: 0 45px;
		margin-block-start: 5px;
	}
</style>


<section>
	<Header on:buttonClick={() => goto('/create')} on:itemSelected={(event) => console.log(event.detail)} />
	<div id="content">
		<History {takenNumbers} />
		<Tickets bind:takenNumbers />
		<Pool />
	</div>
</section>
