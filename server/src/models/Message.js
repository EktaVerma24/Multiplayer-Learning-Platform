import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    classroomId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Classroom"
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    message:{
        type: String,
        required: true,
        trim: true
    },
    replyTo: {
        messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        senderName: { type: String },
        content: { type: String }
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});
export default mongoose.model("Message", messageSchema);