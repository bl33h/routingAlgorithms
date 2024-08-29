/*
    link_state_routing.cjs
    Implements link state routing (LSR) algorithm for the XMPP client.

    authors:
        - Ricardo Méndez
        - Sara Echeverría
        - Melissa Pérez
*/

const {xml} = require('@xmpp/client');

class Graph {
    constructor() {
        this.nodes = new Set();
    }

    addNode(node) {
        this.nodes.add(node);
    }
}

class Node {
    constructor(name) {
        this.name = name;
        this.neighbors = new Set();
    }

    addNeighbor(neighbor) {
        this.neighbors.add(neighbor);
    }
}


const lsr = async (xmpp, nodos, nombres) => {

}