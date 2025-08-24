import Challenge from "../models/Challenge.js";
import cloudinary from "../config/cloudinary.js";
import Classroom from "../models/Classroom.js";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const createChallenge = async (req, res) => {
  try {
    const { title, description, classroom, teacher, testCases, difficulty , languageTemplates } = req.body;

    // ✅ Validate required fields
    if (!title || !description || !classroom || !teacher || !testCases || !languageTemplates) {
      return res.status(400).json({
        error: "Missing required fields: title, description, classroom, teacher, languageTemplates",
      });
    }

    console.log("Received raw string for testCases:", testCases);
    const parsedLanguageTemplates = JSON.parse(languageTemplates);

    let parsedTestCases = [];
    if (testCases && typeof testCases === 'string') {
        try {
            parsedTestCases = JSON.parse(testCases);
        } catch (parseError) {
            return res.status(400).json({ error: "Invalid format for testCases." });
        }
        console.log("Parsed testCases:", parsedTestCases);
    } else {
       // Optional: handle cases where testCases isn't sent or isn't a string
       return res.status(400).json({ error: "testCases field is missing or not a string." });
    }

    console.log("Received parsed array for testCases:", parsedTestCases);

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
      difficulty,
      classroom,
      teacher,
      testCases: parsedTestCases,
      languageTemplates: parsedLanguageTemplates,
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

export const submitSolution = async (req, res) => {
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

export const getChallengesByClassroom = async (req, res) => {
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

export const eligibleToMakeChallenge = async (req, res) => {
  try {
    const { userId, classroomId } = req.query;
    // console.log("Checking eligibility for user:", userId, "in classroom:", classroomId);

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    console.log("Classroom found:", classroom.teacher.toString());
    console.log("User ID:", userId);

    const isTeacher = classroom.teacher.equals(userId.trim());
    console.log("Is user a teacher?", isTeacher);
    if (isTeacher) {
      return res.json({ eligible: true });
    }
    res.json({ eligible: false });
  } catch (error) {
    console.error("Error checking eligibility:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const getChallengeById = async (req, res) => {
  try {
    const { id } = req.params;
    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }
    res.json(challenge);
  } catch (error) {
    console.error("Error fetching challenge:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const runCode = async (req, res) => {
  try {
    const { code: userCode, language, input, challengeId } = req.body;

    const normalizedInput = input.replace(/\\n/g, "\n");

    // 1. Fetch the challenge from the database
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    if (!challenge.languageTemplates) {
      return res.status(500).json({ error: "Challenge data is outdated and missing language templates." });
    }

    // 2. Get the correct harness template from the database
    const harnessTemplate = challenge.languageTemplates.get(language)?.harness;
    if (!harnessTemplate) {
        return res.status(400).json({ error: `Harness not found for language: ${language}` });
    }

    const formattedHarness = harnessTemplate.replace(/\\n/g, '\n');
    const formattedUserCode = userCode.replace(/\\n/g, '\n');

    // 3. Dynamically build the final code by injecting the user's code
    const finalCode = formattedHarness.replace('${userCode}', formattedUserCode);

    // --- The hardcoded if/else if block has been completely removed ---

    const languageMap = {
      javascript: 63,
      python: 71,
      cpp: 54,
      java: 62,
    };
    const language_id = languageMap[language];
    if (!language_id) {
      return res.status(400).json({ error: "Unsupported language" });
    }

    // 4. Send the dynamically built code AND the original input to Judge0
    const response = await axios.post(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
      {
        source_code: finalCode,
        language_id,
        stdin: normalizedInput, // ✅ The harness uses stdin, so we send the input here
      },
      {
        headers: {
          "content-type": "application/json",
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      }
    );
    
    res.json(response.data);

  } catch (err) {
    console.error("Code execution error:", err.response ? err.response.data : err.message);
    res.status(500).json({ error: "Code execution failed", details: err.message });
  }
};