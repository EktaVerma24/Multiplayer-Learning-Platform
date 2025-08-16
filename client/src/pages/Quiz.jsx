import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/axios";
import QuizCard from "./QuizCard"; // We'll create this component next
import QuizSkeleton from "./QuizSkeleton"; // A cool skeleton loader

export default function Quiz({ classroomId }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  useEffect(() => {
    if (!classroomId) {
      setError("Please select a classroom to see the quizzes! ✨");
      setLoading(false);
      return;
    }
    if (!/^[0-9a-fA-F]{24}$/.test(classroomId)) {
      setError("Oops! That classroom ID doesn't look right. 🤔");
      setLoading(false);
      return;
    }

    const fetchQuizzes = async () => {
      setLoading(true);
      setError(null);
      try {
        // Simulate a slightly longer load time to see the cool animations
        // await new Promise(resolve => setTimeout(resolve, 1000));
        const res = await API.get(`/quizzes/classroom/${classroomId}`);
        setQuizzes(res.data);
      } catch (err) {
        console.error("Error fetching quizzes:", err);
        setError(err.response?.data?.message || "Failed to fetch quizzes. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [classroomId]);

  // Animation variants for the container to orchestrate staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Each child will animate 0.1s after the previous one
      },
    },
  };

  // Conditional Rendering
  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Loading Quizzes...</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Show 3 skeleton loaders */}
          {[...Array(3)].map((_, i) => <QuizSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <p className="text-2xl text-red-500 font-semibold">😞 {error}</p>
        </motion.div>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <p className="text-2xl text-gray-500 font-semibold">No quizzes found here!</p>
          <p className="text-gray-400">Maybe try creating one?</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <motion.h1 
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="text-4xl font-black mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500"
      >
        Available Quizzes
      </motion.h1>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {quizzes.map((quiz) => (
          <QuizCard key={quiz._id} quiz={quiz} onSelect={() => setSelectedQuiz(quiz)} />
        ))}
      </motion.div>

      {/* Animated Modal for Selected Quiz */}
      <AnimatePresence>
        {selectedQuiz && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed backdrop-blur inset-0 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedQuiz(null)} 
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
              <h2 className="text-3xl font-bold mb-4 text-gray-800">{selectedQuiz.title}</h2>
              <div className="space-y-6">
                {selectedQuiz.questions.map((q, i) => (
                  <div key={i} className="pl-4">
                    <p className="font-semibold text-lg text-gray-700">{i + 1}. {q.question}</p>
                    <ul className="mt-2 space-y-2">
                      {q.options.map((opt, idx) => (
                        <li key={idx} className="bg-gray-100 p-3 rounded-lg text-gray-600 transition hover:bg-purple-100 hover:text-purple-800">
                          {opt}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setSelectedQuiz(null)}
                className="mt-8 bg-red-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:bg-red-600 transition-transform transform hover:scale-105"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}