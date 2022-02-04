<!--
  (c) 2022 Gaming With Ghosts
  This code is licensed under MIT license (see LICENSE for details)
-->

<script>
    import Dropdown from "@components/elements/Dropdown.svelte";
    import Button from "@components/elements/Button.svelte";
</script>


<style>
   #wrapper {
       display: flex;
       gap: 10px;
       align-items: center;

       padding: 10px;
       background-color: grey;
   }

   p {
       font-size: 32px;
       text-align: center;
       flex-grow: 1;
   }
</style>


<div id="wrapper">
    <Dropdown />
    <Button />
    <p>Bingo</p>
</div>
