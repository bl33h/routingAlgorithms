const { client, xml } = require('@xmpp/client');
const readline = require('readline');
const flooding = require('./flooding.cjs');
const lsr = require('./link_state_routing.cjs');
const config = require('./xmpp_config.cjs');

// Interfaz para leer desde la terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

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
        if (body) {
            console.log(`Mensaje recibido: ${body.getText()}`);
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
                            sendMessage(xmpp, config[targetNode], message, alg, node);
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

// Función para enviar un mensaje
function sendMessage(xmpp, targetJid, message, alg, node) {
    const messageXML = xml('message', { type: 'chat', to: targetJid }, xml('body', {}, message));

    if (alg === '1') {
        console.log('Usando el algoritmo Flooding...');
        flooding.startFlooding(xmpp, node, targetJid, message, config, config);
    } else if (alg === '2') {
        console.log('Usando el algoritmo LSR...');
        lsr.lsr(xmpp, node, targetJid, message);
}

    xmpp.send(messageXML).catch(console.error);
    console.log('Mensaje enviado.');
    showMainMenu();
}

// Función para recibir mensajes
function receiveMessages(xmpp) {
    xmpp.on('stanza', (stanza) => {
        if (stanza.is('message')) {
            const body = stanza.getChild('body');
            if (body) {
                console.log(`Mensaje recibido: ${body.getText()}`);
            }
        }
    });
}

showMainMenu();
