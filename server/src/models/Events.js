// server/src/models/Event.js
import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  eventType: { type: String, required: true }, // 'page_view', 'chat_send', 'wb_edit', 'quiz_submit', 'challenge_run', 'notes_generate', 'session_heartbeat'
  context: {
    page: String,            // '/dashboard', '/classroom/:id'
    classroomId: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: "Challenge" },
    extra: mongoose.Schema.Types.Mixed
  },
  durationMs: { type: Number, default: 0 },    // optional dwell/active duration
  ts: { type: Date, default: Date.now },
}, { timestamps: false });

eventSchema.index({ user: 1, ts: -1 });
eventSchema.index({ ts: -1 });
eventSchema.index({ eventType: 1, ts: -1 });

export default mongoose.model("Event", eventSchema);