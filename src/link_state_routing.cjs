/*
    link_state_routing.cjs
    Implements link state routing (LSR) algorithm for the XMPP client.

    authors:
        - Ricardo Méndez
        - Sara Echeverría
        - Melissa Pérez
*/

const { xmpp, sendLinkState } = require('./xmpp_config.cjs');

// Tables for Link State Routing
const linkStateDatabase = {};

xmpp.on('online', async address => {
    console.log(`Connected to alumchat.lol as ${address.toString()}`);

    // Send initial link state message
    const initialMessage = {
        type: 'link-state',
        from: address.toString(),
        to: 'all@alumchat.lol',
        hops: 3,
        headers: [],
        payload: {
            node: address.toString(),
            neighbors: getNeighbors(),
            sequence: 1
        }
    };
    console.log('Sending initial link state message:', initialMessage);
    sendLinkState(initialMessage);
});

xmpp.on('stanza', async stanza => {
    console.log('Received stanza:', stanza.toString());
    if (stanza.is('message') && stanza.type === 'chat') {
        try {
            const json = JSON.parse(stanza.getChildText('body'));
            console.log('Parsed JSON:', json);
            if (json && json.type === 'link-state') {
                handleLinkStateMessage(json);
            } else {
                console.log('Unknown message type received:', json.type);
            }
        } catch (error) {
            console.error('Error processing incoming message:', error);
        }
    }
});

// Handle incoming link state messages
function handleLinkStateMessage(message) {
    console.log('Handling link state message:', message);
    const { node, neighbors, sequence } = message.payload;

    // Update link state database if the sequence number is new
    if (!linkStateDatabase[node] || linkStateDatabase[node].sequence < sequence) {
        linkStateDatabase[node] = { neighbors, sequence };
        console.log('Link state updated:', node, neighbors);

        // Recalculate the routing table
        updateRoutingTable();

        // Re-transmit the link state message to neighbors
        if (message.hops > 0) {
            message.hops--;
            console.log('Re-transmitting link state message:', message);
            sendLinkState(message);
        }
    } else {
        console.log('Link state message already known, ignoring.');
    }
}

// Update the routing table based on the link state database
function updateRoutingTable() {
    // Implementation of shortest path algorithm (e.g., Dijkstra)
    console.log('Routing table updated based on the latest link state information.');
}

// Placeholder function to get current neighbors
function getNeighbors() {
    return ['neighbor1', 'neighbor2'];
}

xmpp.start()
    .then(() => console.log('XMPP connection started'))
    .catch(err => console.error('Failed to start XMPP connection:', err));

module.exports = xmpp;