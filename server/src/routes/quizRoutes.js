import express from "express";
import Quiz from "../models/Quiz.js";

const router = express.Router();

// Create Quiz
router.post("/", async (req, res) => {
  try {
    const quiz = await Quiz.create(req.body);
    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Quizzes by Classroom
router.get("/classroom/:classroomId", async (req, res) => {
  try {
    const quizzes = await Quiz.find({ classroom: req.params.classroomId });
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
