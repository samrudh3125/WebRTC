import React, { useEffect, useRef } from "react";

export const Receiver = () => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080');
        socket.onopen = () => {
            socket.send(JSON.stringify({ type: 'receiver' }));
        };

        const pc = new RTCPeerConnection();

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.send(JSON.stringify({
                        type: 'iceCandidate',
                        candidate: event.candidate
                    }));
                }
            };

            pc.ontrack = (event) => {
                console.log('Track received:');
                if (videoRef.current) {
                    videoRef.current.srcObject = event.streams[0];
                }
            };

            if (message.type === 'createOffer') {
                await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
                console.log('Remote description set with offer:', message.sdp);

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.send(JSON.stringify({
                    type: 'createAnswer',
                    sdp: pc.localDescription
                }));
            } else if (message.type === 'iceCandidate') {
                if (message.candidate) {
                    await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
                }
            }
        };

        return () => {
            console.log('Closing socket')
            socket.close();
        };
    }, []);

    return (
        <div className="flex gap-x-3">
            <h1>Receiver</h1>
            <button onClick={() => { videoRef.current?.play(); console.log("Video playing"); }}>
                Play video
            </button>
            <video ref={videoRef} autoPlay playsInline></video>
        </div>
    );
};