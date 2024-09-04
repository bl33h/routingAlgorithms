/*
    node_management.cjs
    Implements the XMPP client for the node management system.

    authors:
        - Ricardo Méndez
        - Sara Echeverría
        - Melissa Pérez
*/

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const LinkStateRouting = require('./link_state_routing.cjs');
const { startFlooding } = require('./flooding.cjs');
const { client, xml } = require('@xmpp/client');

// Load configuration files
const topoConfigPath = path.join(__dirname, 'topo1-x-randomB-2024.txt');
const namesConfigPath = path.join(__dirname, 'names1-x-randomB-2024.txt');

const topoConfig = JSON.parse(fs.readFileSync(topoConfigPath, 'utf8'));
const namesConfig = JSON.parse(fs.readFileSync(namesConfigPath, 'utf8'));

const nodos = topoConfig.config;
const nombres = namesConfig.config;

let xmpp;
let currentNodo = '';
let isNodeSelected = false;
let listen = false;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('Node configuration:', nodos);
console.log('Name configuration:', nombres);

// Function to initialize XMPP connection with the selected node
function initXMPPConnection(node = 'A') {
    const user = nombres[node].split('@')[0];

    xmpp = client({
        service: 'ws://alumchat.lol:7070/ws/',
        domain: 'alumchat.lol',
        resource: '',
        username: user,
        password: '123'
    });

    xmpp.start().catch(err => {
        console.error('Error starting XMPP connection:', err);
    });

    xmpp.on('online', address => {
        console.log(`Initially connected as ${address.toString()}`);
        if (isNodeSelected) {
            promptAction();
        }
    });

    xmpp.on('error', err => {
        console.error('XMPP connection error:', err);
    });
}

// Function to restart XMPP connection with the selected resource
function restartXMPPWithResource(resource) {
    initXMPPConnection(resource);
}

function stopXMPPConnection() {
    xmpp.stop().then(() => {
        console.log('XMPP client stopped successfully.');
        rl.close();
    }).catch(err => {
        console.error('Error stopping XMPP connection:', err);
    });
}

function promptNodo() {
    rl.question('Select a node (A-F): ', node => {
        if (nombres.hasOwnProperty(node.toUpperCase())) {
            currentNodo = node.toUpperCase();
            isNodeSelected = true;
            restartXMPPWithResource(currentNodo);
        } else {
            console.log('Invalid node, please try again.');
            promptNodo();
        }
    });
}

// Existing function where you need to pass additional parameters
function promptAction() {
    rl.question('\nDo you want to send (S) or receive (R) a message? (S/R): ', action => {
        if (action.toUpperCase() === 'S') {
            promptSend();
        } else if (action.toUpperCase() === 'R') {
            console.log('Ready to receive messages. Please wait...');
            listen = true;
        } else {
            console.log('Unrecognized option.');
            promptAction();
        }
    });
}

function promptSend() {
    rl.question('\nEnter the destination node (A-F): ', to => {
        if (nombres.hasOwnProperty(to.toUpperCase())) {
            rl.question('Enter the message: ', text => {
                enviarMensaje(currentNodo, to.toUpperCase(), text);
                promptAction();
            });
        } else {
            console.log('Invalid node, please try again.');
            promptSend();
        }
    });
}

function enviarMensaje(from, to, text) {
    rl.question('Do you want to use Link State Routing (L) or Flooding (F)? (L/F): ', algorithm => {
        if (algorithm.toUpperCase() === 'L') {
            const messageToSend = {
                type: "lsr",
                from,
                to,
                hops: 0,
                headers: [],
                payload: text,
            }
            const linkStateRouting = new LinkStateRouting();
            linkStateRouting.configure(nodos);
            linkStateRouting.sendMessage(xmpp, messageToSend, nombres, currentNodo);
        } else if (algorithm.toUpperCase() === 'F') {
            const message = {
                type: "flooding",
                from,
                to: nombres[to],
                hops: 0,
                payload: text,
            }
            console.log(`Sending Flooding message to ${to}:`, message);
            startFlooding(xmpp, from, to, message, nodos, nombres);
        } else {
            console.log('Unrecognized option.');
            promptAction();
        }
    });
}

if (listen) {
    xmpp.on('stanza', stanza => {
        if (stanza.is('message')) {
            let message = stanza.getChildText('body');
            message = JSON.parse(message);
            console.log('Received message:', message);
            if (message.to === nombres[currentNodo]) {
                const from = stanza.attrs.from;
                console.log(`Message received from ${from} with payload ${message.payload}`);
            } else {
                if (message.type === "lsr") {
                    const linkStateRouting = new LinkStateRouting();
                    linkStateRouting.configure(nodos);
                    linkStateRouting.sendMessage(xmpp, message, nombres, currentNodo);
                    stopXMPPConnection();
                } else if (message.type === "flooding") {
                    startFlooding(xmpp, message.from, message.to, message);
                }
            }
        }
    });
}

// Ensure it only starts if a node has not been selected
if (!isNodeSelected) {
    promptNodo();
}