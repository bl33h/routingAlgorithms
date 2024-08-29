/*
    flooding.cjs
    Implements Flooding algorithm for the XMPP client.

    authors:
        - Ricardo Méndez
        - Sara Echeverría
        - Melissa Pérez
*/

const { sendMessage } = require('./xmpp_config.cjs');
const { getAllNodes } = require('./node_management.cjs');
const config = require('./xmpp_config.cjs');

// function to get all nodes except the sender and send them the flooding message
function startFlooding(excludeNodeID, message) {
    const allNodesExceptSelf = getAllNodes(excludeNodeID);
    allNodesExceptSelf.forEach(nodeID => {
        const destinationJID = config.names[nodeID];
        const floodingMessage = {
            type: "flooding",
            from: config.jid,   // sender
            to: destinationJID, // recipient
            hops: 0,
            headers: [],
            payload: message,
        };
        sendMessage(destinationJID, floodingMessage);
    });
}

// export the startFlooding function for use in other parts of the application
module.exports = { startFlooding };