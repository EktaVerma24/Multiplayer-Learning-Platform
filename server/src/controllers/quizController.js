import Quiz from "../models/Quiz.js";

const createQuiz = async (req, res) => {
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

const getQuizByClassroom = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ classroom: req.params.classroomId });
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export { createQuiz, getQuizByClassroom };
