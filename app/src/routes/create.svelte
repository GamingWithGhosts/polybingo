<!--
  (c) 2022 Gaming With Ghosts
  This code is licensed under MIT license (see LICENSE for details)
-->

<script>
    import { goto } from "$app/navigation";

    import Header from "@components/Header.svelte";
</script>


<Header hasButton="{false}" />

<button on:click={() => goto('/play')}>Cancel</button>
