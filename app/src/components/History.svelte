<!--
  (c) 2022 Gaming With Ghosts
  This code is licensed under MIT license (see LICENSE for details)
-->

<script>
    export function addToHistory(number) {
        console.log(number)
    }

    let numbers = [5, 90];
</script>


<style>
    #history {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    #short-history {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 5px;

        padding-inline: 20px;
        padding-block: 5px;

        background-color: lightgray;
    }

    #short-history #recent, #short-history #next p {
        display: flex;
        justify-content: center;
        align-items: center;

        width: 45px;
        height: 45px;

        padding: 5px;
        border: 10px solid green;
        border-radius: 50%;

        background-color: white;
    }

    #short-history #next {
        display: flex;
        flex-direction: row;

        height: fit-content;

        padding: 2px;

        border-radius: 50px;
        background-color: aquamarine;
    }

    #short-history #next p {
        width: 30px;
        height: 30px;

        border-width: 5px;
    }

    #short-history #next p:first-child {
        border-color: blue;
    }

    #short-history #next p:nth-child(2) {
        border-color: red;
    }

    #short-history #next p:nth-child(4) {
        border-color: yellow;
    }

    #short-history #next p:nth-child(4) {
        border-color: blueviolet;
    }

    #full-history {
        display: flex;
        flex-direction: column;
        align-items: center;

        padding: 10px;

        background-color: lightgreen;
    }

    #full-history ul {
        display: grid;
        grid-template: repeat(9, 20px) / repeat(10, 20px);

        color: grey;
        font-size: 10px;
        padding: 0;

        list-style: none;
    }

    #full-history ul li {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    #full-history ul li.taken {
        color: white;

        border-radius: 50%;
        background-color: blue;
    }
</style>


<div id="history">
    <div id="short-history">
        <p id="recent">5</p>
        <div id="next">
            <p>4</p>
            <p>3</p>
            <p>2</p>
            <p>1</p>
        </div>
    </div>

    <div id="full-history">
        <p>{`${numbers.length} / 90`}</p>
        <ul>
            {#each Array(90) as _, index}
                <li class:taken={numbers.indexOf(index + 1) !== -1}>{index + 1}</li>
            {/each}
        </ul>
    </div>
</div>
