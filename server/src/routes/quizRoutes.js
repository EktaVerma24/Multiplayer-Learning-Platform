import express from "express";
import mongoose from "mongoose";
import Quiz from "../models/Quiz.js";

const router = express.Router();

// Create Quiz
router.post("/", async (req, res) => {
  try {
    const quiz = await Quiz.create(req.body);
    res.status(201).json(quiz);
  } catch (err) {
    console.error("Error creating quiz:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get Quizzes by Classroom
router.get("/classroom/:classroomId", async (req, res) => {
  try {
    const { classroomId } = req.params;
    console.log("Fetching quizzes for classroom:", classroomId);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(classroomId)) {
      return res.status(400).json({ message: "Invalid classroomId" });
    }

    // Query quizzes
    const quizzes = await Quiz.find({ classroom: classroomId }).populate("teacher", "name");
    console.log("Found quizzes:", quizzes);

    res.json(quizzes);
  } catch (err) {
    console.error("Error fetching quizzes:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
