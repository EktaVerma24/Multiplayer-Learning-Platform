import express from "express";
import { createQuiz , getQuizByClassroom , eligibleToMakeQuiz , submitQuiz , getQuizAttempts } from "../controllers/quizController.js";
const router = express.Router();

// Create Quiz
router.post("/", createQuiz);

// Eligible to make quiz
router.get("/eligible", eligibleToMakeQuiz);

// Get Quizzes by Classroom
router.get("/classroom/:classroomId", getQuizByClassroom);

// Submit quiz (student)
router.post("/submit/:quizId", submitQuiz);

// ** THIS IS THE MISSING ROUTE FOR TEACHERS TO VIEW SUBMISSIONS **
router.get("/submissions/:quizId", getQuizAttempts);

export default router;