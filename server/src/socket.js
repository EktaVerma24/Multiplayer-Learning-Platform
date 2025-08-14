import { Server } from "socket.io";

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

      // Notify others in the room
      socket.to(classroomId).emit("userJoined", {
        userId: socket.id,
        name: user.name,
      });
    });

    // ------------------- CHAT MESSAGES -------------------
    socket.on("sendMessage", ({ classroomId, message, user }) => {
      // Emit message to everyone in the classroom
      io.to(classroomId).emit("receiveMessage", {
        user,
        message,
        timestamp: new Date(),
      });
    });

    // ------------------- WHITEBOARD EVENTS -------------------
    socket.on("drawing", ({ classroomId, data }) => {
      // Broadcast drawing data to others
      socket.to(classroomId).emit("drawingData", data);
    });

    // ------------------- WEBRTC SIGNALING -------------------
    socket.on("webrtcOffer", ({ classroomId, offer, sender }) => {
      socket.to(classroomId).emit("webrtcOffer", { offer, sender });
    });

    socket.on("webrtcAnswer", ({ classroomId, answer, sender }) => {
      socket.to(classroomId).emit("webrtcAnswer", { answer, sender });
    });

    socket.on("webrtcIceCandidate", ({ classroomId, candidate, sender }) => {
      socket.to(classroomId).emit("webrtcIceCandidate", { candidate, sender });
    });

    // ------------------- DISCONNECT -------------------
    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
      // Optionally notify all rooms the user was in
    });
  });
};
