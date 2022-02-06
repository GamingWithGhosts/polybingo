/*
  (c) 2022 Gaming With Ghosts
  This code is licensed under MIT license (see LICENSE for details)
*/

import { readable } from "svelte/store";
import { browser } from "$app/env";

import Moralis from 'moralis/dist/moralis.min.js';

export const moralis = readable(null, (set) => {
    if (browser) {
        set(Moralis);
        Moralis.start({
            serverUrl: import.meta.env.CLIENT_MORALIS_SERVER_URL,
            appId: import.meta.env.CLIENT_MORALIS_APP_ID
        })

        Moralis.enableWeb3();
    }
})
