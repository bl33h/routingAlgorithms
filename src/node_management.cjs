/*
    node_management.cjs
    Implements the XMPP client for the node management system.

    authors:
        - Ricardo Méndez
        - Sara Echeverría
        - Melissa Pérez
*/

const { xml } = require('@xmpp/client');
const { xmpp, sendLinkState, sendFlooding } = require('./xmpp_config.cjs');
const fs = require('fs');
const path = require('path');

// Load configuration files
const topoConfigPath = path.join(__dirname, 'topo1-x-randomB-2024.txt');
const namesConfigPath = path.join(__dirname, 'names1-x-randomB-2024.txt');

const topoConfig = JSON.parse(fs.readFileSync(topoConfigPath, 'utf8'));
const namesConfig = JSON.parse(fs.readFileSync(namesConfigPath, 'utf8'));

const nodos = topoConfig.config;
const nombres = namesConfig.config;

console.log('Configuración de nodos:', nodos);
console.log('Configuración de nombres:', nombres);

// Event when the client is online
xmpp.on('online', async (address) => {
    console.log(`Conectado como ${address.toString()}`);
    iniciarAlgoritmo();
});

// Entering messages
xmpp.on('stanza', async (stanza) => {
    if (stanza.is('message')) {
        const from = stanza.attrs.from;
        const message = stanza.getChildText('body');
        if (message) {
            procesarMensaje(from, message);
        }
    } else if (stanza.is('iq') && stanza.attrs.type === 'get') {
        // Handle IQ requests and respond with an empty response
        const iqResponse = xml('iq', { type: 'result', id: stanza.attrs.id, to: stanza.attrs.from });
        xmpp.send(iqResponse).catch(err => {
            console.error('Error sending IQ response:', err);
        });
    }
});

// Error handling
xmpp.on('error', (err) => {
    console.error('Error en la conexión:', err);
});

// Start connection
xmpp.start().catch(console.error);

function iniciarAlgoritmo() {
    const algoritmo = process.argv[2];

    switch (algoritmo) {
        case 'flooding':
            console.log('Iniciando algoritmo Flooding...');
            enviarFlooding();
            break;
        case 'lsr':
            console.log('Iniciando algoritmo Link State Routing...');
            enviarLinkStateRouting();
            break;
        default:
            console.log('Algoritmo no reconocido. Use "flooding" o "lsr".');
            process.exit(1);
    }
}

function enviarFlooding() {
    const message = "Mensaje de prueba utilizando Flooding";
    const fromNode = 'A'; // Supón que este nodo es 'A', ajusta según tu configuración
    sendFlooding(fromNode, Object.keys(nodos), message);
}

function enviarLinkStateRouting() {
    const lsrMessage = {
        type: 'lsr',
        payload: "Mensaje de prueba utilizando Link State Routing",
        hops: 0,
    };
    sendLinkState(lsrMessage);
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
        case 'flooding':
            console.log(`Flooding message recibido de ${msg.from}`);
            // Posible lógica adicional para manejar flooding
            break;
        case 'lsr':
            console.log(`Link State Routing message recibido de ${msg.from}`);
            // Posible lógica adicional para manejar LSR
            break;
        default:
            console.log('Tipo de mensaje no reconocido:', msg.type);
    }
}

function enviarEcho(destino) {
    const mensaje = {
        type: "echo",
        from: 'A',
        to: destino,
        hops: 1,
        headers: [],
        payload: "Echo desde " + 'A',
    };
    sendFlooding('A', [destino], JSON.stringify(mensaje));
}

function actualizarTabla(info) {
    console.log('Actualizando tabla con:', info);
}

module.exports = { iniciarAlgoritmo, procesarMensaje };
