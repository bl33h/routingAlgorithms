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

// Configuración del cliente XMPP
const xmpp = client({
    service: 'ws://alumchat.lol:7070/ws/',
    domain: 'alumchat.lol',
    resource: '',
    username: 'men21289-test',
    password: 'test324'
});

//debug(xmpp, true);

xmpp.on('error', err => {
    console.error('XMPP connection error:', err);
});

function sendMessage(destinationJID, message) {
    const messageXML = xml('message', {
        to: destinationJID,
        type: 'chat',
    }).c('body').t(JSON.stringify(message));

    xmpp.send(messageXML).catch(err => console.error('Failed to send message:', err));
}

module.exports = {
    xmpp,
    sendMessage,
};
