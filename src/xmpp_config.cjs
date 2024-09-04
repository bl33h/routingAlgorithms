/*
    xmpp_config.cjs
    Configuration for XMPP client.

    authors:
        - Ricardo Méndez
        - Sara Echeverría
        - Melissa Pérez
*/

const { xml, client } = require('@xmpp/client');
const debug = require('@xmpp/debug');

// Configuración del cliente XMPP
const xmpp = client({
    service: 'ws://alumchat.lol:7070/ws/',
    domain: 'alumchat.lol',
    resource: '',
    username: 'men324v1',
    password: '123'
});

//debug(xmpp, true);

xmpp.on('error', err => {
    console.error('XMPP connection error:', err);
});

function sendMessage(xmppClient, message) {
    try {
        // Ensure message.to and message.type are correctly defined
        const messageXML = xml(
            "message",
            { type: 'chat', to: message.to },
            xml("body", null, message.payload)
        );
        xmppClient.send(messageXML);
    } catch (error) {
        console.error('Failed to send message:', error);
    }
}


module.exports = {
    xmpp,
    sendMessage,
};
