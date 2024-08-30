/*
    flooding.cjs
    Implements Flooding algorithm for the XMPP client.

    authors:
        - Ricardo Méndez
        - Sara Echeverría
        - Melissa Pérez
*/

const { sendMessage } = require('./xmpp_config.cjs');

let processedMessages = new Set();

function getAllNodes(excludeNodeID, names) {
    if (!names) {
        console.error('Error: names es undefined o null!');
        return [];
    }
    return Object.keys(names).filter(nodeID => nodeID !== excludeNodeID);
}

function startFlooding(excludeNodeID, message, names) {
    console.log('names recibido en startFlooding:', names);
    
    // Incrementar hops
    message.hops += 1;

    // Limitar el número de hops para evitar bucles infinitos
    if (message.hops >= 10) {
        console.log('Número máximo de hops alcanzado.');
        return;
    }

    // Generar un ID único para el mensaje basado en hops y contenido
    const messageId = `${message.from}-${message.payload}-${message.hops}`;
    if (processedMessages.has(messageId)) {
        console.log('Mensaje ya procesado, omitiendo:', messageId);
        return;
    }

    // Añadir el ID del mensaje al conjunto de mensajes procesados
    processedMessages.add(messageId);

    // Obtener todos los nodos excepto el nodo que está enviando el mensaje
    const allNodesExceptSelf = getAllNodes(excludeNodeID, names);
    allNodesExceptSelf.forEach(nodeID => {
        const destinationJID = names[nodeID];
        const floodingMessage = {
            type: "flooding",
            from: message.from,
            to: destinationJID,
            hops: message.hops,
            payload: message.payload,
            id: messageId // Añadir el ID del mensaje
        };
        console.log(`Enviando mensaje de Flooding a ${destinationJID}:`, floodingMessage);
        sendMessage(destinationJID, floodingMessage);
    });
}

module.exports = { startFlooding };
