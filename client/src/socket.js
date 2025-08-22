// src/socket.js
import { io } from "socket.io-client";

// Use your backend server URL
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  withCredentials: true,
});

export default socket;
