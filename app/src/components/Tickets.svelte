<!--
  (c) 2022 Gaming With Ghosts
  This code is licensed under MIT license (see LICENSE for details)
-->

<script>
    import { GetTicketMatrixFromArray } from '/src/utils/GetTicketMatrixFromArray';

    const matrix = GetTicketMatrixFromArray();
    const tickets = [[...matrix.row1, ...matrix.row2, ...matrix.row3]];

    export let takenNumbers = [19, 74];
    export let selectedNumbers = [];


    function handleNumberClick(event) {
        const selected = Number?.parseInt(event.target.innerText);

        if (takenNumbers.indexOf(selected) >= 0) {
            selectedNumbers = [...selectedNumbers, selected];
        }
    }
</script>


<style>
    #content {
        padding: 10px;
        background-color: #007373;
    }

    #header {
        display: flex;
        align-items: center;

        padding: 15px;

        color: #6198A0;
        background-color: #126066;
    }

    .numbers {
        display: grid;
        grid-template: repeat(3, 48px) / repeat(9, 48px);
        column-gap: 1px;
        row-gap: 1px;

        padding-block-end: 10px;;
        padding-inline: 10px;

        background-color: #107DC6;
    }

    .numbers li {
        background-color: #3b8dc4;
    }

    #boards .board {
        margin-block-start: 15px;
    }

    #boards .header {
        display: flex;
        justify-content: flex-end;
        align-content: center;
        gap: 30px;

        padding: 10px;

        color: #6CC0FF;
        background-color: #0B85CC;
    }

    #boards .header p:last-child {
        background-color: #00a88e;
        padding-inline: 7px;
    }

    .board .numbers :global(.hasNumber) {
        display: flex;
        justify-content: center;
        align-items: center;

        background-color: white;
        cursor: pointer;
    }

    .board .numbers .taken span {
        width: 45px;
        height: 45px;

        border-radius: 50%;
        text-align: center;

        color: wheat;
        background-color: green;
    }
</style>


<div id="content">
    <div id="header">
        <p>Your Tickets</p>
    </div>
    <div id="boards">
        {#each tickets as ticket, boardIndex}
            <div class="board">
                <div class="header">
                    <p>#60382</p>
                    <p>9p</p>
                </div>
                <ul class="numbers" on:click={handleNumberClick} data-boardid="{boardIndex}">
                    {#each ticket as item}
                        <li class:hasNumber={item !== 0} class:taken={selectedNumbers.indexOf(item) >= 0}>
                            <span>{item !== 0 ? item : ''}</span>
                        </li>
                    {/each}
                </ul>
            </div>
        {/each}
    </div>
</div>
