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
        margin: 100px auto auto auto;
        gap: 10px;
    }
    form label{
        font-size: 28px;
        font-weight: bold;
        color: gray;
    }
    form input{
        border-radius: 50px;
        padding: 8px 15px;
        font-size: 22px;
    }
    form button{
        border: 0px;
        width: fit-content;
        align-self: center;
        padding: 14px 48px;
        font-size: 24px;
        font-weight: bold;
        border-radius: 200px;
    }
    form button:first-of-type{
        background-color: rgb(69, 243, 69);
        color: rgb(53, 53, 53);


    }
    form button:last-of-type{
        background-color:rgb(209, 93, 93);
        color: rgb(234, 235, 231);
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
