const { client, xml } = require('@xmpp/client');
const debug = require('@xmpp/debug');

const xmpp = client({
  service: 'ws://alumchat.lol:7070/ws/',
  domain: 'alumchat.lol',
  resource: '',
  username: 'men21289-test',
  password: 'test324'
});

debug(xmpp, true);

xmpp.on('online', (address) => {
  console.log('Connected to alumchat.lol as', address.toString());
});

xmpp.on('offline', () => {
  console.log('Disconnected from alumchat.lol');
});

xmpp.start().catch(console.error);

module.exports = xmpp;