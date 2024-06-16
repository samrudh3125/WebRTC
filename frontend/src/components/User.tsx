import { useEffect, useRef, useState } from 'react';
import { Peer } from "peerjs";

const User = () => {
  const [meetingId, setMeetingId] = useState<number>(0);
  const video1 = useRef<HTMLVideoElement>(null);
  const video2 = useRef<HTMLVideoElement>(null);
  const video3 = useRef<HTMLVideoElement>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [peer, setPeer] = useState<Peer | null>(null);

  useEffect(() => {
    if (!import.meta.env.VITE_BACKEND_URL) {
      alert("The backend server is down");
      return;
    }

    const socket = new WebSocket(import.meta.env.VITE_BACKEND_URL!);
    setSocket(socket);

    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({ type: 'login' }));
    });

    const id = String(Math.round(Math.random() * 100));
    const peer = new Peer(id);

    peer.on("connection", (conn) => {
      conn.on("data", (data) => {
        console.log(data);
      });
      conn.on("open", () => {
        conn.send("hello!");
      });
    });

    peer.on("call", async (call) => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      call.answer(stream);
      call.on("stream", (remoteStream) => {
        if (video1.current) video1.current.srcObject = stream;
        if (video2.current && video3.current) {
          video3.current.srcObject = video2.current.srcObject;
          video2.current.srcObject = remoteStream;
        }
      });
    });

    setPeer(peer);

    socket.addEventListener("message", async (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'meetingId') {
        window.alert("Your meeting id is " + message.id);
      } else if (message.type === 'joinMeeting') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const conn = peer.connect(message.id);
        conn.on("open", () => {
          conn.send("hi!");
        });
        const call = peer.call(message.id, stream);
        call.on("stream", (remoteStream) => {
          if (video1.current) video1.current.srcObject = stream;
          if (video2.current) video2.current.srcObject = remoteStream;
        });
      } else if (message.type === 'newMember') {
        const newPeer = new Peer(id);
        newPeer.on("connection", (conn) => {
          conn.on("data", (data) => {
            console.log(data);
          });
          conn.on("open", () => {
            conn.send("hello!");
          });
        });

        newPeer.on("call", async (call) => {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          call.answer(stream);
          call.on("stream", (remoteStream) => {
            if (video1.current) video1.current.srcObject = stream;
            if (video2.current && video3.current) {
              video3.current.srcObject = video2.current.srcObject;
              video2.current.srcObject = remoteStream;
            }
          });
        });

        setPeer(newPeer);
      }
    });

    return () => {
      socket.close();
      peer.destroy();
    };
  }, []);

  const startMeeting = () => {
    if (peer?.id) {
      socket?.send(JSON.stringify({ type: "createMeeting", id: peer.id }));
    }
  };

  const joinMeeting = () => {
    socket?.send(JSON.stringify({ type: "joinMeeting", id: meetingId }));
  };

  return (
    <div className='flex justify-center'>
      <div className='flex flex-col gap-y-5'>
        <h1>Sender</h1>
        <div>
          <button onClick={startMeeting}>Start Meeting</button>
        </div>
        <div className='flex gap-x-2 justify-center'>
          <input
            type='text'
            placeholder='Join a meeting'
            onChange={(e) => setMeetingId(Number(e.target.value))}
            value={meetingId}
            className='rounded-md bg-gray-500 h-10'
          />
          <button onClick={joinMeeting}>Join Meeting</button>
        </div>
        <div className='flex gap-x-2 border-spacing-2 h-42 w-42'>
          <video ref={video1} autoPlay playsInline />
          <video ref={video2} autoPlay playsInline />
          <video ref={video3} autoPlay playsInline />
        </div>
      </div>
    </div>
  );
};

export default User;
