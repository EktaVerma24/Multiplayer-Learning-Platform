// src/pages/ClassroomPage.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "../context/SocketContext.jsx";
import Whiteboard from "./Whiteboard.jsx";
import Quiz from "./Quiz.jsx";
import Challenge from "./Challenge.jsx";

export default function ClassroomPage({ user }) {
  const { id } = useParams(); // Get classroomId from URL
  const classroomId = id;
  const { socket } = useSocket();
  const [tab, setTab] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // Chat socket logic
  useEffect(() => {
    if (!socket) return;

    socket.emit("joinClassroom", { classroomId, user });
    socket.on("receiveMessage", (message) => setMessages((prev) => [...prev, message]));

    return () => socket.off("receiveMessage");
  }, [socket, classroomId, user]);

  const sendMessage = () => {
    if (!input) return;
    socket.emit("sendMessage", { classroomId, message: input, user });
    setInput("");
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Classroom: {classroomId}</h1>

      {/* Tabs */}
      <div className="flex mb-4 space-x-2">
        <button
          className={`p-2 ${tab === "chat" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setTab("chat")}
        >
          Chat
        </button>
        <button
          className={`p-2 ${tab === "whiteboard" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setTab("whiteboard")}
        >
          Whiteboard
        </button>
        <button
          className={`p-2 ${tab === "quiz" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setTab("quiz")}
        >
          Quizzes
        </button>
        <button
          className={`p-2 ${tab === "challenge" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setTab("challenge")}
        >
          Challenges
        </button>
      </div>

      {/* Tab Content */}
      <div className="border p-4 rounded min-h-[400px]">
        {tab === "chat" && (
          <div>
            <div className="border p-4 h-64 overflow-y-scroll mb-4">
              {messages.map((msg, i) => (
                <div key={i}>
                  <b>{msg.user.name}:</b> {msg.message}
                </div>
              ))}
            </div>
            <div className="flex">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="border p-2 flex-grow"
                placeholder="Type a message..."
              />
              <button onClick={sendMessage} className="bg-blue-500 text-white p-2 ml-2">
                Send
              </button>
            </div>
          </div>
        )}

        {tab === "whiteboard" && <Whiteboard classroomId={classroomId} user={user} />}
        {tab === "quiz" && <Quiz classroomId={classroomId} />}
        {tab === "challenge" && <Challenge classroomId={classroomId} user={user} />}
      </div>
    </div>
  );
}
