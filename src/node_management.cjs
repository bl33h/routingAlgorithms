/*
    node_management.cjs
    Implements the XMPP client for the node management system.

    authors:
        - Ricardo Méndez
        - Sara Echeverría
        - Melissa Pérez
*/

const { client } = require('@xmpp/client');
const debug = require('@xmpp/debug');
const fs = require('fs');
const path = require('path');
const config = require('./xmpp_config.cjs');
const topoConfigPath = path.join(__dirname, 'topo1-x-randomB-2024.txt');
const namesConfigPath = path.join(__dirname, 'names1-x-randomB-2024.txt');

const topoConfig = JSON.parse(fs.readFileSync(topoConfigPath, 'utf8'));
const namesConfig = JSON.parse(fs.readFileSync(namesConfigPath, 'utf8'));

const nodos = topoConfig.config;
const nombres = namesConfig.config;

console.log('Configuración de nodos:', nodos);
console.log('Configuración de nombres:', nombres);

// Create XMPP client
const xmpp = client({
    service: `xmpp://${config.host}:${config.port}`,
    domain: config.host,
    resource: 'bot',
    username: config.jid.split('@')[0],
    password: config.password,
});

// Event when the client is online
xmpp.on('online', async (address) => {
    console.log(`Conectado como ${address.toString()}`);
    enviarMensajeHello();
});

// Entering messages
xmpp.on('stanza', async (stanza) => {
    if (stanza.is('message')) {
        const from = stanza.attrs.from;
        const message = stanza.getChildText('body');
        if (message) {
            procesarMensaje(from, message);
        }
    }
});

// Error handling
xmpp.on('error', (err) => {
    console.error('Error en la conexión:', err);
});

// Start connection
xmpp.start().catch(console.error);

function enviarMensajeHello() {
    const vecinos = nodos[config.nodeID];
    vecinos.forEach(async (vecino) => {
        const destino = nombres[vecino];
        const mensaje = {
            type: "hello",
            from: config.jid,
            to: destino,
            hops: 0,
            headers: [],
            payload: "Hola desde " + config.jid,
        };
        await enviarMensaje(destino, mensaje);
    });
}

async function enviarMensaje(destino, mensaje) {
    const message = xmpp.stanza('message', {
        to: destino,
        type: 'chat',
    }).c('body').t(JSON.stringify(mensaje));
    
    await xmpp.send(message);
}

function procesarMensaje(from, message) {
    const msg = JSON.parse(message);
    console.log(`Mensaje recibido de ${from}:`, msg);

    switch (msg.type) {
        case 'hello':
            enviarEcho(msg.from);
            break;
        case 'echo':
            console.log(`ECHO recibido de ${msg.from}`);
            break;
        case 'info':
            actualizarTabla(msg.payload);
            break;
        default:
            console.log('Tipo de mensaje no reconocido:', msg.type);
    }
}

function enviarEcho(destino) {
    const mensaje = {
        type: "echo",
        from: config.jid,
        to: destino,
        hops: 1,
        headers: [],
        payload: "Echo desde " + config.jid,
    };
    enviarMensaje(destino, mensaje);
}

function actualizarTabla(info) {
    console.log('Actualizando tabla con:', info);
}
