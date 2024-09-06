/*
    flooding.cjs
    Implements Flooding algorithm for the XMPP client.

    authors:
        - Ricardo Méndez
        - Sara Echeverría
        - Melissa Pérez
*/
const {xml, client} = require('@xmpp/client');
let processedMessages = new Set();


function generateMessageID(message) {
    return `${message.to}:${message.payload}:${message.hops}`;
}

function startFlooding(xmpp, nombres, message, nodes) {
    const messageID = generateMessageID(message);

    if (processedMessages.has(messageID)) {
        console.log(`Mensaje ya procesado, no reenviar: ${messageID}`);
        return;
    }

    processedMessages.add(messageID);
    
    console.log('Next nodes to receive message:', nodes);
    message.hops++;

    for(const key in nodes) {
        if (key !== message.from) {
            console.log(`Reenviando mensaje a ${key}`);
            xmpp.send(xml('message', {to: nombres[key]}, xml('body', {}, JSON.stringify(message))));
        }
    }
}

module.exports = { startFlooding };
