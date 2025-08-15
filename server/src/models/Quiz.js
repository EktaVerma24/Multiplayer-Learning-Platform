import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOption: { type: Number, required: true }, // index of correct option
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  questions: [questionSchema],
}, { timestamps: true });

export default mongoose.model("Quiz", quizSchema);
