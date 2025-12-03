import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSocket } from "../context/SocketContext.jsx";
import Whiteboard from "./Whiteboard.jsx";
import Quiz from "./Quiz.jsx";
import Challenge from "./Challenge.jsx";
import AvailableJobs from "./AvailableJobs.jsx";
import { motion } from "framer-motion";
import API from "../api/axios.js";
import VideoCall from "./VideoCall.jsx";

// --- Helper Component for Kick Functionality ---
const UserAvatarWithKick = ({ user, onKick, isAdmin }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Effect to close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    const handleKickClick = () => {
        onKick(user); // Pass the whole user object
        setIsMenuOpen(false);
    };

    return (
        <div ref={menuRef} className="relative">
            <div
                className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center font-bold text-slate-600 text-sm flex-shrink-0 cursor-pointer"
                onClick={() => isAdmin && setIsMenuOpen(prev => !prev)}
            >
                {user.name?.charAt(0).toUpperCase()}
            </div>

            {isMenuOpen && isAdmin && (
                <div className="absolute top-10 -left-4 w-40 bg-white border border-slate-200 rounded-md shadow-lg z-10">
                    <ul>
                        <li>
                            <button
                                onClick={handleKickClick}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 font-medium"
                            >
                                Kick {user.name}
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};


// --- Icons (Omitting for brevity, assume they are correct) ---
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
const VideoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14m0-4v4m0-4H5a2 2 0 00-2 2v0a2 2 0 002 2h10a2 2 0 002-2v0a2 2 0 00-2-2z" />
  </svg>
);
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);
const JobsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-8 0h8m-10 0h12a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" />
  </svg>
);
const FaHome = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M280.37 148.26L96 300.11V464a16 16 0 0 0 16 16l112.06-.29a16 16 0 0 0 15.94-16V368a16 16 0 0 1 16-16h64a16 16 0 0 1 16 16v95.64a16 16 0 0 0 16 16.05L464 480a16 16 0 0 0 16-16V300.11L295.63 148.26a12.19 12.19 0 0 0-15.26 0zM571.6 251.47L488 182.58V44.05a12 12 0 0 0-12-12h-40a12 12 0 0 0-12 12v72.61L318.47 43a48 48 0 0 0-61 0L4.34 251.47a12 12 0 0 0-1.6 16.9l25.5 31A12 12 0 0 0 45.15 301l225.1-187.37a12 12 0 0 1 15.5 0L530.9 301a12 12 0 0 0 16.9-1.6l25.5-31a12 12 0 0 0-1.7-16.93z"></path></svg>;

const TabButton = ({ active, onClick, icon, children }) => (
  <button
    onClick={onClick}
    className={`relative flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-300 focus:outline-none ${
      active ? "text-violet-600" : "text-slate-500 hover:text-slate-800"
    }`}
  >
    {icon}
    {children}
    {active && (
      <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600" layoutId="underline" />
    )}
  </button>
);

export default function ClassroomPage({ user }) {
  const { id } = useParams();
  const classroomId = id;
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get("tab") || "chat";
  const [tab, setTab] = useState(initialTab);
  const [adminChatAccess, setAdminChatAccess] = useState(false);
  const [showInput , setShowInput] = useState(false);
  const [paused, setPaused] = useState(false);
  const [usersInChat, setUsersInChat] = useState([]);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    const params = new URLSearchParams(location.search);
    params.set("tab", newTab);
    navigate({ search: params.toString() }, { replace: true });
  };

  const LoadingSpinner = () => (
    <div className="h-screen flex justify-center items-center p-10">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-violet-500"></div>
    </div>
  );

  useEffect(() => {
    // Check if the current user is the teacher of the classroom
    if(user?._id && classroom?.teacher?._id && user._id === classroom.teacher._id){
      setAdminChatAccess(true);
    }
  }, [user, classroom]);

  useEffect(() => {
    socket.on("usersInChat", ({ users }) => {
      setUsersInChat(users);
    });    return () => socket.off("usersInChat");
  }, [socket]);

  useEffect(() => {
    socket.on("kicked", ({ message, userId }) => {
      if(userId !== user._id) return;
      alert(message);
      navigate("/dashboard");
    }); 
    return () => socket.off("kicked");
  }, [socket, navigate, user]);

