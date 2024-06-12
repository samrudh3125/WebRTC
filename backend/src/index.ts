import { WebSocket, WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

let senderSocket: WebSocket | null = null;
let receiverSocket: WebSocket | null = null;

wss.on('connection', function connection(ws) {
  console.log('Client connected');

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('message', function message(data: any) {
    try {
      const message = JSON.parse(data);
      if (message.type === 'sender') {
        console.log('Sender added');
        senderSocket = ws;
      } else if (message.type === 'receiver') {
        console.log('Receiver added');
        receiverSocket = ws;
      } else if (message.type === 'createOffer') {
        if (ws !== senderSocket) {
          return;
        }
        console.log('Sending offer to receiver');
        if (receiverSocket) {
          receiverSocket.send(JSON.stringify({ type: 'createOffer', sdp: message.sdp }));
        } else {
          console.error('Receiver socket not connected');
        }
      } else if (message.type === 'createAnswer') {
        if (ws !== receiverSocket) {
          return;
        }
        console.log('Sending answer to sender');
        if (senderSocket) {
          senderSocket.send(JSON.stringify({ type: 'createAnswer', sdp: message.sdp }));
        } else {
          console.error('Sender socket not connected');
        }
      } else if (message.type === 'iceCandidate') {
        console.log('Sending ICE candidate');
        if (ws === senderSocket && receiverSocket) {
          receiverSocket.send(JSON.stringify({ type: 'iceCandidate', candidate: message.candidate }));
        } else if (ws === receiverSocket && senderSocket) {
          senderSocket.send(JSON.stringify({ type: 'iceCandidate', candidate: message.candidate }));
        } else {
          console.error('Corresponding socket not connected');
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if (ws === senderSocket) {
      senderSocket = null;
    } else if (ws === receiverSocket) {
      receiverSocket = null;
    }
  });
});
