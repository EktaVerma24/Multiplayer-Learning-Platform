import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    answers: { type: Map, of: String }, // questionId -> selected option
    score: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);
export default QuizAttempt;
