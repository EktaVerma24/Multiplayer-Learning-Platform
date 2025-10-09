import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/axios";
import QuizCard from "./QuizCard";
import QuizSkeleton from "./QuizSkeleton";

export default function Quiz({ classroomId }) {
    const [quizzes, setQuizzes] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [submittedScore, setSubmittedScore] = useState(null);
    const [correctAnswers, setCorrectAnswers] = useState(null);
    const [showAllQuizzes, setShowAllQuizzes] = useState(false);
    const [submissions, setSubmissions] = useState([]);
    const [noSubmissions, setNoSubmissions] = useState(false); // New state to handle no submissions

    const isStudent = user?.role === "student";
    const isTeacher = user?.role === "teacher";
    const displayedQuizzes = showAllQuizzes ? quizzes : quizzes.slice(0, 3);

    // Fetch user info from backend
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await API.get("/auth/me");
                setUser(res.data);
            } catch (err) {
                console.error("Failed to fetch user info:", err);
                setError("Failed to load user info. Please login again.");
            }
        };
        fetchUser();
    }, []);

    // Fetch quizzes for classroom
    useEffect(() => {
        if (!classroomId) return;
        if (!/^[0-9a-fA-F]{24}$/.test(classroomId)) {
            setError("Oops! That classroom ID doesn't look right. 🤔");
            setLoading(false);
            return;
        }
        const fetchQuizzes = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await API.get(`/quizzes/classroom/${classroomId}`);
                setQuizzes(res.data);
            } catch (err) {
                console.error("Error fetching quizzes:", err);
                setError(err.response?.data?.message || "Failed to fetch quizzes.");
            } finally {
                setLoading(false);
            }
        };
        fetchQuizzes();

    }, [classroomId]);

    const submitQuiz = async () => {
        if (!isStudent || !selectedQuiz) return;
        try {
            const res = await API.post(`/quizzes/submit/${selectedQuiz._id}`, {
                answers,
                studentId: user._id,
            });
            setSubmittedScore(res.data.score);
            setCorrectAnswers(res.data.correctAnswers);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to submit quiz.");
        }
    };

    const fetchSubmissions = async (quizId) => {
        try {
            const res = await API.get(`/quizzes/submissions/${quizId}`);
            setSubmissions(res.data);
            setNoSubmissions(false); // Reset to false if submissions are found
        } catch (err) {
            console.error("Failed to fetch quiz submissions:", err);
            // Check for the 404 status code specifically
            if (err.response && err.response.status === 404) {
                setSubmissions([]); // Clear any old submissions
                setNoSubmissions(true); // Set state to display the message
            } else {
                setError("Failed to fetch submissions.");
            }
        }
    };

    const resetQuizState = () => {
        setSelectedQuiz(null);
        setAnswers({});
        setSubmittedScore(null);
        setCorrectAnswers(null);
        setSubmissions([]);
        setNoSubmissions(false); // Reset this state when closing the modal
    };

    const getOptionClass = (questionId, option) => {
        if (!correctAnswers) {
            return "bg-gray-100";
        }
        const isCorrect = correctAnswers[questionId] === option;
        const isStudentAnswer = answers[questionId] === option;
        if (isCorrect && isStudentAnswer) {
            return "bg-green-200 text-green-800";
        } else if (isCorrect && !isStudentAnswer) {
            return "bg-green-100 text-green-700 font-bold border border-green-500";
        } else if (isStudentAnswer && !isCorrect) {
            return "bg-red-200 text-red-800";
        }
        return "bg-gray-100";
    };

    // The main onSelect handler for the QuizCard
    const handleQuizSelect = (quiz) => {
        resetQuizState(); // Reset state to prevent old data from flashing
        setSelectedQuiz(quiz);
        if (isTeacher) {
            fetchSubmissions(quiz._id);
        }
    };

    if (!user) return <p>Loading user info...</p>;
    if (loading) return <QuizSkeleton />;
    if (error) return <p className="text-red-500">{error}</p>;
    if (quizzes.length === 0) return <p>No quizzes found!</p>;

    return (
        <div className="p-4 md:p-8">
            <motion.h1
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl font-black mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500"
            >
                Available Quizzes
            </motion.h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayedQuizzes.map((quiz) => (
                    <QuizCard
                        key={quiz._id}
                        quiz={quiz}
                        onSelect={() => handleQuizSelect(quiz)}
                        userRole={user?.role}
                    />
                ))}
                {quizzes.length > 3 && (
        <div className="mt-4 text-center">
            <button
                onClick={() => setShowAllQuizzes(!showAllQuizzes)} // Toggles the state
                className="font-semibold text-violet-500 hover:text-violet-700 transition"
            >
                {/* Change the button text based on the state */}
                {showAllQuizzes ? 'Show Less' : 'Show More'}
            </button>
        </div>
    )}
            </div>

            <AnimatePresence>
                {selectedQuiz && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed backdrop-blur inset-0 flex items-center justify-center z-50 p-4"
                        onClick={resetQuizState}
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Student View */}
                            {isStudent && (
                                <>
                                    <h2 className="text-3xl font-bold mb-4 text-gray-800">{selectedQuiz.title}</h2>
                                    <div className="space-y-6">
                                        {selectedQuiz.questions.map((q, i) => (
                                            <div key={i} className="pl-4">
                                                <p className="font-semibold text-lg text-gray-700">{i + 1}. {q.question}</p>
                                                <ul className="mt-2 space-y-2">
                                                    {q.options.map((opt, idx) => (
                                                        <li key={idx}>
                                                            <label
                                                                className={`flex items-center gap-3 p-3 rounded-lg transition ${getOptionClass(q._id, opt)}`}
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name={`question-${i}`}
                                                                    value={opt}
                                                                    checked={answers[q._id] === opt}
                                                                    onChange={() => setAnswers(prev => ({ ...prev, [q._id]: opt }))}
                                                                    className="accent-purple-500"
                                                                    disabled={submittedScore !== null}
                                                                />
                                                                <span className="text-gray-700">{opt}</span>
                                                                {submittedScore !== null && correctAnswers[q._id] === opt && (
                                                                    <span className="ml-auto text-green-500">✅</span>
                                                                )}
                                                                {submittedScore !== null && answers[q._id] === opt && answers[q._id] !== correctAnswers[q._id] && (
                                                                    <span className="ml-auto text-red-500">❌</span>
                                                                )}
                                                            </label>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-8 flex gap-4 justify-end">
                                        <button onClick={resetQuizState} className="bg-red-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-600">
                                            Close
                                        </button>
                                        <button onClick={submitQuiz} disabled={submittedScore !== null} className={`py-2 px-6 rounded-lg font-bold shadow-lg ${submittedScore === null ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-300 text-gray-600 cursor-not-allowed"}`}>
                                            {submittedScore !== null ? "Submitted" : "Submit Quiz"}
                                        </button>
                                    </div>
                                    {submittedScore !== null && (
                                        <div className="mt-4 p-4 bg-purple-50 rounded-lg text-center">
                                            <p className="text-xl font-bold text-purple-600">Your Score: {submittedScore} / {selectedQuiz.questions.length}</p>
                                            <p className="text-sm text-gray-500">Your answers are highlighted in <span className="text-green-800">green</span> (correct) or <span className="text-red-800">red</span> (incorrect). The correct answers are also marked with a ✅.</p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Teacher View */}
                            {isTeacher && (
                                <>
                                    <h2 className="text-3xl font-bold mb-4 text-gray-800">{selectedQuiz.title} - Submissions</h2>
                                    <div className="flex justify-end mb-4">
                                        <button onClick={resetQuizState} className="bg-red-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-600">
                                            Close
                                        </button>
                                    </div>
                                    {noSubmissions ? (
                                        <p className="text-center text-gray-500 mt-8">No submissions found for this quiz yet.</p>
                                    ) : (
                                        submissions.length > 0 ? (
                                            <ul className="space-y-4">
                                                {submissions.map((submission) => (
                                                    <li key={submission._id} className="p-4 bg-gray-100 rounded-lg flex justify-between items-center shadow-sm">
                                                        <span className="font-semibold text-lg text-gray-800">
                                                            {submission.student.name}
                                                        </span>
                                                        <span className="text-gray-600">
                                                            Score: {submission.score} / {selectedQuiz.questions.length}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-center text-gray-500 mt-8">Loading submissions...</p>
                                        )
                                    )}
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}