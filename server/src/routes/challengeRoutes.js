import express from "express";
import { createChallenge , submitSolution , getChallengesByClassroom, eligibleToMakeChallenge } from "../controllers/challengeController.js";
import upload from "../middlewares/multer.js"; 
const router = express.Router();

// Create Challenge
router.post("/", upload.single("challengeImage"), createChallenge);

//eligible
router.get("/eligible", eligibleToMakeChallenge);

// Submit Solution
router.post("/:challengeId/submit", submitSolution);

// Get Challenges by Classroom
router.get("/classroom/:classroomId", getChallengesByClassroom);

export default router;
