/*
    flooding.cjs
    Implements Flooding algorithm for the XMPP client.

    authors:
        - Ricardo Méndez
        - Sara Echeverría
        - Melissa Pérez
*/

const { sendMessage } = require('./xmpp_config.cjs');

let processedMessages = new Set();

function getAllNodes(excludeNodeID, names) {
    if (!names) {
        console.error('Error: names es undefined o null!');
        return [];
    }
    return Object.keys(names).filter(nodeID => nodeID !== excludeNodeID);
}

function generateMessageID(message) {
    return `${message.to}:${message.body}:${message.hops}`;
}

function startFlooding(xmpp, fromNode, toNode, message, nodes, nombres) {
    const messageID = generateMessageID(message);

    if (processedMessages.has(messageID)) {
        console.log(`Mensaje ya procesado, no reenviar: ${messageID}`);
        return;
    }

    processedMessages.add(messageID);
    const nextNodes = getAllNodes(fromNode, nombres);
    console.log('Next nodes to receive message:', nextNodes);

    if (!nextNodes.length) {
        console.error('No se encontraron nodos para enviar el mensaje.');
        return;
    }

    nextNodes.forEach(node => {
        if (!nombres[node]) {
            console.error(`Error: No se encontró un destino para el nodo ${node}`);
            return;
        }

        const newMessage = { body: message.body || message, hops: (message.hops || 0) + 1, to: nombres[node] };
        console.log(`Sending message to ${node}:`, newMessage);

        sendMessage(xmpp, newMessage);
    });
}

module.exports = { startFlooding };
