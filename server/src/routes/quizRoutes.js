import express from "express";
import { createQuiz , getQuizByClassroom , eligibleToMakeQuiz , submitQuiz , getQuizAttempts } from "../controllers/quizController.js";
import { protect } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/", protect, createQuiz);

router.get("/eligible", protect, eligibleToMakeQuiz);

router.get("/classroom/:classroomId", protect, getQuizByClassroom);

router.post("/submit/:quizId", protect, submitQuiz);

router.get("/submissions/:quizId", protect, getQuizAttempts);

export default router;