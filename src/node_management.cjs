/*
    node_management.cjs
    Implements the XMPP client for the node management system.

    authors:
        - Ricardo Méndez
        - Sara Echeverría
        - Melissa Pérez
*/

const readline = require('readline');
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

let algorithm;
let currentNodo = '';
let isNodeSelected = false;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('Configuración de nodos:', nodos);
console.log('Configuración de nombres:', nombres);

// Función para inicializar la conexión XMPP con el nodo seleccionado
function initXMPPConnection(resource) {
    xmpp.options.resource = resource;
    xmpp.start().catch(err => {
        console.error('Error al iniciar la conexión XMPP:', err);
    });
}

// Función para reiniciar la conexión XMPP con el recurso seleccionado
function restartXMPPWithResource(resource) {
    xmpp.stop().then(() => {
        console.log('Cliente XMPP detenido correctamente.');
        initXMPPConnection(resource);
    }).catch(err => {
        console.error('Error al detener la conexión XMPP:', err);
    });
}

function promptNodo() {
    rl.question('Seleccione un nodo (A-F): ', nodo => {
        if (nombres.hasOwnProperty(nodo.toUpperCase())) {
            currentNodo = nodo.toUpperCase();
            isNodeSelected = true;
            restartXMPPWithResource(currentNodo);
        } else {
            console.log('Nodo no válido, intente nuevamente.');
            promptNodo();
        }
    });
}

function promptAction() {
    rl.question('\n¿Desea enviar (E) o recibir (R) un mensaje? (E/R): ', action => {
        if (action.toUpperCase() === 'E') {
            promptSend();
        } else if (action.toUpperCase() === 'R') {
            console.log('Listo para recibir mensajes. Espere...');
        } else {
            console.log('Opción no reconocida.');
            promptAction();
        }
    });
}

function promptSend() {
    rl.question('\nIntroduzca el nodo destinatario (A-F): ', to => {
        if (nombres.hasOwnProperty(to.toUpperCase())) {
            rl.question('Introduzca el mensaje: ', message => {
                enviarMensaje(currentNodo, to.toUpperCase(), message);
                promptAction();
            });
        } else {
            console.log('Nodo no válido, intente nuevamente.');
            promptSend();
        }
    });
}

function enviarMensaje(from, to, message) {
    rl.question('¿Desea usar Link State Routing (L) o Flooding (F)? (L/F): ', algorithm => {
        if (algorithm.toUpperCase() === 'L') {
            const messageToSend = {
                type: "lsr",
                from,
                to: to,
                hops: 0,
                headers: [],
                payload: message,
            }
            const linkStateRouting = new LinkStateRouting();
            linkStateRouting.configure(nodos)
            linkStateRouting.sendMessage(xmpp, messageToSend, nombres, currentNodo);
        } else if (algorithm.toUpperCase() === 'F') {
            const message = {
                type: "flooding",
                from,
                to: nombres[to],
                hops: 0,
                payload: message,
            }
            startFlooding(xmpp, from, to, message);
        } else {
            console.log('Opción no reconocida.');
            promptAction();
        }

        console.log(`Mensaje enviado a ${to}: ${message}`);
    });
}

// Evento online solo establece el cliente online, no invoca acciones directas
xmpp.on('online', address => {
    console.log(`Inicialmente conectado como ${address.toString()}`);
    if (isNodeSelected) {
        promptAction();
    }
});

xmpp.on('stanza', stanza => {
    if (stanza.is('message')) {
        const message = stanza.getChildText('body');
        message = JSON.parse(message);
        if (message.to == nombres[currentNodo]) {
            const from = stanza.attrs.from;
            console.log(`Mensaje recibido de ${from} con payload ${message.payload}`);
        }
        else{
            if(message.type == "lsr"){
                const linkStateRouting = new LinkStateRouting();
                linkStateRouting.configure(nodos)
                linkStateRouting.sendMessage(xmpp, message, nombres, currentNodo);
            }
            else if(message.type == "flooding"){
                startFlooding(xmpp, message.from, message.to, message);
            }
        }
    }
});

xmpp.on('error', err => {
    console.error('Error en la conexión XMPP:', err);
});

// Asegurar que solo se inicia si no se ha seleccionado un nodo
if (!isNodeSelected) {
    promptNodo();
}
