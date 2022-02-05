<!--
  (c) 2022 Gaming With Ghosts
  This code is licensed under MIT license (see LICENSE for details)
-->
<script>
	import Dropdown from '@components/elements/Dropdown.svelte';
	import Button from '@components/elements/Button.svelte';
</script>

<div id="wrapper">
	<p>PolyBingo</p>

	<Dropdown />
	<Button />
</div>

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
</style>
