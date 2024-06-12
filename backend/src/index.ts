import { WebSocket, WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

let senderSocket: WebSocket | null = null; // Initialize senderSocket as null
let receiverSockets: WebSocket[] = [];

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data: any) {
    try {
      const message = JSON.parse(data);
      switch (message.type) {
        case 'sender':
          console.log("Sender added");
          senderSocket = ws;
          break;
        case 'receiver':
          console.log("Receiver added");
          receiverSockets.push(ws);
          break;
        case 'createOffer':
          if (ws !== senderSocket) {
            return;
          }
          console.log("Sending offer");
          receiverSockets.forEach((socket) => {
            socket.send(JSON.stringify({ type: 'createOffer', sdp: message.sdp }));
          });
          break;
        case 'createAnswer':
          if (!receiverSockets.includes(ws)) {
            return;
          }
          console.log("Sending answer");
          senderSocket?.send(JSON.stringify({ type: 'createAnswer', sdp: message.sdp }));
          break;
        case 'iceCandidate':
          console.log("Sending ICE candidate");
          if (ws === senderSocket) {
            receiverSockets.forEach((socket) => {
              socket.send(JSON.stringify({ type: 'iceCandidate', candidate: message.candidate }));
            });
          } else if (receiverSockets.includes(ws)) {
            senderSocket?.send(JSON.stringify({ type: 'iceCandidate', candidate: message.candidate }));
          }
          break;
        default:
          console.error("Unknown message type:", message.type);
      }
    } catch (e) {
      console.error("Failed to parse message:", e);
    }
  });
});
