// models/Note.js
import mongoose from "mongoose";

const DiagramSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["mermaid", "image", "chart"],
        required: true,
    },
    title: String,
    mermaid: String,
    chartKind: {
        type: String,
        enum: ["bar", "line", "pie", "gantt", "scatter"],
        default: "bar",
    },
    chartData: mongoose.Schema.Types.Mixed, // Suggestion: Replace with a defined schema for reliability
    imageUrl: String,
}, { _id: false });

const SectionSchema = new mongoose.Schema({
    // FIX: Changed 'heading' and 'body' to match the AI prompt and frontend
    title: String,
    content: String,
    imageUrl: String,
    // Kept these fields for future flexibility, even if the current prompt doesn't generate them
    bullets: [String],
    diagram: [DiagramSchema],
}, { _id: false });

const NoteSchema = new mongoose.Schema({
    syllabus: { type: String, required: true }, 
    sections: [SectionSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default mongoose.model("Note", NoteSchema);