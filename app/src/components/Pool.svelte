<!--
  (c) 2022 Gaming With Ghosts
  This code is licensed under MIT license (see LICENSE for details)
-->

<script>

</script>


<style>
    #content {
        display: flex;
        flex-direction: column;
        gap: 10px;

        height: fit-content;
        background-color: lightgray;
    }

    #header {
        display: flex;
        align-items: flex-end;
        justify-content: space-around;
    }

    #chart {
        width: 90px;
        height: 35px;

        border: 2px solid whitesmoke;
        background-color: grey;
    }

    #chart .row {
        height: 33.333%;

        border: 1px solid lightgray;
        border-collapse: collapse;
        background-color: grey;
    }

    #chart .row.solved {
        background-color: green;
    }

    #pool div:first-child, #players div:first-child {
        font-size: 9px;
        text-transform: uppercase;
    }

    #pool .info, #players .info {
        display: flex;
        justify-items: center;
        gap: 5px;
    }

    #pool img, #players img {
        display: inline;
        width: 20px;
    }

    #prizes {
        padding: 0;
    }

    #prizes li {
        display: flex;
        justify-content: space-between;
        gap: 5px;

        padding: 5px;

        border: 1px solid gray;
        border-top: 0;

        color: lightgray;
        background-color: #006D71;
    }

    #prizes img {
        width: 20px;
    }

    #prizes li:first-child {
        justify-content: initial;
        border-top: 1px solid grey;
    }

    #prizes li:first-child span:nth-child(2),
    #prizes li:nth-child(2) span:first-child,
    #prizes li:nth-child(3) span:first-child,
    #prizes li:nth-child(4) span:first-child  {
        flex-grow: 1;
    }

    .circle {
        padding: 5px;
        border-radius: 50%;
        background-color: #004f00;
    }
</style>


<div id="content">
    <div id="header">
        <div id="chart">
            <div class="row solved" id="toprow"></div>
            <div class="row solved" id="middlerow"></div>
            <div class="row" id="bottomrow"></div>
        </div>
        <div id="pool">
            <div>Price pool</div>
            <div class="info">
                <img alt="" aria-hidden="true" src="/pool.jpg"/>
                <span>9p</span>
            </div>
        </div>
        <div id="players">
            <div>Players</div>
            <div class="info">
                <img alt="" aria-hidden="true" src="user.jpg"/>
                <span>50</span>
            </div>
        </div>
    </div>
    <ul id="prizes">
        <li>
            <span>Bingo!</span>
            <span><span class="circle">28</span></span>
            <img src="matic.svg" alt="matic logo" />
            <span>250</span>
        </li>
        <li>
            <span>Top Line</span>
            <img src="matic.svg" alt="matic logo" />
            <span>120</span>
        </li>
        <li>
            <span>Mid Line</span>
            <img src="matic.svg" alt="matic logo" />
            <span>75</span>
        </li>
        <li>
            <span>Bottom Line</span>
            <img src="matic.svg" alt="matic logo" />
            <span>20</span>
        </li>
    </ul>
</div>
