import express from "express";
import { createQuiz , getQuizByClassroom , eligibleToMakeQuiz } from "../controllers/quizController.js";
const router = express.Router();

// Create Quiz
router.post("/", createQuiz);

//eligible
router.get("/eligible", eligibleToMakeQuiz);

// Get Quizzes by Classroom
router.get("/classroom/:classroomId", getQuizByClassroom);

export default router;
