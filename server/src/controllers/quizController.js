import Quiz from "../models/Quiz.js";
import Classroom from "../models/Classroom.js";

export const createQuiz = async (req, res) => {
  try {
    const { title, questions, classroom, teacher } = req.body;

    if (!title || !questions || !classroom || !teacher) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const quiz = await Quiz.create({
      title,
      questions,
      classroom,
      teacher
    });

    res.status(201).json(quiz);
  } catch (err) {
    console.error("Error creating quiz:", err);
    res.status(400).json({ error: err.message });
  }
};

export const getQuizByClassroom = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ classroom: req.params.classroomId });
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const eligibleToMakeQuiz = async (req, res) => {
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
