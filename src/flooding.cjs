/*
    flooding.cjs
    Implements flooding algorithm for the XMPP client.

    authors:
        - Ricardo Méndez
        - Sara Echeverría
        - Melissa Pérez
*/
const { client, xml } = require('@xmpp/client');

// topology and neighbor configuration
const names = {
    'A': 'group12@alumchat.xyz',
    'B': 'group8@alumchat.xyz',
    'C': 'group11@alumchat.xyz',
    'D': 'group10@alumchat.xyz',
    'E': 'group7@alumchat.xyz',
    'F': 'group9@alumchat.xyz'
};

const topology = {
    'A': ['D', 'E'],
    'B': ['C', 'D', 'E', 'F'],
    'C': ['B', 'D', 'E'],
    'D': ['A', 'B', 'C', 'E'],
    'E': ['A', 'B', 'C', 'D', 'F'],
    'F': ['B', 'E']
};

// duplicate control
const messageLog = {};

const xmpp = client({
    service: 'ws://alumchat.lol:7070/ws/',
    domain: 'alumchat.lol',
    resource: 'example',
    username: ' ',
    password: ' '
});

xmpp.on('online', async address => {
    console.log(`Connected to alumchat.lol as ${address.toString()}`);
    const localNode = address.local; // Extract node identifier from address
    if (!topology[localNode]) {
        console.error('No neighbors defined for', localNode);
        return;
    }
    sendFlooding({
        type: 'hello',
        from: address.toString(),
        to: 'all@alumchat.lol',
        hops: 3,
        headers: [],
        payload: 'Initial hello from ' + address.toString()
    }, topology[localNode]);
});

xmpp.on('stanza', async stanza => {
    if (stanza.is('message') && stanza.type === 'chat') {
        const json = JSON.parse(stanza.getChildText('body'));
        console.log('Received message:', json);
        if (json && json.type === 'hello' && json.hops > 0) {
            if (!messageLog[json.payload] || messageLog[json.payload] < json.hops) {
                messageLog[json.payload] = json.hops;
                json.hops--;
                console.log('Flooding message to neighbors...');
                sendFlooding(json, topology[names[json.from]], json.from); 
            } else {
                console.log('Duplicate or insufficient hops message, not re-sending.');
            }
        }
    }
});

function sendFlooding(message, neighbors, exclude) {
    if (!neighbors) {
        console.error('Neighbors not defined for', message.from);
        return;
    }
    neighbors.forEach(neighbor => {
        if (names[neighbor] !== exclude) {
            const newMessage = { ...message, hops: message.hops + 1 };
            sendToNeighbor(names[neighbor], newMessage);
        }
    });
}

function sendToNeighbor(neighbor, message) {
    xmpp.send(xml('message', { to: neighbor, type: 'chat' },
        xml('body', null, JSON.stringify(message))
    ));
}

xmpp.start()
    .then(() => console.log('XMPP connection started'))
    .catch(err => console.error('Failed to start XMPP connection:', err));