// ------------------------------------------------------------------
// ⭐ NEW: Fetch historical chat messages on mount
// ------------------------------------------------------------------
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // Assuming backend GET endpoint: /messages/:classroomId
        // This fetches the chat history using a REST API call
        const res = await API.get(`/messages/${classroomId}`); 
        // The response data should be an array of messages with the 'user' field populated.
        setMessages(res.data); 
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    if (classroomId) {
      fetchMessages();
    }
  }, [classroomId]); 
// ------------------------------------------------------------------


  // join + leave socket rooms
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit("joinClassroom", { classroomId, user });

    const handleReceiveMessage = (message) => {
      // This handles new messages from the socket, adding them to the existing state
      setMessages((prev) => [...prev, message]);
    };
    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.emit("leaveClassroom", { classroomId, user });
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [socket, classroomId, user]);

  const toggleShowInput = () => {
    setShowInput((prev) => {
      socket.emit("chatPause", { paused : !prev });
      return !prev;
    });
  }
 
  // --- MODIFIED: Direct function to handle kicking a user ---
  const handleKickUser = async (userToKick) => {
    if (!adminChatAccess || !userToKick) return;

    try {
        // 1. Emit socket event to remove user from chat in real-time
        socket.emit("kickUser", { classroomId, userId: userToKick._id });

        // 2. Call API to ban user from the classroom permanently
        await API.patch(`/classrooms/ban/${classroomId}`, { userId: userToKick._id });

    } catch (err) {
        console.error("Failed to kick/ban user:", err);
    }
  };
  useEffect(() => {
    socket.on("chatPausedByAdmin", ({ paused }) => {
      setPaused(paused); 
    });

    return () => socket.off("chatPausedByAdmin");
  }, [socket])

  // fetch classroom info
  useEffect(() => {
    const getClassroom = async () => {
      try {
        const res = await API.get(`/classrooms/${classroomId}`);
        setClassroom(res.data);
      } catch (err) {
        console.error("Failed to fetch classroom:", err);
      } finally {
        setLoading(false);
      }
    };
    getClassroom();
  }, [classroomId]);

// ------------------------------------------------------------------
// ⭐ MODIFIED: Removed the unnecessary API.post call to fix the 404 error
// ------------------------------------------------------------------
  const sendMessage = (e) => { // Changed back to synchronous, as only socket.emit is used
    e.preventDefault();
    if (!input.trim() || !socket || !user?._id) return;
    
    // Teachers can send messages even when chat is paused
    const isTeacher = classroom?.teacher?._id === user?._id;
    if (paused && !isTeacher) return;

    const messageContent = input.trim();
    
    // 1. Emit socket event for real-time delivery and server-side saving.
    // The server will save it to the DB and then broadcast it back via 'receiveMessage'.
    socket.emit("sendMessage", { 
        classroomId, 
        message: messageContent,
        user, // Pass the full user object for the server to reference _id and display name
        chatPaused: paused // Pass the paused state to server
    });    // 2. Clear the input field immediately
    setInput("");

    // NOTE: The message is added to state ONLY when 'receiveMessage' is triggered 
    // by the server (in the useEffect hook), ensuring messages are synchronized 
    // and include the database-generated ID/timestamp.

  };
