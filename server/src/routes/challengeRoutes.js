import express from "express";
import { createChallenge , submitSolution , getChallengesByClassroom, eligibleToMakeChallenge , getChallengeById , runCode, getChallengeSubmissions } from "../controllers/challengeController.js";
import upload from "../middlewares/multer.js";
import { protect } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/", protect, upload.single("challengeImage"), createChallenge);

router.get("/eligible", protect, eligibleToMakeChallenge);

router.post("/:challengeId/submit", protect, submitSolution);

router.get("/classroom/:classroomId", protect, getChallengesByClassroom);

router.get("/:id", protect, getChallengeById);

router.get("/:challengeId/submissions", protect, getChallengeSubmissions);

router.post("/run", protect, runCode);

export default router;
