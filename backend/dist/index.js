"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8080 });
let meetings = new Map();
let socket;
wss.on('connection', function connection(ws) {
    console.log('Client connected');
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
    ws.on('message', function message(data) {
        try {
            const message = JSON.parse(data);
            if (message.type === 'login') {
                ws.send("success");
            }
            else if (message.type === 'createMeeting') {
                const meetingId = Math.round(Math.random() * 1000000);
                meetings.set(meetingId, message.id);
                socket = ws;
                ws.send(JSON.stringify({ type: "meetingId", id: meetingId }));
            }
            else if (message.type === 'joinMeeting') {
                socket.send(JSON.stringify({ type: "newMember" }));
                ws.send(JSON.stringify({ type: "joinMeeting", id: meetings.get(message.id) }));
            }
        }
        catch (error) {
            console.error('Error processing message:', error);
        }
    });
    ws.on('close', () => {
        console.log('Client disconnected');
        ws.close();
    });
});
