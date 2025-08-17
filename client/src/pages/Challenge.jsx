import { useEffect, useState } from "react";
import API from "../api/axios.js";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// --- SVG Icons for a better UI ---
const AttemptIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-10">
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


export default function Challenge({ classroomId }) {
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

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
                                <p className="text-slate-600 text-sm">{ch.description}</p>
                            </div>
                            <div className="px-6 pb-6 mt-4">
                                <button
                                    onClick={() => navigate(`/attemptchallenge/${ch._id}`)}
                                    className="w-full flex items-center justify-center px-4 py-2 font-semibold text-white bg-violet-600 rounded-md 
                                               hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all duration-300"
                                >
                                    <AttemptIcon />
                                    Attempt Challenge
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
