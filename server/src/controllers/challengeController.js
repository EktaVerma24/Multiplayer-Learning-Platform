import Challenge from "../models/Challenge.js";
import cloudinary from "../config/cloudinary.js";

const createChallenge = async (req, res) => {
  try {
    const { title, description, classroom, teacher, difficulty } = req.body;

    // ✅ Validate required fields
    if (!title || !description || !classroom || !teacher) {
      return res.status(400).json({
        error: "Missing required fields: title, description, classroom, teacher",
      });
    }

    let imageUrl = null;

    // ✅ Handle optional file upload
    if (req.file) {
      try {
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
      } catch (uploadErr) {
        console.error("Cloudinary upload error:", uploadErr);
        return res.status(500).json({ error: "Image upload failed" });
      }
    }

    // ✅ Create challenge
    const challenge = await Challenge.create({
      title,
      description,
      difficulty: difficulty || "Medium", // default value
      classroom,
      teacher,
      image: imageUrl,
    });

    res.status(201).json(challenge);
  } catch (err) {
    console.error("Error creating challenge:", err);

    // ✅ Return validation errors clearly
    if (err.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation failed",
        details: err.errors,
      });
    }

    res.status(500).json({ message: err.message });
  }
};

const submitSolution = async (req, res) => {
  try {
    const { student, code, language } = req.body;

    if (!student || !code) {
      return res.status(400).json({ error: "Missing student or code" });
    }

    const challenge = await Challenge.findById(req.params.challengeId);
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    challenge.submissions.push({
      student,
      code,
      language: language || "javascript",
    });

    await challenge.save();
    res.status(201).json({ message: "Submission saved" });
  } catch (err) {
    console.error("Error submitting solution:", err);
    res.status(500).json({ message: err.message });
  }
};

const getChallengesByClassroom = async (req, res) => {
  try {
    const challenges = await Challenge.find({
      classroom: req.params.classroomId,
    });
    res.json(challenges);
  } catch (err) {
    console.error("Error fetching challenges:", err);
    res.status(500).json({ message: err.message });
  }
};

export { createChallenge, submitSolution, getChallengesByClassroom };
