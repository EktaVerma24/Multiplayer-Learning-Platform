import Quiz from "../models/Quiz.js";

const createQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.create(req.body);
    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
} 

const getQuizByClassroom = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ classroom: req.params.classroomId });
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export { createQuiz , getQuizByClassroom };