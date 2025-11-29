import { useEffect, useState } from "react";
import API from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// --- SVG Icons for a better UI ---
const AttemptIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const ViewSubmissionsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const LoadingSpinner = () => (
    <div className="h-screen flex justify-center items-center p-10">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-violet-500"></div>
    </div>
);

// --- Difficulty Badge Component ---
const DifficultyBadge = ({ difficulty }) => {
    const styles = {
        Easy: "bg-emerald-100 text-emerald-800",
        Medium: "bg-amber-100 text-amber-800",
        Hard: "bg-red-100 text-red-800",
    };
    return (
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${styles[difficulty] || 'bg-slate-100 text-slate-800'}`}>
            {difficulty || "N/A"}
        </span>
    );
};


export default function Challenge({ classroomId, user }) {
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedChallenge, setSelectedChallenge] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [noSubmissions, setNoSubmissions] = useState(false);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const navigate = useNavigate();

    const isTeacher = user?.role === "teacher";

    useEffect(() => {
        if (!classroomId) return;

        const fetchChallenges = async () => {
            try {
                setLoading(true);
                setError("");
                const res = await API.get(`/challenges/classroom/${classroomId}`);
                setChallenges(res.data);
            } catch (err) {
                console.error("Error fetching challenges:", err);
                setError("Failed to load challenges.");
            } finally {
                setLoading(false);
            }
        };

        fetchChallenges();
    }, [classroomId]);

    const fetchSubmissions = async (challengeId) => {
        setLoadingSubmissions(true);
        try {
            const res = await API.get(`/challenges/${challengeId}/submissions`);
            setSubmissions(res.data.submissions || []);
            setNoSubmissions(false);
        } catch (err) {
            console.error("Failed to fetch challenge submissions:", err);
            if (err.response && err.response.status === 404) {
                setSubmissions([]);
                setNoSubmissions(true);
            } else {
                setError("Failed to fetch submissions.");
            }
        } finally {
            setLoadingSubmissions(false);
        }
    };

    const handleViewSubmissions = (challenge) => {
        setSelectedChallenge(challenge);
        fetchSubmissions(challenge._id);
    };

    const closeModal = () => {
        setSelectedChallenge(null);
        setSubmissions([]);
        setNoSubmissions(false);
    };

    if (!classroomId) {
        return <p className="p-4 text-red-500">No classroom selected.</p>;
    }

    if (loading) return <LoadingSpinner />;
    if (error) return <p className="p-4 text-center text-red-500 bg-red-50 rounded-lg">{error}</p>;

    return (
        <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">Challenges</h1>
            {challenges.length === 0 ? (
                <div className="text-center py-16 px-6 bg-slate-50 rounded-lg border-2 border-dashed">
                    <h3 className="text-xl font-bold text-slate-700">No Challenges Yet</h3>
                    <p className="text-slate-500 mt-2">
                        Looks like there are no challenges available in this classroom right now.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {challenges.map((ch, index) => (
                        <motion.div
                            key={index}
                            className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-200 
                                       flex flex-col hover:shadow-xl hover:shadow-violet-200 hover:-translate-y-1 transition-all duration-300"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <div className="p-6 flex-grow">
                                <div className="flex justify-between items-start mb-2">
                                    <h2 className="text-xl font-bold text-slate-800">{ch.title}</h2>
                                    <DifficultyBadge difficulty={ch.difficulty} />
                                </div>
                                <p className="text-slate-600 text-sm">{ch.description.length > 100 ? `${ch.description.slice(0, 100)} . . .` : ch.description}</p>
                            </div>
                            <div className="px-6 pb-6 mt-4">
                                {isTeacher ? (
                                    <button
                                        onClick={() => handleViewSubmissions(ch)}
                                        className="w-full flex items-center justify-center px-4 py-2 cursor-pointer font-semibold text-white bg-blue-600 rounded-md 
                                                   hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
                                    >
                                        <ViewSubmissionsIcon />
                                        View Submissions
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => navigate(`/attemptchallenge/${ch._id}`)}
                                        className="w-full flex items-center justify-center px-4 py-2 cursor-pointer font-semibold text-white bg-violet-600 rounded-md 
                                                   hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all duration-300"
                                    >
                                        <AttemptIcon />
                                        Attempt Challenge
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Submissions Modal */}
            <AnimatePresence>
                {selectedChallenge && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed backdrop-blur inset-0 flex items-center justify-center z-50 p-4"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="px-8 py-6 flex justify-between items-center border-b border-gray-200">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-800">{selectedChallenge.title} - Submissions</h2>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="bg-red-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    Close
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
                                {loadingSubmissions ? (
                                    <div className="flex justify-center items-center py-12">
                                        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-violet-500"></div>
                                    </div>
                                ) : noSubmissions ? (
                                    <div className="text-center py-16 px-6 bg-slate-50 rounded-lg border-2 border-dashed">
                                        <h3 className="text-xl font-bold text-slate-700">No Submissions Yet</h3>
                                        <p className="text-slate-500 mt-2">
                                            No students have submitted solutions for this challenge yet.
                                        </p>
                                    </div>
                                ) : submissions.length === 0 ? (
                                    <div className="text-center py-16 px-6 bg-slate-50 rounded-lg border-2 border-dashed">
                                        <h3 className="text-xl font-bold text-slate-700">No Submissions</h3>
                                        <p className="text-slate-500 mt-2">
                                            This challenge has no submissions.
                                        </p>
                                    </div>
                                ) : (
                                    <ul className="space-y-4">
                                        {submissions.map((submission, index) => (
                                            <motion.li
                                                key={submission._id || index}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="bg-gray-100 p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-800">
                                                            {submission.student?.name || "Unknown Student"}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">
                                                            {submission.student?.email || "No email"}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold uppercase">
                                                            {submission.language || "javascript"}
                                                        </span>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {new Date(submission.submittedAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                                                    <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                                                        {submission.code}
                                                    </pre>
                                                </div>
                                            </motion.li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
