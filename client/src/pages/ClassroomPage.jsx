import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "../context/SocketContext.jsx";
import Whiteboard from "./Whiteboard.jsx";
import Quiz from "./Quiz.jsx";
import Challenge from "./Challenge.jsx";
import { motion } from "framer-motion";
import API from "../api/axios.js";

// --- SVG Icons for a better UI ---
const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);
const WhiteboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);
const QuizIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);
const ChallengeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);
const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
);


const TabButton = ({ active, onClick, icon, children }) => (
    <button
        onClick={onClick}
        className={`relative flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-300 focus:outline-none ${
            active ? 'text-violet-600' : 'text-slate-500 hover:text-slate-800'
        }`}
    >
        {icon}
        {children}
        {active && (
            <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600"
                layoutId="underline"
            />
        )}
    </button>
);

export default function ClassroomPage({ user }) {
    const { id } = useParams();
    const classroomId = id;
    const { socket } = useSocket();
    const [tab, setTab] = useState("chat");
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [classroom, setClassroom] = useState(null);

    useEffect(() => {
    // Add a guard to ensure user object exists before proceeding
    if (!socket || !user) return;

    // 1. Join the classroom
    socket.emit("joinClassroom", { classroomId, user });
    console.log(`Attempting to join classroom: ${classroomId}`); // Debug log

    // 2. Setup listeners
    const handleReceiveMessage = (message) => {
        console.log("New message received:", message); // Debug log
        setMessages((prev) => [...prev, message]);
    };

    socket.on("receiveMessage", handleReceiveMessage);

    // 3. Return a cleanup function
    return () => {
        console.log(`Leaving classroom ${classroomId}`);
        // It's good practice to emit a "leave" event
        socket.emit("leaveClassroom", { classroomId, user });
        socket.off("receiveMessage", handleReceiveMessage);
    };
    // ✅ FIX: Depend on the user's stable ID, not the entire object.
    // The optional chaining (?.) prevents errors if user is initially null.
}, [socket, classroomId, user?._id]);

    useEffect(() => {
        const getClassroom = async () => {
            try {
                const res = await API.get(`/classrooms/${classroomId}`);
                console.log("Classroom data:", res.data);
                setClassroom(res.data);
            } catch (err) {
                console.error("Failed to fetch classroom:", err);
            }
        };

        getClassroom();
    } , [classroomId])

    const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;

    const messageData = {
        user, // Your own user object
        message: input,
        timestamp: new Date().toISOString(), // Match server format
    };

    // 1. Manually add your own message to your state
    setMessages((prev) => [...prev, messageData]);

    // 2. Send the message to the server for everyone else
    socket.emit("sendMessage", { classroomId, message: input, user });

    // 3. Clear the input
    setInput("");
};
    return (
        <div className="min-h-screen bg-slate-100 text-slate-800">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <header className="mb-8">
                    <p className="text-sm text-slate-500">Welcome to</p>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight truncate">
                        Classroom: <span className="text-violet-600">{classroom?.name}</span>
                    </h1>
                    <h2 className="text-lg text-slate-600">{classroom?.description}</h2>
                    <h3 className="text-md text-slate-600 font-bold">Teacher : {classroom?.teacher?.name}</h3>
                </header>

                {/* Tabs */}
                <div className="border-b border-slate-300 flex items-center">
                    <TabButton active={tab === 'chat'} onClick={() => setTab('chat')} icon={<ChatIcon />}>Chat</TabButton>
                    <TabButton active={tab === 'whiteboard'} onClick={() => setTab('whiteboard')} icon={<WhiteboardIcon />}>Whiteboard</TabButton>
                    <TabButton active={tab === 'quiz'} onClick={() => setTab('quiz')} icon={<QuizIcon />}>Quizzes</TabButton>
                    <TabButton active={tab === 'challenge'} onClick={() => setTab('challenge')} icon={<ChallengeIcon />}>Challenges</TabButton>
                </div>

                {/* Tab Content */}
                <div className="mt-6 bg-white p-6 rounded-lg shadow-md min-h-[600px]">
                    {tab === "chat" && (
                        <div className="flex flex-col h-[600px]">
                            <div className="flex-grow p-4 space-y-4 overflow-y-auto bg-slate-50 rounded-lg">
    {messages.map((msg) => {
        // Guard against malformed message objects
        if (!msg || !msg.user) return null;

        // Use optional chaining `?.` for safety
        const isCurrentUser = msg.user._id === user?._id;

        return (
            // ✅ FIX 1: Use a stable, unique key like the timestamp
            <div key={msg.timestamp} className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                {!isCurrentUser && (
                    <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center font-bold text-slate-600 text-sm flex-shrink-0">
                        {/* ✅ FIX 2: Use optional chaining for safety */}
                        {msg.user.name?.charAt(0).toUpperCase()}
                    </div>
                )}
                <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${isCurrentUser ? 'bg-violet-600 text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none'}`}>
                    {/* ✅ FIX 2: Use optional chaining for safety */}
                    {!isCurrentUser && <p className="text-xs font-bold text-violet-600 mb-1">{msg.user.name}</p>}
                    <p>{msg.message}</p>
                </div>
            </div>
        );
    })}
</div>
                            <form onSubmit={sendMessage} className="mt-4 flex items-center gap-3">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    className="block w-full px-4 py-3 border border-slate-300 rounded-full shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                                    placeholder="Type a message..."
                                />
                                <button type="submit" className="flex-shrink-0 bg-violet-600 text-white p-3 rounded-full hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all duration-300 shadow-md hover:shadow-lg">
                                    <SendIcon />
                                </button>
                            </form>
                        </div>
                    )}

                    {tab === "whiteboard" && <Whiteboard classroomId={classroomId} user={user} />}
                    {tab === "quiz" && <Quiz classroomId={classroomId} />}
                    {tab === "challenge" && <Challenge classroomId={classroomId} user={user} />}
                </div>
            </div>
        </div>
    );
}
