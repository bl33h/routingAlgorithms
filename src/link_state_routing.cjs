/*
    link_state_routing.cjs
    Implements link state routing (LSR) algorithm for the XMPP client.

    authors:
        - Ricardo Méndez
        - Sara Echeverría
        - Melissa Pérez
*/

const {xml, client} = require('@xmpp/client');

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
        this.neighbors = {};
    }

    addNeighbor(neighbor, distance) {
        this.neighbors[neighbor.name] = distance;
    }
}

class PriorityQueue {
    constructor() {
        this.items = [];
    }

    enqueue(element, priority) {
        const queueElement = { element, priority };
        let added = false;
        for (let i = 0; i < this.items.length; i++) {
            if (queueElement.priority < this.items[i].priority) {
                this.items.splice(i, 1, queueElement);
                added = true;
                break;
            }
        }
        if (!added) {
            this.items.push(queueElement);
        }
    }

    dequeue() {
        return this.items.shift();
    }

    isEmpty() {
        return this.items.length === 0;
    }
}


class LinkStateRouting {
    constructor() {
        this.graph = new Graph();
    }

    addNode(node) {
        this.graph.addNode(node);
    }

    /**
     * 
     * @param {*} nodes JSON object with the nodes and their neighbors
     * @param {*} from Name of the node that sends the message
     */
    configure(nodes, from){
        for (const nodeName in nodes) {
            if (nodeName == from){
                continue;
            }
            const newNode = new Node(nodeName);
            const neighbors = nodes[nodeName];
            for (const neighborName in neighbors) {
                if (neighborName == from){
                    continue;
                }
                const distance = neighbors[neighborName];
                newNode.addNeighbor(neighborName, distance);
            }
            this.graph.addNode(newNode);
        }
    }

    getShortestPath(source, destination) {
        const distances = {};
        const previous = {};
        const queue = new PriorityQueue();

        for (const nodeName in this.graph.nodes) {
            distances[nodeName] = Infinity;
            previous[nodeName] = null;
            queue.enqueue(nodeName, Infinity);
        }
        distances[source] = 0;
        queue.enqueue(source, 0);

        while (!queue.isEmpty()) {
            const { element: currentNode } = queue.dequeue();

            if (currentNode === destination) {
                break;
            }

            for (const neighbor in this.graph.nodes[currentNode].neighbors) {
                const alt = distances[currentNode] + this.graph.nodes[currentNode].neighbors[neighbor];
                if (alt < distances[neighbor]) {
                    distances[neighbor] = alt;
                    previous[neighbor] = currentNode;
                    queue.enqueue(neighbor, alt);
                }
            }
        }

        let nextHop = destination;
        while (previous[nextHop] !== source) {
            nextHop = previous[nextHop];
        }

        return nextHop
    }

    /**
     * 
     * @param {*} xmpp Client XMPP from node_management
     * @param {*} message JSON object with the message to send
     * @param {*} names  JSON object with the server names of the nodes
     * @param {*} clientName  Name of the client being used
     */
    sendMessage(xmpp, message, names, clientName){
        message.hops += 1;

        const nextHop = this.getShortestPath(clientName, names[message.to]);

        const messageToSend = xmpp.stanza('message', {
            to: names[nextHop],
            type: 'chat',
        }).c('body').t(JSON.stringify(message));

        xmpp.send(messageToSend);
    
    }

    
}

module.exports = LinkStateRouting;