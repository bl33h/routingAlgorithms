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

function startFlooding(xmpp, fromNode, toNode, message, nodes, nombres) {
    const nextNodes = nodes[fromNode];
    console.log('Next nodes to receive message:', nextNodes);

    Object.keys(nextNodes).forEach(node => {
        const newMessage = { ...message, hops: message.hops + 1 };
        newMessage.to = nombres[node];
        console.log(`Sending message to ${node}:`, newMessage);
        sendMessage(xmpp, newMessage);
    });
}

module.exports = { startFlooding };