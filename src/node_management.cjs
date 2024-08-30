/*
    node_management.cjs
    Implements the XMPP client for the node management system.

    authors:
        - Ricardo Méndez
        - Sara Echeverría
        - Melissa Pérez
*/

const { xmpp } = require('./xmpp_config.cjs');
const fs = require('fs');
const path = require('path');
const LinkStateRouting = require('./link_state_routing.cjs');
const { startFlooding } = require('./flooding.cjs');

// Cargar archivos de configuración
const topoConfigPath = path.join(__dirname, 'topo1-x-randomB-2024.txt');
const namesConfigPath = path.join(__dirname, 'names1-x-randomB-2024.txt');

const topoConfig = JSON.parse(fs.readFileSync(topoConfigPath, 'utf8'));
const namesConfig = JSON.parse(fs.readFileSync(namesConfigPath, 'utf8'));

const nodos = topoConfig.config;
const nombres = namesConfig.config;

console.log('Configuración de nodos:', nodos);
console.log('Configuración de nombres:', nombres);

// Evento cuando el cliente está en línea
xmpp.on('online', async (address) => {
    console.log(`Conectado como ${address.toString()}`);
    iniciarAlgoritmo();
});

// Manejo de mensajes entrantes
xmpp.on('stanza', async (stanza) => {
    if (stanza.is('message')) {
        const from = stanza.attrs.from;
        const message = stanza.getChildText('body');
        if (message) {
            console.log('Mensaje recibido:', message);
            procesarMensaje(from, message);
        }
    }
});

// Manejo de errores
xmpp.on('error', (err) => {
    console.error('Error en la conexión:', err);
});

// Iniciar conexión
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
    const message = {
        type: "flooding",
        from: 'A',
        hops: 0,
        payload: "Mensaje de prueba utilizando Flooding"
    };
    console.log('Enviando mensaje de Flooding:', message);
    startFlooding('A', message, nombres);
}

function enviarLinkStateRouting() {
    const lsrMessage = {
        type: 'lsr',
        payload: "Mensaje de prueba utilizando Link State Routing",
        hops: 0,
        to: 'B',
    };
    console.log('Enviando mensaje de LSR:', lsrMessage);
    const lsr = new LinkStateRouting();
    lsr.configure(nodos, 'A');
    lsr.sendMessage(xmpp, lsrMessage, nombres, 'A');
}

function procesarMensaje(from, message) {
    try {
        const msg = JSON.parse(message);
        console.log(`Procesando mensaje de ${from}:`, msg);

        switch (msg.type) {
            case 'flooding':
                console.log(`Flooding message recibido de ${msg.from}`);
                if (msg.hops < 10) {
                    console.log(`Reenviando mensaje de Flooding: ${msg}`);
                    startFlooding(msg.from, msg, nombres);
                } else {
                    console.log(`Mensaje de Flooding ha alcanzado el número máximo de hops: ${msg}`);
                }
                break;
            case 'lsr':
                console.log(`Link State Routing message recibido de ${msg.from}`);
                if (msg.hops < 10) {
                    const lsr = new LinkStateRouting();
                    lsr.configure(nodos, 'A');
                    console.log(`Reenviando mensaje de LSR: ${msg}`);
                    lsr.sendMessage(xmpp, msg, nombres, 'A');
                } else {
                    console.log(`Mensaje de LSR ha alcanzado el número máximo de hops: ${msg}`);
                }
                break;
            default:
                console.log('Tipo de mensaje no reconocido:', msg.type);
        }
    } catch (error) {
        console.error('Error al procesar el mensaje:', error);
    }
}

module.exports = { iniciarAlgoritmo, procesarMensaje };
