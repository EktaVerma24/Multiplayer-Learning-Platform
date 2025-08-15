import express from "express";
import { createQuiz , getQuizByClassroom } from "../controllers/quizController.js";
const router = express.Router();

// Create Quiz
router.post("/", createQuiz);

// Get Quizzes by Classroom
router.get("/classroom/:classroomId", getQuizByClassroom);

export default router;
