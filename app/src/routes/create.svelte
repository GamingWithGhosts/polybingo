<!--
  (c) 2022 Gaming With Ghosts
  This code is licensed under MIT license (see LICENSE for details)
-->

<script>
    import { goto } from "$app/navigation";

    import Header from "@components/Header.svelte";


    let form;


    function handleStart() {
        if (form.reportValidity()) {
            goto('/play')
        }
    }
</script>


<style>
    form {
        display: flex;
        flex-direction: column;
        justify-content: center;

        width: 500px;
        margin: 0 auto;
    }
</style>


<Header hasButton="{false}" />

<form bind:this={form}>
    <label for="name">Game name:</label>
    <input id="name" required>

    <label for="time">Start time:</label>
    <input id="time" type="datetime-local" required />

    <label for="interval">time between balls in seconds:</label>
    <input id="interval" type="number" required />

    <label for="price">Ticket price in Matic:</label>
    <input id="price" required />

    <button on:click|preventDefault={handleStart}>Start</button>
    <button on:click={() => goto('/play')}>Cancel</button>
</form>
