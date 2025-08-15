import Challenge from "../models/Challenge.js";

const createChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.create(req.body);
    res.status(201).json(challenge);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const submitSolution = async (req, res) => {
  try {
    const { student, code, language } = req.body;
    const challenge = await Challenge.findById(req.params.challengeId);
    challenge.submissions.push({ student, code, language });
    await challenge.save();
    res.status(201).json({ message: "Submission saved" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getChallengesByClassroom = async (req, res) => {
  try {
    const challenges = await Challenge.find({ classroom: req.params.classroomId });
    res.json(challenges);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export { createChallenge , submitSolution , getChallengesByClassroom };