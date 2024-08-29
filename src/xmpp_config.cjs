/*
    xmpp_config.cjs
    Configuration for XMPP client.

    authors:
        - Ricardo Méndez
        - Sara Echeverría
        - Melissa Pérez
*/

const { client, xml } = require('@xmpp/client');
const debug = require('@xmpp/debug');
const { send } = require('./link_state_routing.cjs');

// Shared XMPP configuration
const xmpp = client({
    service: 'ws://alumchat.lol:7070/ws/',
    domain: 'alumchat.lol',
    resource: '',
    username: 'men21289-test',
    password: 'test324'
});

debug(xmpp, true);

xmpp.on('error', err => {
    console.error('XMPP connection error:', err);
});

// Function to send link state messages (LSR)
function sendLinkState(message) {
    const messageXML = xml('message', { type: 'chat', to: 'all@alumchat.lol' },
        xml('body', {}, JSON.stringify(message))
    );
    xmpp.send(messageXML).catch(err => console.error('Failed to send link state message:', err));
}

// // Function to send flooding messages
// function sendFlooding(message) {
//     const messageXML = xml('message', { type: 'chat', to: 'all@alumchat.lol' },
//         xml('body', {}, JSON.stringify(message))
//     );
//     xmpp.send(messageXML).catch(err => console.error('Failed to send flooding message:', err));
// }

// function to send flooding messages
function sendFlooding(from, nodes, message) {
    nodes.forEach(node => {
        if (node !== from) {
            const messageXML = xml('message', { type: 'chat', to: `${node}@alumchat.lol` },
                xml('body', {}, message)
            );
            xmpp.send(messageXML).catch(err => console.error('Failed to send flooding message:', err));
        }
    });
}

const sendDVR = async (dvrData) => {
    const { source, destination, distance } = dvrData;

    xmpp.on('online', async address => {
        console.log('XMPP client is online as', address.toString());
    });

    const dvrMessage = xml('message', { type: 'chat', to: `${destination}@alumchat.lol` },
        xml('body', {}, `DVR from ${source}: Distance to ${destination} is ${distance}`)
    );

    try {
        await xmpp.send(dvrMessage);
        console.log(`DVR message sent from ${source} to ${destination} with distance ${distance}.`);
    } catch (error) {
        console.error('Error sending DVR message:', error);
    }
};

module.exports = { xmpp, sendLinkState, sendFlooding, sendDVR };
