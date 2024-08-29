/*
    flooding.cjs
    Implements Flooding algorithm for the XMPP client.

    authors:
        - Ricardo Méndez
        - Sara Echeverría
        - Melissa Pérez
*/

const { xmpp, sendMessage } = require('./xmpp_config.cjs');

function getAllNodes(excludeNodeID, names) {
    if (!names) {
        console.error('Error: names es undefined o null!');
        return [];
    }
    return Object.keys(names).filter(nodeID => nodeID !== excludeNodeID);
}

function startFlooding(excludeNodeID, message, names) {
    console.log('names recibido en startFlooding:', names);
    const allNodesExceptSelf = getAllNodes(excludeNodeID, names);
    allNodesExceptSelf.forEach(nodeID => {
        const destinationJID = names[nodeID];
        const floodingMessage = {
            type: "flooding",
            from: message.from,
            to: destinationJID,
            hops: message.hops + 1,
            headers: [],
            payload: message.payload,
        };
        sendMessage(destinationJID, floodingMessage);
    });
}

module.exports = { startFlooding };
