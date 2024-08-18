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

// Shared XMPP configuration
const xmpp = client({
    service: 'ws://alumchat.lol:7070/ws/',
    domain: 'alumchat.lol',
    resource: '',
    username: 'men21289-test',
    password: 'test324'
});

debug(xmpp, true);

// Function to send link state messages (LSR)
function sendLinkState(message) {
    const messageXML = xml('message', { type: 'chat', to: 'all@alumchat.lol' },
        xml('body', {}, JSON.stringify(message))
    );
    xmpp.send(messageXML);
}

// Function to send flooding messages
function sendFlooding(message) {
    const messageXML = xml('message', { type: 'chat', to: 'all@alumchat.lol' },
        xml('body', {}, JSON.stringify(message))
    );
    xmpp.send(messageXML);
}

module.exports = { xmpp, sendLinkState, sendFlooding };