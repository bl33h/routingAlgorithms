/*
    link_state_routing.cjs
    Implements link state routing (LSR) algorithm for the XMPP client.

    authors:
        - Ricardo Méndez
        - Sara Echeverría
        - Melissa Pérez
*/

const { xmpp, sendLinkState } = require('./xmpp_config.cjs');

