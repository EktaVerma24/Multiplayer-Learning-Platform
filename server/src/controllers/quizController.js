import Quiz from "../models/Quiz.js";
import Classroom from "../models/Classroom.js";
import QuizAttempt from "../models/QuizAttempt.js";

// ------------------- Create Quiz -------------------
export const createQuiz = async (req, res) => {
    try {
        const { title, questions, classroom, teacher } = req.body;

        if (!title || !questions || !classroom || !teacher) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const quiz = await Quiz.create({ title, questions, classroom, teacher });
        res.status(201).json(quiz);
    } catch (err) {
        console.error("Error creating quiz:", err);
        res.status(500).json({ error: err.message });
    }
};

// ------------------- Get Quizzes by Classroom -------------------
export const getQuizByClassroom = async (req, res) => {
    try {
        const quizzes = await Quiz.find({ classroom: req.params.classroomId });
        res.json(quizzes);
    } catch (err) {
        console.error("Error fetching quizzes:", err);
        res.status(500).json({ message: err.message });
    }
};

// ------------------- Check Eligibility to Make Quiz -------------------
export const eligibleToMakeQuiz = async (req, res) => {
    try {
        const { userId, classroomId } = req.query;

        const classroom = await Classroom.findById(classroomId);
        if (!classroom) return res.status(404).json({ message: "Classroom not found" });

        // Ensure proper comparison if userId is a string and classroom.teacher is an ObjectId
        const isTeacher = classroom.teacher.toString() === userId.trim();
        res.json({ eligible: isTeacher });
    } catch (error) {
        console.error("Error checking eligibility:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ------------------- Submit Quiz (Student) -------------------
export const submitQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { studentId, answers } = req.body;

        if (!studentId || !answers) {
            return res.status(400).json({ message: "Missing studentId or answers" });
        }

        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: "Quiz not found" });

        // Calculate score and map correct answers
        let score = 0;
        const correctAnswers = {}; // Object to hold questionId -> correct option text

        quiz.questions.forEach((q) => {
            // Get the correct option text from the question's options array using the index
            // Assuming q.correctOption is the 0-based index of the correct option in q.options
            const correctOptionText = q.options[q.correctOption];

            // Store the correct answer for the response
            correctAnswers[q._id] = correctOptionText;

            // Check if the student's answer matches the correct one
            if (answers[q._id] && answers[q._id] === correctOptionText) {
                score += 1;
            }
        });

        // Save attempt
        const attempt = await QuizAttempt.create({
            student: studentId,
            quiz: quizId,
            answers,
            score,
        });

        // Send the score and the correct answers back to the frontend
        res.json({ message: "Quiz submitted", score, correctAnswers , attempt });
    } catch (err) {
        console.error("Error submitting quiz:", err);
        res.status(500).json({ message: "Failed to submit quiz" });
    }
};

// ------------------- Get Quiz Attempts (Teacher) -------------------
// This function will fetch all attempts for a specific quiz,
// populating student details for the teacher's view.
export const getQuizAttempts = async (req, res) => {
    try {
        const { quizId } = req.params;
        // Populate the student field to get student's name and email
        const attempts = await QuizAttempt.find({ quiz: quizId }).populate("student", "name email");

        if (!attempts || attempts.length === 0) {
            return res.status(404).json({ message: "No submissions found for this quiz." });
        }

        res.json(attempts);
    } catch (err) {
        console.error("Error fetching quiz attempts:", err);
        res.status(500).json({ message: "Failed to fetch attempts" });
    }
};