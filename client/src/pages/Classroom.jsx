import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";

export default function Classroom({ classroomId, user }) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!socket) return;

    socket.emit("joinClassroom", { classroomId, user });

    socket.on("receiveMessage", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [socket]);

  const sendMessage = () => {
    if (!input) return;
    socket.emit("sendMessage", { classroomId, message: input, user });
    setInput("");
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Classroom: {classroomId}</h1>

      <div className="border p-4 h-64 overflow-y-scroll mb-4">
        {messages.map((msg, i) => (
          <div key={i}><b>{msg.user.name}:</b> {msg.message}</div>
        ))}
      </div>

      <div className="flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border p-2 flex-grow"
        />
        <button onClick={sendMessage} className="bg-blue-500 text-white p-2 ml-2">
          Send
        </button>
      </div>
    </div>
  );
}
