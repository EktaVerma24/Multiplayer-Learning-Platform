import express from "express";
import mongoose from "mongoose";
import Quiz from "../models/Quiz.js";

const router = express.Router();

// Get Quizzes by Classroom
router.get("/classroom/:classroomId", async (req, res) => {
  try {
    const { classroomId } = req.params;

    // Validate classroomId
    if (!mongoose.Types.ObjectId.isValid(classroomId)) {
      return res.status(400).json({ message: "Invalid classroom ID" });
    }

    const quizzes = await Quiz.find({ classroom: classroomId });
    res.json(quizzes);
  } catch (err) {
    console.error("Error fetching quizzes:", err); // logs actual error
    res.status(500).json({ message: "Server error while fetching quizzes" });
  }
});

export default router;
