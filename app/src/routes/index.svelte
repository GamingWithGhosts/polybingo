<!--
  (c) 2022 Gaming With Ghosts
  This code is licensed under MIT license (see LICENSE for details)
-->

<script context="module">
	export const prerender = true;
</script>

<script>
    import Header from "@components/Header.svelte";
    import History from "@components/History.svelte";
    import Tickets from "@components/Tickets.svelte";
    import Pool from "@components/Pool.svelte";
</script>


<style>
    #content {
        display: grid;
        grid-template-columns: 225px 1fr 210px;
        column-gap: 45px;

        height: 300px;
    }
</style>


<section>
    <Header />
    <div id="content">
        <History/>
        <Tickets/>
        <Pool/>
    </div>
</section>
