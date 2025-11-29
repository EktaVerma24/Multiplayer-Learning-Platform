import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- Mocking External Dependencies for single-file environment ---
const useParams = () => ({ id: 'mock-classroom-123' });
const useNavigate = () => (path) => console.log('Navigation called:', path);
const API = {
  post: async (url, payload) => {
    console.log('Mock API POST:', url, payload);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800)); 
    
    // Simulate a successful response
    // For testing errors, uncomment the line below:
    // throw { response: { data: { message: "Mock Server Error: Quiz already exists" } } };
    
    return { data: { message: "Quiz created successfully" } };
  }
};
const mockUser = { _id: 'teacher-123', role: 'teacher' };
// --- End Mocking ---


// --- SVG Icons for a better UI ---

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const SaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const FaHome = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M280.37 148.26L96 300.11V464a16 16 0 0 0 16 16l112.06-.29a16 16 0 0 0 15.94-16V368a16 16 0 0 1 16-16h64a16 16 0 0 1 16 16v95.64a16 16 0 0 0 16 16.05L464 480a16 16 0 0 0 16-16V300.11L295.63 148.26a12.19 12.19 0 0 0-15.26 0zM571.6 251.47L488 182.58V44.05a12 12 0 0 0-12-12h-40a12 12 0 0 0-12 12v72.61L318.47 43a48 48 0 0 0-61 0L4.34 251.47a12 12 0 0 0-1.6 16.9l25.5 31A12 12 0 0 0 45.15 301l225.1-187.37a12 12 0 0 1 15.5 0L530.9 301a12 12 0 0 0 16.9-1.6l25.5-31a12 12 0 0 0-1.7-16.93z"></path></svg>;

const LoadingSpinner = () => (
  <div className="h-screen flex justify-center items-center p-10">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-violet-500"></div>
  </div>
);

// --- Toast Component ---

const Toast = ({ message, type, key }) => {
    const baseClasses = "fixed bottom-5 right-5 p-4 rounded-xl shadow-2xl z-50 text-white font-medium flex items-center max-w-sm";
    const typeClasses = type === 'success' ? "bg-green-600" : "bg-red-600";
    const icon = type === 'success' 
        ? <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

    return (
        <motion.div
            key={key}
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 200 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`${baseClasses} ${typeClasses}`}
        >
            {icon}
            <span>{message}</span>
        </motion.div>
    );
};

// --- Main Component ---

