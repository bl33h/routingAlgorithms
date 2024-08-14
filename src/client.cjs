const { client, xml } = require('@xmpp/client');
const debug = require('@xmpp/debug');

// xmpp config
const xmpp = client({
  service: 'ws://alumchat.lol:7070/ws/',
  domain: 'alumchat.lol',
  resource: '',
  username: 'men21289-test',
  password: 'test324'
});

debug(xmpp, true);

// duplicate control
const messageLog = {};

xmpp.on('online', async address => {
  console.log(`connected to alumchat.lol as ${address.toString()}`);

  // hello message
  sendFlooding({
    type: 'hello',
    from: address.toString(),
    to: 'all@alumchat.lol',
    hops: 3,
    headers: [],
    payload: 'initial hello from ' + address.toString()
  });
});

xmpp.on('stanza', async stanza => {
  if (stanza.is('message') && stanza.type === 'chat') {
    try {
      const json = JSON.parse(stanza.getChildText('body'));
      if (json && json.type === 'hello' && json.hops > 0) {
        if (!messageLog[json.payload] || messageLog[json.payload] < json.hops) {
          messageLog[json.payload] = json.hops;
          console.log('flooding message received:', json);
          json.hops--;
          sendFlooding(json); 
        }
      }
    } catch (error) {
      console.error('!failed to process incoming message:', error);
    }
  }
});

// function to send flooding messages
function sendFlooding(message) {
  const messageXML = xml('message', { type: 'chat', to: 'all@alumchat.lol' },
    xml('body', {}, JSON.stringify(message))
  );
  xmpp.send(messageXML);
}

xmpp.start().catch(console.error);

module.exports = xmpp;
