import { Server } from "socket.io";
import Message from "./models/Message.js";
import Event from "./models/Events.js";
// Store the latest canvas state for each room
const canvasStates = {};

// Track peers per classroom for WebRTC
const roomPeers = new Map();
const userIdToSocketId = new Map();
const classroomMembers = new Map();

const normalizeId = (value) => {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof value.toString === "function") return value.toString();
  try {
    return JSON.stringify(value);
  } catch (err) {
    return String(value);
  }
};

const buildReplyMeta = (rawMeta) => {
  if (!rawMeta || typeof rawMeta !== "object") return null;

  return {
    interactionWith: normalizeId(
      rawMeta.interactionWith ?? rawMeta.senderId ?? rawMeta.userId ?? rawMeta.user?._id
    ),
    repliedToMessage: normalizeId(
      rawMeta.repliedToMessage ?? rawMeta.messageId ?? rawMeta._id
    ),
    originalMessage: rawMeta.message ?? rawMeta.content ?? null,
  };
};

const trackChatEvent = async ({ userId, classroomId, messageLength, replyMeta }) => {
  const normalizedReply = buildReplyMeta(replyMeta);
  const normalizedLength = Number.isFinite(messageLength)
    ? messageLength
    : typeof messageLength === "string"
    ? messageLength.length
    : typeof messageLength === "number"
    ? messageLength
    : 0;

  const extraPayload = {
    messageLength: normalizedLength,
    isReply: Boolean(normalizedReply),
    interactionWith: normalizedReply?.interactionWith ?? null,
    repliedToMessage: normalizedReply?.repliedToMessage ?? null,
    originalMessage: normalizedReply?.originalMessage ?? null,
  };

  try {
    await Event.create({
      user: userId,
      eventType: "chat_send",
      context: {
        classroomId,
        extra: extraPayload,
      },
      ts: new Date(),
    });
  } catch (err) {
    console.error("Failed to track chat event:", err);
  }
};

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [
        process.env.CLIENT_URL || "http://localhost:5173",
        "https://edubridge-2x2c.onrender.com",
      ].filter(Boolean),
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    allowEIO3: true,
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log("⚡ New client connected:", socket.id);

    //-------------------NUMBER OF STUDENTS IN CLASSES---------------------

    const broadcastAllRoomCounts = () => {
      const allCounts = Array.from(roomPeers.entries()).map(([classroomId, students]) => ({
        classroomId,
        count: students.size,
      }));
      io.emit("update-all-counts", allCounts);
    };

    const emitUsersInChat = (classroomId) => {
      const memberMap = classroomMembers.get(classroomId);
      const users = memberMap
        ? Array.from(memberMap.values()).map((info) => ({
            _id: info._id,
            name: info.name || "Participant",
          }))
        : [];
      io.to(classroomId).emit("usersInChat", { users });
    };
    // ------------------- CLASSROOM JOIN -------------------
    socket.on("joinClassroom", ({ classroomId, user }) => {
      if (!classroomId) return;

      socket.join(classroomId);
      socket.data.classroomId = classroomId;
      const normalizedUser = user
        ? {
            ...user,
            _id: user._id || socket.id,
            name: user.name || user.username || "Participant",
          }
        : { _id: socket.id, name: "Guest" };
      socket.data.user = normalizedUser;

      // Save peer in roomPeers for WebRTC
      if (!roomPeers.has(classroomId)) roomPeers.set(classroomId, new Set());
      roomPeers.get(classroomId).add(socket.id);

      if (!classroomMembers.has(classroomId)) classroomMembers.set(classroomId, new Map());
      classroomMembers.get(classroomId).set(socket.id, {
        _id: normalizedUser._id,
        name: normalizedUser.name || "Participant",
      });
      emitUsersInChat(classroomId);

      // Send the latest whiteboard state to the new user
      if (canvasStates[classroomId]) {
        socket.emit("canvas-state-from-server", canvasStates[classroomId]);
      }

      if (normalizedUser._id) {
        userIdToSocketId.set(normalizedUser._id, socket.id);
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

      broadcastAllRoomCounts();
    });

    // ------------------- CHAT -------------------
     socket.on("sendMessage", async ({ classroomId, message, user, chatPaused, replyTo }) => {

   try {
    // Check if chat is paused and user is not the teacher
    const Classroom = (await import('./models/Classroom.js')).default;
    const classroom = await Classroom.findById(classroomId);
    
    if (!classroom) {
      socket.emit("error", { message: "Classroom not found" });
      return;
    }
    
    const isTeacher = classroom.teacher.equals(user._id);
    
    // Only block non-teachers when chat is paused
    if (chatPaused && !isTeacher) {
      socket.emit("chatError", { 
        message: "Chat is currently paused by the teacher" 
      });
      return;
    }
    
    // 1. Save the message to the database
    const newMessage = await Message.create({
     classroomId: classroomId,
          message: message,
          user: user._id,
          ...(replyTo && { replyTo })
    });
    await newMessage.save();

    await newMessage.populate('user', 'name _id'); 
    
    io.to(classroomId).emit("receiveMessage", newMessage);
    
        socket.emit("messageSent", { success: true, messageId: newMessage._id });

        const replyMeta =
          replyTo && replyTo.senderId && replyTo.senderId !== user._id
            ? {
                interactionWith: replyTo.senderId,
                repliedToMessage: replyTo.messageId,
              }
            : null;

        const actorId = user?._id || socket.data.user?._id;
        if (actorId) {
          trackChatEvent({
            userId: actorId,
            classroomId,
            messageLength: message.length,
            replyMeta,
          });
        }
        
      } catch (error) {
        console.error("Error saving or broadcasting message:", error);
        // ✅ Send detailed error back to the sender
        socket.emit("chatError", { 
          message: "Failed to send message. Please try again.",
          error: error.message 
        });
      }
    });    socket.on("kickUser", async ({ classroomId, userId }) => {
      if (!classroomId || !userId) return;
      
      try {
        // ✅ Verify the requesting user is the classroom teacher
        const Classroom = (await import('./models/Classroom.js')).default;
        const classroom = await Classroom.findById(classroomId);
        
        if (!classroom) {
          socket.emit("error", { message: "Classroom not found" });
          return;
        }
        
        if (!socket.data.user?._id || !classroom.teacher.equals(socket.data.user._id)) {
          socket.emit("error", { message: "Unauthorized: Only the teacher can kick users" });
          return;
        }
        
        const targetSocketID = userIdToSocketId.get(userId);
        
        if (!targetSocketID) return;
        
        roomPeers.get(classroomId)?.delete(targetSocketID);
      
      if (roomPeers.get(classroomId)?.size === 0) {
        roomPeers.delete(classroomId);
      }

      const memberMap = classroomMembers.get(classroomId);
      if (memberMap) {
        memberMap.delete(targetSocketID);
        if (memberMap.size === 0) {
          classroomMembers.delete(classroomId);
        }
      }

      userIdToSocketId.delete(userId);

      broadcastAllRoomCounts();
      emitUsersInChat(classroomId);
      io.to(targetSocketID).emit("kicked", { message: "You have been kicked out by the admin.", userId: userId });
      io.to(classroomId).emit("userKicked", { userId });
      
      } catch (error) {
        console.error("Error in kickUser:", error);
        socket.emit("error", { message: "Failed to kick user" });
      }
    });

    socket.on("chatPause", ({ paused }) => {
      io.emit("chatPausedByAdmin", { paused });
    });

    // ------------------- WHITEBOARD -------------------
    socket.on("canvas-state", ({ classroomId, state }) => {
      if (!classroomId) return;
      canvasStates[classroomId] = state; // store
      socket.to(classroomId).emit("canvas-state-from-server", state); // broadcast
    });

   // ------------------- WEBRTC SIGNALING -------------------

    const emitToTarget = (targetId, event, payload, classroomId) => {
      if (targetId && io.sockets.sockets.get(targetId)) {
        io.to(targetId).emit(event, payload);
      } else if (classroomId) {
        socket.to(classroomId).emit(event, payload);
      }
    };

    // ✅ Offer: send directly to the target peer when provided
    socket.on("webrtc:offer", ({ classroomId, offer, to }) => {
      if (!classroomId || !offer) return;
      emitToTarget(to, "webrtc:incoming-call", { from: socket.id, offer }, classroomId);
    });

    // ✅ Answer: send back to offer sender (targeted)
    socket.on("webrtc:answer", ({ classroomId, answer, to }) => {
      if (!classroomId || !answer) return;
      emitToTarget(to, "webrtc:answer", { from: socket.id, answer }, classroomId);
    });

    // ✅ ICE Candidate: forward only to the correct peer
    socket.on("webrtc:ice-candidate", ({ classroomId, candidate, to }) => {
      if (!classroomId || !candidate) return;
      emitToTarget(to, "webrtc:ice-candidate", { from: socket.id, candidate }, classroomId);
    });

    // ✅ Hangup: notify other peer that call ended
    socket.on("webrtc:hangup", ({ classroomId, to }) => {
      if (!classroomId) return;
      emitToTarget(to, "webrtc:hangup", { from: socket.id }, classroomId);
      console.log(`📞 User ${socket.id} hung up in room ${classroomId}`);
    });

    // ✅ Caption: broadcast live captions to other peers
    socket.on("webrtc:caption", ({ classroomId, text, to }) => {
      if (!classroomId || !text) return;
      emitToTarget(to, "webrtc:caption", { from: socket.id, text }, classroomId);
    });

    socket.on("webrtc:screen-share-status", ({ classroomId, isSharing, to }) => {
      if (!classroomId) return;
      emitToTarget(to, "webrtc:screen-share-status", { from: socket.id, isSharing }, classroomId);
      console.log(`📺 User ${socket.id} ${isSharing ? 'started' : 'stopped'} screen sharing in room ${classroomId}`);
    });

    // ------------------- DISCONNECT / LEAVE -------------------
    const handleLeave = () => {
      const classroomId = socket.data.classroomId;
      if (!classroomId) return;

      const set = roomPeers.get(classroomId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          roomPeers.delete(classroomId);
          // ✅ Clean up canvas state when last user leaves
          delete canvasStates[classroomId];
          console.log(`✨ Cleaned up canvas state for classroom ${classroomId}`);
        }
      }

      const memberMap = classroomMembers.get(classroomId);
      if (memberMap) {
        memberMap.delete(socket.id);
        if (memberMap.size === 0) {
          classroomMembers.delete(classroomId);
        }
      }

      if (socket.data.user?._id) {
        userIdToSocketId.delete(socket.data.user._id);
      }

      emitUsersInChat(classroomId);

      socket.to(classroomId).emit("webrtc:peer-left", { peerId: socket.id });
      socket.to(classroomId).emit("userLeft", { userId: socket.id });

      broadcastAllRoomCounts();
    };

    socket.on("webrtc:leave", handleLeave);
    socket.on("disconnect", handleLeave);
  });
};