function CreateQuiz({ user }) {
  const { id: classroomId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([
    { question: "", options: ["", "", "", ""], correctOption: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [toastState, setToastState] = useState({ message: '', type: 'success', key: 0 });


  useEffect(() => {
    if (!classroomId) {
      console.error("Missing classroomId in route");
      // Using navigate, but also showing toast for feedback if navigation fails or is slow
      showToast("Missing classroom ID. Redirecting to dashboard.", 'error');
      // navigate("/dashboard"); 
    }
  }, [classroomId, navigate]);

  // Toast handler function
  const showToast = (message, type) => {
      setToastState({ message, type, key: Date.now() });
  };
    
  // Effect to auto-dismiss toast
  useEffect(() => {
      if (toastState.message) {
          const timer = setTimeout(() => {
              // Clear the message to hide the toast, but keep the key/type in state
              setToastState(prev => ({ ...prev, message: '' })); 
          }, 4000); // 4 seconds duration
          return () => clearTimeout(timer);
      }
  }, [toastState.key]); // Trigger only when a new toast is set

  const handleQuestionChange = (qIndex, value) => {
    const updated = [...questions];
    updated[qIndex].question = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  const handleCorrectOptionChange = (qIndex, value) => {
    const updated = [...questions];
    updated[qIndex].correctOption = parseInt(value, 10);
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question: "", options: ["", "", "", ""], correctOption: 0 },
    ]);
    showToast("New question added.", 'success');
  };

  const removeQuestion = (qIndex) => {
    if (questions.length <= 1) {
        showToast("A quiz must have at least one question.", 'error');
        return;
    }
    const updated = questions.filter((_, index) => index !== qIndex);
    setQuestions(updated);
    showToast("Question removed.", 'success');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?._id) {
      showToast("You must be logged in as a teacher to create a quiz.", 'error');
      return;
    }
    if (!classroomId) {
      showToast("No classroom selected.", 'error');
      return;
    }
    if (!title.trim()) {
      showToast("Quiz title is required.", 'error');
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        showToast(`Question ${i + 1} is missing text`, 'error');
        return;
      }
      if (q.options.some((opt) => !opt.trim())) {
        showToast(`Question ${i + 1} has an empty option`, 'error');
        return;
      }
      if (isNaN(q.correctOption) || q.correctOption < 0 || q.correctOption >= q.options.length) {
        showToast(`Question ${i + 1} has an invalid correct option index`, 'error');
        return;
      }
    }
    const payload = {
      title: title.trim(),
      classroom: classroomId,
      teacher: user._id,
      questions: questions.map((q) => ({
        question: q.question.trim(),
        options: q.options.map((opt) => opt.trim()),
        correctOption: q.correctOption,
      })),
    };

    setLoading(true);
    try {
      await API.post("/quizzes", payload);
      showToast("Quiz created successfully!", 'success');
      // navigate(`/classroom/${classroomId}`); // Commented out mock navigation
    } catch (err) {
      console.error("Error creating quiz:", err);
      if (err.response?.data?.message) {
        showToast(`Error: ${err.response.data.message}`, 'error');
      } else {
        showToast("Failed to create quiz. Check console for details.", 'error');
      }
    } finally {
        setLoading(false);
    }
  };

  if(loading) return <LoadingSpinner />;
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <AnimatePresence>
        {toastState.message && (
            <Toast 
                message={toastState.message} 
                type={toastState.type} 
                key={toastState.key} 
            />
        )}
      </AnimatePresence>
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create a New Quiz</h1>
                <p className="mt-2 text-slate-500">Fill in the details below to build your quiz.</p>
            </div>

            <a href="/dashboard" className="absolute top-4 right-6 p-2.5 rounded-full bg-violet-100 text-violet-600 transition-all duration-300 shadow-sm hover:shadow-md hover:bg-violet-200" title="Go to Dashboard">
              <FaHome size={20} />
            </a>

            <div className="space-y-2">
                <label htmlFor="quiz-title" className="text-sm font-medium text-slate-700">Quiz Title</label>
                <input
                    id="quiz-title"
                    type="text"
                    placeholder="e.g., Chapter 1: Introduction to Algebra"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                />
            </div>

            <AnimatePresence mode="wait">
                {questions.map((q, qIndex) => (
                    <motion.div 
                        key={qIndex} 
                        className="border border-slate-200 bg-slate-50/70 p-6 rounded-xl space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, padding: 0, margin: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">Question {qIndex + 1}</h3>
                            <button
                                type="button"
                                onClick={() => removeQuestion(qIndex)}
                                className="text-red-500 cursor-pointer hover:text-red-700 hover:bg-red-100 p-2 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={questions.length <= 1}
                                title="Remove Question"
                            >
                                <TrashIcon />
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="What is the capital of France?"
                            value={q.question}
                            onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                            className="block w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {q.options.map((opt, optIndex) => (
                                <input
                                    key={optIndex}
                                    type="text"
                                    placeholder={`Option ${optIndex + 1}`}
                                    value={opt}
                                    onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                                    className="block w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                                />
                            ))}
                        </div>
                        <div className="pt-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center">
                                Correct Answer:
                                <select
                                    value={q.correctOption}
                                    onChange={(e) => handleCorrectOptionChange(qIndex, e.target.value)}
                                    className="ml-2 cursor-pointer block w-auto pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm rounded-md transition"
                                >
                                    {q.options.map((_, idx) => (
                                        <option key={idx} value={idx}>
                                            Option {idx + 1}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-200">
                <button
                    type="button"
                    onClick={addQuestion}
                    className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-violet-700 bg-violet-100 hover:bg-violet-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all duration-300"
                >
                    <PlusIcon />
                    Add Question
                </button>
                <button
                    type="submit"
                    className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                    ) : (
                        <SaveIcon />
                    )}
                    {loading ? 'Saving...' : 'Save Quiz'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}

// Export the main App component for the single-file environment
export default function App() {
    return <CreateQuiz user={mockUser} />;
}
