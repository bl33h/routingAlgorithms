const { client, xml } = require('@xmpp/client');
const readline = require('readline');
const flooding = require('./flooding.cjs');
const LinkStateRouting = require('./link_state_routing.cjs');
const config = require('./xmpp_config.cjs');
const fs = require('fs');
const path = require('path');
const topoConfigPath = path.join(__dirname, 'topo1-x-randomB-2024.txt');
const namesConfigPath = path.join(__dirname, 'names1-x-randomB-2024.txt');

const topoConfig = JSON.parse(fs.readFileSync(topoConfigPath, 'utf8'));
const namesConfig = JSON.parse(fs.readFileSync(namesConfigPath, 'utf8'));
const nombres = namesConfig.config;
let nodos = {};

// Interfaz para leer desde la terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

let actualNode;
// Función para iniciar conexión XMPP
function connectToNode(jid, password) {
    const xmpp = client({
        service: 'ws://alumchat.lol:7070/ws/', 
        domain: 'alumchat.lol', 
        resource: 'node',
        username: jid.split('@')[0],
        password: password,
        mechanism: 'SCRAM-SHA-1'
    });

    xmpp.start().catch(console.error);

    xmpp.on('error', (err) => {
        console.error('Connection error', err);
    });

    xmpp.on('offline', () => {
        console.log('Offline');
    });

    xmpp.on('stanza', (stanza) => {
        if (stanza.is('message')) {
            const body = stanza.getChild('body');
            const msg = JSON.parse(body.getText());
            if (body) {
                if (msg.type === 'lsr') {
                    if (msg.to === actualNode) {
                        console.log(`Mensaje recibido de ${msg.from} con payload: ${msg.payload}`);
                    } else {
                        console.log(`Mensaje recibido de ${msg.from} con payload: ${msg.payload}`);
                        const lsr = new LinkStateRouting();
                        lsr.configure(nodos);
                        lsr.sendMessage(xmpp, msg, nombres, actualNode);
                    }
                }
                else if(msg.type === 'flooding'){
                    if(msg.to === actualNode){
                        console.log(`Mensaje recibido de ${msg.from} con payload: ${msg.payload}`);
                    } else {
                        console.log(`Mensaje recibido de ${msg.from} con payload: ${msg.payload}`);
                        flooding.startFlooding(xmpp, nombres, msg, nodos[actualNode]);
                    }
                }
                else if(msg.type === 'info'){
                    // process the info the node gets
                    const info = msg.payload;
                    let flag = true;
                    if(!(msg.from in nodos)) nodos[msg.from] = info; else flag = false;
                    if(flag){
                        //send the info to neighbors
                        const newMessage = JSON.stringify(msg);
                        const nodeInfo = JSON.stringify({type: 'info', from: actualNode, payload: nodos[actualNode]});
                        for(const key in nodos[actualNode]){
                            xmpp.send(xml('message', {to: nombres[key]}, xml('body', {}, newMessage)));
                            xmpp.send(xml('message', {to: nombres[key]}, xml('body', {}, nodeInfo)));
                        }
                        xmpp.send(xml('message', {to: nombres[msg.from]}, xml('body', {}, nodeInfo)));
                    }
                    console.log("Table: ", nodos);
                    routingTable(xmpp);
                }
            }
        }
    });

    xmpp.on('online', async (address) => {
        console.log(`Conectado como ${address.toString()}`);

        await xmpp.send(xml('presence'));
    });

    return xmpp;
}

// Menú principal
function showMainMenu() {
    rl.question('Elige el algoritmo: 1. Flooding 2. LSR\n', (alg) => {
    if (alg === '1' || alg === '2') {
        rl.question('Elige el nodo (A, B, C, D, E, F):\n', (node) => {
            const temp = topoConfig.config[node];
            nodos[node] = temp;
            console.log(nodos);
            actualNode = node;
            node = node.toUpperCase();
            if (config[node]) {
                rl.question('Introduce la contraseña del nodo:\n', (password) => {
                    const xmpp = connectToNode(config[node], password);

                    rl.question('Elige la opción: 1. Enviar mensaje 2. Recibir mensaje\n', (opt) => {
                    if (opt === '1') {
                        rl.question('Elige el nodo destinatario (A, B, C, D, E, F):\n', (targetNode) => {
                        targetNode = targetNode.toUpperCase();
                        if (config[targetNode]) {
                            rl.question('Escribe el mensaje:\n', (message) => {
                            sendMessage(xmpp, targetNode, message, alg, node);
                            });
                        } else {
                            console.log('Nodo destinatario inválido.');
                            showMainMenu();
                        }
                        });
                    } else if (opt === '2') {
                        console.log('Esperando recibir mensajes...');
                        receiveMessages(xmpp);
                    } else {
                        console.log('Opción inválida.');
                        showMainMenu();
                    }
                    });
                });
        } else {
            console.log('Nodo inválido.');
            showMainMenu();
        }
    });
    } else {
        console.log('Algoritmo inválido.');
        showMainMenu();
    }
    });
}

function waitForUserInput() {
    return new Promise((resolve) => {
        rl.question('Presiona cualquier tecla para continuar...\n', () => {
            rl.close();
            resolve();
        });
    });
}

// Función para enviar un mensaje
async function sendMessage(xmpp, targetNode, message, alg, node) {
    let messageJson;
    if (alg === '1') {
        console.log('Usando el algoritmo Flooding...');
        messageJson = {
            type: 'flooding',
            from: node,
            to: targetNode,
            hops: 0,
            headers: {},
            payload: message,
        }
        flooding.startFlooding(xmpp, nombres, messageJson, nodos[node]);
    } else if (alg === '2') {
        routingTable(xmpp);
        await waitForUserInput();
        console.log("Tabla de ruteo: ", nodos);
        console.log('Usando el algoritmo Link State Routing...');
        const lsr = new LinkStateRouting();
        lsr.configure(nodos);
        messageJson = {
            type: 'lsr',
            from: node,
            to: targetNode,
            hops: 0,
            headers: {},
            payload: message,
        }
        lsr.sendMessage(xmpp, messageJson, nombres, node);
        

    }
}

function routingTable(xmpp){
    let actualNodes = new Set();
    const nodeInfo = JSON.stringify({type: 'info', from: actualNode, payload: nodos[actualNode]});
    flag = false;
    for(const key in nodos){
        actualNodes.add(key);
        for(const neighbor in nodos[key]){
            actualNodes.add(neighbor);
        }
    }
    for(const key of actualNodes){
        if(!(key in nodos)){
            flag = true;
            xmpp.send(xml('message', {to: nombres[key]}, xml('body', {}, nodeInfo)));
        }
    }
    return flag;
}

// Función para recibir mensajes
function receiveMessages(xmpp) {
    xmpp.on('stanza', (stanza) => {
        if (stanza.is('message')) {
            const body = stanza.getChild('body');
            if (body.type === 'lsr') {
                const message = JSON.parse(body.getText());
                console.log(`Mensaje recibido de ${message.from} con payload: ${message.payload}`);

                const lsr = new LinkStateRouting();
                lsr.configure(nodos);
                lsr.sendMessage(xmpp, message, nombres, node);
            }
        }
    });
}

showMainMenu();
