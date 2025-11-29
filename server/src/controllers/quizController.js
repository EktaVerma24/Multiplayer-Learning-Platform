import Quiz from "../models/Quiz.js";
import Classroom from "../models/Classroom.js";
import QuizAttempt from "../models/QuizAttempt.js";

// ------------------- Create Quiz -------------------
export const createQuiz = async (req, res) => {
    try {
        const { title, questions, classroom } = req.body;

        // ✅ Use authenticated user's ID from protect middleware
        const teacherId = req.user._id;

        if (!title || !questions || !classroom) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // ✅ Validate questions array
        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ error: "Questions must be a non-empty array" });
        }
        if (questions.length > 50) {
            return res.status(400).json({ error: "Quiz cannot have more than 50 questions" });
        }

        // ✅ Validate each question structure
        for (const question of questions) {
            if (!question.question || !question.options || !Array.isArray(question.options)) {
                return res.status(400).json({ error: "Each question must have 'question' text and 'options' array" });
            }
            if (question.options.length < 2) {
                return res.status(400).json({ error: "Each question must have at least 2 options" });
            }
            if (question.options.length > 6) {
                return res.status(400).json({ error: "Each question cannot have more than 6 options" });
            }
            if (typeof question.correctOption !== 'number' || question.correctOption < 0 || question.correctOption >= question.options.length) {
                return res.status(400).json({ error: "correctOption must be a valid index of the options array" });
            }
        }

        // ✅ Validate title length
        if (title.length > 200) {
            return res.status(400).json({ error: "Title cannot exceed 200 characters" });
        }

        // ✅ Verify user is a teacher
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ error: "Only teachers can create quizzes" });
        }

        // ✅ Verify teacher owns/teaches this classroom
        const classroomDoc = await Classroom.findById(classroom);
        if (!classroomDoc) {
            return res.status(404).json({ error: "Classroom not found" });
        }
        if (!classroomDoc.teacher.equals(teacherId)) {
            return res.status(403).json({ error: "You are not authorized to create quizzes for this classroom" });
        }

        const quiz = await Quiz.create({ title, questions, classroom, teacher: teacherId });
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
        const { answers } = req.body;

        // ✅ Use authenticated user's ID from protect middleware
        const studentId = req.user._id;

        if (!answers) {
            return res.status(400).json({ message: "Missing answers" });
        }

        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: "Quiz not found" });

        // ✅ Check if student already attempted this quiz
        const existingAttempt = await QuizAttempt.findOne({ 
            student: studentId, 
            quiz: quizId 
        });

        if (existingAttempt) {
            return res.status(400).json({ 
                message: "You have already submitted this quiz",
                score: existingAttempt.score,
                previousAttempt: existingAttempt
            });
        }

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