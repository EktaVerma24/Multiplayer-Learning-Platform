import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  code: { type: String, required: true },
  language: { type: String, default: "javascript" },
  submittedAt: { type: Date, default: Date.now },
});

const challengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  image: { type: String, default: null },
  submissions: [submissionSchema],
}, { timestamps: true });

export default mongoose.model("Challenge", challengeSchema);
