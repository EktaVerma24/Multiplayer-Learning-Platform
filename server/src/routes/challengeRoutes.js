import express from "express";
import Challenge from "../models/Challenge.js";

const router = express.Router();

// Create Challenge
router.post("/", async (req, res) => {
  try {
    const challenge = await Challenge.create(req.body);
    res.status(201).json(challenge);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit Solution
router.post("/:challengeId/submit", async (req, res) => {
  try {
    const { student, code, language } = req.body;
    const challenge = await Challenge.findById(req.params.challengeId);
    challenge.submissions.push({ student, code, language });
    await challenge.save();
    res.status(201).json({ message: "Submission saved" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Challenges by Classroom
router.get("/classroom/:classroomId", async (req, res) => {
  try {
    const challenges = await Challenge.find({ classroom: req.params.classroomId });
    res.json(challenges);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
