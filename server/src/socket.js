import { Server } from "socket.io";

// This will store the latest canvas state for each room,
// so new users get the up-to-date whiteboard.
const canvasStates = {};

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

    // ------------------- JOIN CLASSROOM -------------------
    socket.on("joinClassroom", ({ classroomId, user }) => {
      socket.join(classroomId);
      console.log(`${user.name} joined classroom ${classroomId}`);

      // NEW: Send the latest canvas state to the user who just joined
      if (canvasStates[classroomId]) {
        socket.emit("canvas-state-from-server", canvasStates[classroomId]);
      }

      // Notify others in the room
      socket.to(classroomId).emit("userJoined", {
        userId: socket.id,
        name: user.name,
      });
    });

    socket.on("sendMessage", ({ classroomId, message, user }) => {
      io.to(classroomId).emit("receiveMessage", {
        user,
        message,
        timestamp: new Date(),
      });
    });

    // This section is updated to work with the Fabric.js component.
    socket.on("canvas-state", ({ classroomId, state }) => {
      // Store the latest state for this room.
      canvasStates[classroomId] = state;
      // Broadcast the new state to everyone else in the room.
      socket.to(classroomId).emit("canvas-state-from-server", state);
    });

    socket.on("webrtcOffer", ({ classroomId, offer, sender }) => {
      socket.to(classroomId).emit("webrtcOffer", { offer, sender });
    });

    socket.on("webrtcAnswer", ({ classroomId, answer, sender }) => {
      socket.to(classroomId).emit("webrtcAnswer", { answer, sender });
    });

    socket.on("webrtcIceCandidate", ({ classroomId, candidate, sender }) => {
      socket.to(classroomId).emit("webrtcIceCandidate", { candidate, sender });
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });
};