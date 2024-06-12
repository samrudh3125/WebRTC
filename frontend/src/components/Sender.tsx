import React, { useEffect, useState, useRef } from "react";

export const Sender = () => {
    let sockets: WebSocket[] = [];

    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080');
        sockets.push(socket);
        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'sender'
            }));
        };
    }, []);

    const initiateConn = async () => {
        if (!sockets.length) {
            alert("Socket not found");
            return;
        }

        sockets.forEach(async(socket) => {
            const pc = new RTCPeerConnection();
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.send(JSON.stringify({
                        type: 'iceCandidate',
                        candidate: event.candidate
                    }));
                }
            };

            pc.onnegotiationneeded = async () => {
                console.error("onnegotiation needed");
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.send(JSON.stringify({
                    type: 'createOffer',
                    sdp: pc.localDescription
                }));
            };

            socket.onmessage = async (event) => {
                const message = JSON.parse(event.data);
                if (message.type === 'createAnswer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
                } else if (message.type === 'iceCandidate') {
                    await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        });
    };

    return (
        <div>
            Sender
            <button onClick={initiateConn}>Send data</button>
            <video ref={videoRef} autoPlay playsInline />
        </div>
    );
};
