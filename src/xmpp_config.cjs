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


// Función para enviar un mensaje
function sendMessage(xmpp, message) {
  if (!message.to || !message.body) {
    console.error('Error: Mensaje inválido. Falta destinatario o cuerpo.');
    return;
  }

  const messageXML = xml('message', { type: 'chat', to: message.to }, xml('body', {}, message.body));
  xmpp.send(messageXML).catch(console.error);
}

module.exports = {
    A: 'men324v1@alumchat.lol',
    B: 'men324v2@alumchat.lol',
    C: 'men324v3@alumchat.lol',
    D: 'men324v4@alumchat.lol',
    E: 'men324v5@alumchat.lol',
    F: 'men324v6@alumchat.lol',
    sendMessage
};
