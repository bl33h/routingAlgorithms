/*
    distance_vector_router.cjs
    Implementation of Distance Vector Routing algorithm.

    authors:
        - Ricardo Méndez
        - Sara Echeverría
        - Melissa Pérez
*/

const { xmpp, sendDVR } = require('./xmpp_config.cjs');

const routingTable = {
    node1: { node2: 5, node3: 10 },
    node2: { node1: 5, node3: 3 },
    node3: { node1: 10, node2: 3 }
};

// Function to construct and send DVR messages
const broadcastDVR = (sourceNode) => {
    const neighbors = routingTable[sourceNode];

    for (const [destination, distance] of Object.entries(neighbors)) {
        const dvrMessage = {
            type: 'distance-vector',
            from: sourceNode,
            to: destination,
            distance: distance,
            payload: {
                source: sourceNode,
                destination: destination,
                distance: distance
            }
        };
        console.log('Sending DVR message:', dvrMessage);
        sendDVR(dvrMessage);
    }
};

// Send initial DVR message when XMPP client goes online
xmpp.on('online', async address => {
    const initialMessage = {
        type: 'distance-vector',
        from: address.toString(),
        to: 'all@alumchat.lol',
        payload: {
            source: address.toString(),
            neighbors: routingTable[address.toString()],
            sequence: 1
        }
    };
    console.log('Sending initial distance vector message:', initialMessage);
    sendDVR(initialMessage);
});

// Listen for incoming messages
xmpp.on('stanza', async stanza => {
    console.log('Received stanza:', stanza.toString());
    if (stanza.is('message') && stanza.type === 'chat') {
        try {
            const json = JSON.parse(stanza.getChildText('body'));
            console.log('Parsed JSON:', json);
            if (json && json.type === 'distance-vector') {
                handleDVRMessage(json);
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    }
});

// Function to handle incoming DVR messages
const handleDVRMessage = (message) => {
    const { source, destination, distance } = message.payload;
    console.log(`Received DVR message from ${source} to ${destination} with distance ${distance}.`);

    // Update routing table
    if (!routingTable[source]) {
        routingTable[source] = {};
    }
    routingTable[source][destination] = parseInt(distance, 10);

    // Optionally, broadcast updated routing table
    broadcastDVR(source);
};

xmpp.start()
    .then(() => console.log('XMPP connection started'))
    .catch(err => console.error('Failed to start XMPP connection:', err));

module.exports = { broadcastDVR };