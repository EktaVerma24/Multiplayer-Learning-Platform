import { Server } from "socket.io";

// Store the latest canvas state for each room
const canvasStates = {};

// Track peers per classroom for WebRTC
const roomPeers = new Map();

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("⚡ New client connected:", socket.id);

    // ------------------- CLASSROOM JOIN -------------------
    socket.on("joinClassroom", ({ classroomId, user }) => {
      if (!classroomId) return;

      socket.join(classroomId);
      socket.data.classroomId = classroomId;
      socket.data.user = user || { id: socket.id, name: "Guest" };

      console.log(`${socket.data.user.name} joined classroom ${classroomId}`);

      // Save peer in roomPeers for WebRTC
      if (!roomPeers.has(classroomId)) roomPeers.set(classroomId, new Set());
      roomPeers.get(classroomId).add(socket.id);

      // Send the latest whiteboard state to the new user
      if (canvasStates[classroomId]) {
        socket.emit("canvas-state-from-server", canvasStates[classroomId]);
      }

      // Send list of existing peers for WebRTC
      const peers = Array.from(roomPeers.get(classroomId)).filter(
        (id) => id !== socket.id
      );
      socket.emit("webrtc:peers", { peers });

      // Notify others
      socket.to(classroomId).emit("userJoined", {
        userId: socket.id,
        name: socket.data.user.name,
      });
      socket.to(classroomId).emit("webrtc:peer-joined", { peerId: socket.id });
    });

    // ------------------- CHAT -------------------
    socket.on("sendMessage", ({ classroomId, message, user }) => {
      if (!classroomId || !message) return;
      socket.to(classroomId).emit("receiveMessage", {
        user: user || socket.data.user,
        message,
        timestamp: new Date(),
      });
    });

    // ------------------- WHITEBOARD -------------------
    socket.on("canvas-state", ({ classroomId, state }) => {
      if (!classroomId) return;
      canvasStates[classroomId] = state; // store
      socket.to(classroomId).emit("canvas-state-from-server", state); // broadcast
    });

   // ------------------- WEBRTC SIGNALING -------------------

    // ✅ Offer: send directly to the target peer
    socket.on("webrtc:offer", ({ classroomId, offer }) => {
  if (!classroomId || !offer) return;
  socket.to(classroomId).emit("webrtc:incoming-call", { from: socket.id, offer });
});

    // ✅ Answer: send back to offer sender
    socket.on("webrtc:answer", ({ classroomId, answer }) => {
      if (!classroomId || !answer) return;
      socket.to(classroomId).emit("webrtc:answer", { from: socket.id, answer });
    });

    // ✅ ICE Candidate: forward only to the correct peer
    socket.on("webrtc:ice-candidate", ({ classroomId, candidate }) => {
  if (!classroomId || !candidate) return;
  socket.to(classroomId).emit("webrtc:ice-candidate", { from: socket.id, candidate });
});


    // ------------------- DISCONNECT / LEAVE -------------------
    const handleLeave = () => {
      const classroomId = socket.data.classroomId;
      if (!classroomId) return;

      const set = roomPeers.get(classroomId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) roomPeers.delete(classroomId);
      }

      socket.to(classroomId).emit("webrtc:peer-left", { peerId: socket.id });
      socket.to(classroomId).emit("userLeft", { userId: socket.id });

      console.log(`❌ Client ${socket.id} left classroom ${classroomId}`);
    };

    socket.on("webrtc:leave", handleLeave);
    socket.on("disconnect", handleLeave);
  });
};