// ------------------------------------------------------------------

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <a href="/dashboard" className="absolute top-4 right-6 p-2.5 rounded-full bg-violet-100 transition-all duration-300 shadow-sm hover:shadow-md">
            <FaHome size={20} />
        </a>

        <header className="mb-8">
          <p className="text-sm text-slate-500">Welcome to</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight truncate">
            Classroom: <span className="text-violet-600">{classroom?.name}</span>
          </h1>
          <h2 className="text-md text-slate-600">
            Description : {classroom?.description}
          </h2>
          <h3 className="text-md text-slate-600 font-bold">
            Teacher : {classroom?.teacher?.name}
          </h3>
        </header>

        {/* Tabs */}
        <div className="border-b border-slate-300 flex items-center">
          <TabButton active={tab === "chat"} onClick={() => handleTabChange("chat")} icon={<ChatIcon />}>
            Chat
          </TabButton>
          <TabButton
            active={tab === "whiteboard"}
            onClick={() => handleTabChange("whiteboard")}
            icon={<WhiteboardIcon />}
          >
            Whiteboard
          </TabButton>
          <TabButton active={tab === "quiz"} onClick={() => handleTabChange("quiz")} icon={<QuizIcon />}>
            Quizzes
          </TabButton>
          <TabButton
            active={tab === "challenge"}
            onClick={() => handleTabChange("challenge")}
            icon={<ChallengeIcon />}
          >
            Challenges
          </TabButton>
          <TabButton active={tab === "video"} onClick={() => handleTabChange("video")} icon={<VideoIcon />}>
            Video Call
          </TabButton>
          <TabButton active={tab === 'availablejobs'} onClick={() => handleTabChange('availablejobs')} icon={<JobsIcon />}>Jobs</TabButton>
        </div>

        {/* Tab Content */}
        <div className={`${tab === "whiteboard" ? 'bg-zinc-100' : 'mt-6 bg-white p-6 rounded-lg shadow-md min-h-[150px]'}`}>
          {tab === "chat" && (
            <div className="flex flex-col h-[300px]">
              <div className="flex-grow p-4 space-y-4 overflow-y-auto bg-slate-50 rounded-lg">
                {messages.length === 0 && (
                  <p className="text-slate-400">No messages yet. Start the conversation!</p>
                )}
                {messages.map((msg, index) => { 
                  if (!msg || !msg.user) return null;
                  
                  const isCurrentUser = msg.user._id === user?._id;
                  
                  // Fallback for key if timestamp or index is missing (unlikely with DB timestamp)
                  const messageKey = `${msg._id || msg.timestamp}-${index}`;

                  return (
                    <div
                      key={messageKey} 
                      className={`flex items-end gap-2 ${
                        isCurrentUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isCurrentUser && (
                            <UserAvatarWithKick 
                                user={msg.user}
                                onKick={handleKickUser}
                                isAdmin={adminChatAccess}
                            />
                      )}
                      <div
                        className={`max-w-xs md:max-w-md lg:max-lg px-4 py-2 rounded-2xl ${
                          isCurrentUser
                            ? "bg-violet-600 text-white rounded-br-none"
                            : "bg-slate-200 text-slate-800 rounded-bl-none"
                        }`}
                      >
                        {!isCurrentUser && (
                          // Ensure msg.user.name is available
                          <p className="text-xs font-bold text-violet-600 mb-1">{msg.user?.name}</p>
                        )}
                        <p>{msg.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={sendMessage} className="mt-4 flex items-center gap-3">
                {adminChatAccess && (
                  <label className="flex flex-col items-center justify-center gap-2 cursor-pointer select-none">
                    <span className="text-xs ml-4 font-medium w-20 text-slate-700">Pause Chat?</span>
                    <button
                      type="button"
                      aria-checked={showInput}
                      onClick={toggleShowInput}
                      className={`relative inline-flex h-7 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                        showInput ? "bg-violet-600" : "bg-slate-300"
                      }`}
                style={{ outline: "none" }}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${
                          showInput ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </label>
                )}

                {(paused && !adminChatAccess) && (
                  <p className="text-red-500 font-semibold">Chat Paused by Admin</p>
                )}

                {(!paused || adminChatAccess) && (
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-300 rounded-full shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                    placeholder={paused && !adminChatAccess ? "Chat is paused" : "Type a message..."}
                    disabled={paused && adminChatAccess ? false : paused}
                  />
                )}

                {(!paused || adminChatAccess) && (
                  <button
                    type="submit"
                    className="flex-shrink-0 bg-violet-600 text-white p-3 rounded-full hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <SendIcon />
                  </button>
                )}
              </form>
            </div>
          )}

          {tab === "whiteboard" && <Whiteboard classroomId={classroomId} user={user} />}
          {tab === "quiz" && <Quiz classroomId={classroomId} />}
          {tab === "challenge" && <Challenge classroomId={classroomId} user={user} />}
          {tab === "availablejobs" && <AvailableJobs classroomId={classroomId} user={user} />}
          {tab === "video" && <VideoCall classroomId={classroomId} user={user} />}
        </div>
      </div>
    </div>
  );
}
