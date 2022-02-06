<!--
  (c) 2022 Gaming With Ghosts
  This code is licensed under MIT license (see LICENSE for details)
-->

<script>
    import { goto } from '$app/navigation';
    import { moralis } from "$lib/stores.js";

    function handleConnectWallet() {
        $moralis.authenticate({ signingMessage: "Connect with PolyBingo" })
            .then(() => goto('/play'))
    }
</script>


<style>
    #content {
        display: grid;
        grid-template-rows: 1fr 100px 100px;
        justify-items: center;
        align-items: center;
        text-align: center;
    }
</style>


<div id="content">
    <img src="/logo.png" alt="polybingo logo" />
    <div>
        <h1>Welcome to PolyBingo</h1>
        <p>Connect to Wallet to start playing</p>
    </div>
    <button on:click={handleConnectWallet}>Connect Wallet</button>
</div>
