const WebSocket = require('ws');

let idCounter = 0;
const server = new WebSocket.Server({ port: 5000 });
server.on('connection', (ws) => {
  // eslint-disable-next-line no-plusplus
  idCounter++;
  console.log('user connected');// eslint-disable-line
  ws.send(JSON.stringify({ type: 'newId', id: idCounter }));

  ws.on('message', (message) => {
    server.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('user disconnected');// eslint-disable-line
  });
});

console.log('server runs on port 5000');// eslint-disable-line
