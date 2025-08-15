import express from "express";
import { createChallenge , submitSolution , getChallengesByClassroom } from "../controllers/challengeController.js";

const router = express.Router();

// Create Challenge
router.post("/", createChallenge);

// Submit Solution
router.post("/:challengeId/submit", submitSolution);

// Get Challenges by Classroom
router.get("/classroom/:classroomId", getChallengesByClassroom);

export default router;
