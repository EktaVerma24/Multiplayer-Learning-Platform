import express from "express";
import { createChallenge , submitSolution , getChallengesByClassroom } from "../controllers/challengeController.js";
import upload from "../middlewares/multer.js"; 
const router = express.Router();

// Create Challenge
router.post("/", upload.single("image"), createChallenge);

// Submit Solution
router.post("/:challengeId/submit", submitSolution);

// Get Challenges by Classroom
router.get("/classroom/:classroomId", getChallengesByClassroom);

export default router;
