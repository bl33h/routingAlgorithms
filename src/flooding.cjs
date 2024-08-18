/*
    flooding.cjs
    Implements flooding algorithm for the XMPP client.

    authors:
        - Ricardo Méndez
        - Sara Echeverría
        - Melissa Pérez
*/

const { xmpp, sendFlooding } = require('./xmpp_config.cjs');

// duplicate control
const messageLog = {};

xmpp.on('online', async address => {
    console.log(`Conectado a alumchat.lol como ${address.toString()}`);

    // hello message
    sendFlooding({
        type: 'hello',
        from: address.toString(),
        to: 'all@alumchat.lol',
        hops: 3,
        headers: [],
        payload: 'initial hello from ' + address.toString()
    });
});

xmpp.on('stanza', async stanza => {
    console.log('Received stanza:', stanza.toString());
    if (stanza.is('message') && stanza.type === 'chat') {
        try {
            const json = JSON.parse(stanza.getChildText('body'));
            console.log('Parsed JSON:', json);
            if (json && json.type === 'hello' && json.hops > 0) {
                if (!messageLog[json.payload] || messageLog[json.payload] < json.hops) {
                    messageLog[json.payload] = json.hops;
                    console.log('Flooding message received:', json);
                    json.hops--;
                    sendFlooding(json); 
                }
            }
        } catch (error) {
            console.error('Failed to process incoming message:', error);
        }
    }
});

xmpp.start()
    .then(() => console.log('XMPP connection started'))
    .catch(err => console.error('Failed to start XMPP connection:', err));

module.exports = xmpp;
