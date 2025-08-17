import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  code: { type: String, required: true },
  language: { type: String, default: "javascript" },
  submittedAt: { type: Date, default: Date.now },
});

const challengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Easy" },
  description: { type: String, required: true },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  image: { type: String, default: null },
  submissions: [submissionSchema],
  testCases: [
    {
      input: { type: String, required: true },
      expectedOutput: { type: String, required: true }
    }
  ],
  languageTemplates: {
    type: Map,
    of: new mongoose.Schema({
      boilerplate: String, // The code stub shown to the user in the editor
      harness: String,     // The wrapper code used by your backend
    }, { _id: false })
  }
}, { timestamps: true });

export default mongoose.model("Challenge", challengeSchema);
