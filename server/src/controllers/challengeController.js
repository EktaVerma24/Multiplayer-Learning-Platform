import Challenge from "../models/Challenge.js";
import cloudinary from "../config/cloudinary.js";
const createChallenge = async (req, res) => {
  try {
    let imageUrl = null;

    if (req.file) {
      imageUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "challenges" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        stream.end(req.file.buffer);
      });
    }

    const challenge = await Challenge.create({
      title: req.body.title,
      description: req.body.description,
      classroom: req.body.classroom,
      teacher: req.body.teacher,
      image: imageUrl,
    });

    res.status(201).json(challenge);
  } catch (err) {
    console.error(err);
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