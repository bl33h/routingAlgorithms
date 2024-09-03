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
        this.nodes = {};
    }

    addNode(node) {
        this.nodes[node.name] = node;
    }
}

class Node {
    constructor(name) {
        this.name = name;
        this.neighbors = {};
    }

    addNeighbor(neighbor, distance) {
        this.neighbors[neighbor] = distance;
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
    configure(nodes){
        for (const nodeName in nodes) {
            const newNode = new Node(nodeName);
            const neighbors = nodes[nodeName];
            for (const neighborName in neighbors) {
                const distance = neighbors[neighborName];
                newNode.addNeighbor(neighborName, distance);
            }
            this.graph.addNode(newNode);
        }
        console.log('Graph configured:', this.graph.nodes);
    }

    getShortestPath(source, destination) {
        const distances = {};
        const previous = {};
        const queue = new PriorityQueue();
        const visited = new Set();  // Set to track visited nodes
    
        // Initialize distances and previous nodes
        for (const nodeName in this.graph.nodes) {
            distances[nodeName] = Infinity;
            previous[nodeName] = null;
        }
    
        distances[source] = 0;
        queue.enqueue(source, 0);
    
        console.log(`Iniciando cálculo de rutas desde ${source} hacia ${destination}`);
    
        while (!queue.isEmpty()) {
            const { element: currentNode } = queue.dequeue();
            console.log(`Procesando nodo: ${currentNode}`);
    
            // If the node has been visited, skip processing
            if (visited.has(currentNode)) {
                console.log(`Nodo ${currentNode} ya fue visitado, saltando...`);
                continue;
            }
    
            visited.add(currentNode);
    
            // If the current node is the destination, break out of the loop
            if (currentNode === destination) {
                console.log(`Llegamos al destino: ${destination}`);
                break;
            }
    
            const currentNodeData = this.graph.nodes[currentNode];
            if (!currentNodeData) {
                console.error(`Nodo ${currentNode} no encontrado en el grafo.`);
                continue;
            }

    
            for (const neighbor in currentNodeData.neighbors) {
                const alt = distances[currentNode] + currentNodeData.neighbors[neighbor];
                console.log(`Revisando vecino ${neighbor} de ${currentNode} con distancia ${alt}`);
                if (alt < distances[neighbor]) {
                    distances[neighbor] = alt;
                    previous[neighbor] = currentNode;
                    queue.enqueue(neighbor, alt);
                    console.log(`Actualizada distancia de ${neighbor} a ${alt}`);
                }
            }

        }
    
        let path = [];
        let nextHop = destination;
        console.log("entro")
        while (nextHop !== null) {
            path.unshift(nextHop);
            console.log(path)
            nextHop = previous[nextHop];
            console.log(nextHop)
        }

        console.log("salio")
    
        if (path.length === 1) {
            console.error(`No se pudo encontrar un camino desde ${source} hasta ${destination}`);
            return null;
        }
    
        nextHop = path[1]; // The next node in the path
        console.log(`Next hop de ${source} a ${destination} es ${nextHop}`);
        return {nextHop, isDestination: nextHop === destination};
    }

    /**
     * 
     * @param {*} xmpp Client XMPP from node_management
     * @param {*} message JSON object with the message to send
     * @param {*} names  JSON object with the server names of the nodes
     * @param {*} clientName  Name of the client being used
     */
    sendMessage(xmpp, message, names, clientName){
        // Verificar si el destino (message.to) es válido
        if (!message.to) {
            console.error('Error: message.to no está definido.');
            return;
        }

        message.hops += 1;
    
        // Llamar a getShortestPath con el destino validado
        const {nextHop, isDestination} = this.getShortestPath(clientName, message.to);
    
        if (!nextHop) {
            console.error(`No se pudo encontrar el siguiente salto para ${clientName} -> ${message.to}`);
            return;
        }
    
        console.log(`Enviando mensaje desde ${clientName} hacia ${nextHop} con destino final ${message.to}`);
        const messageToSend = {
            type: "lsr",
            from: clientName,
            to: message.to,
            hops: message.hops,
            headers: message.headers,
            payload: message.payload,
        }
    
        xmpp.send(
            xml("message", { to: names[nextHop] }, xml("body", {}, JSON.stringify(messageToSend)))
        ).catch(err => console.error('Failed to send message:', err));

        console.log(`Mensaje enviado a ${nextHop}: ${messageToSend}`);
        
    }     
}

module.exports = LinkStateRouting;