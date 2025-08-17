// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../api/axios";

// SVG icons for buttons
const QuizIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

const ChallengeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);


export default function Dashboard({ user }) {
    const navigate = useNavigate();
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchClassrooms = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await API.get("/classrooms");
                setClassrooms(res.data);
            } catch (err) {
                console.error("Failed to fetch classrooms:", err);
                setError("Could not load classrooms. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchClassrooms();
    }, []);

    const enterClassroom = (id) => navigate(`/classroom/${id}`);
    const goToCreateQuiz = async (id) => {
      const res = await API.get(`/quizzes/eligible`, { params: { userId: user._id, classroomId: id } });
      console.log("Eligibility check response:", res);
      if(res.data.eligible) {
        navigate(`/create-quiz/${id}`);
      } else {
        alert("You are not eligible to create a quiz.");
      }
    }
  const goToCreateChallenge = async (id) => {
      const res = await API.get(`/challenges/eligible`, { params: { userId: user._id, classroomId: id } });
      console.log("Eligibility check response:", res);
      if(res.data.eligible) {
        navigate(`/create-challenge/${id}`);
      } else {
        alert("You are not eligible to create a challenge.");
      }
    }    
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1, 
            },
        },
    };

    const cardVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <p className="text-xl text-gray-700">Loading classrooms...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <p className="p-6 bg-red-100 text-red-700 border border-red-300 rounded-lg">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-slate-800 p-6 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight text-slate-900">
                    Welcome back, <span className="text-violet-500">{user.name}</span>!
                </h1>
                <p className="text-slate-500 text-lg mb-8">
                    Choose a classroom to continue your journey.
                </p>

                {classrooms.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-lg border border-dashed">
                        <h3 className="text-2xl font-bold text-slate-700">No classrooms available.</h3>
                        <p className="text-slate-500 mt-2">
                            {user.role === "teacher"
                                ? "You can create a new classroom to get started."
                                : "Please wait for your teacher to enroll you in a classroom."}
                        </p>
                    </div>
                ) : (
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {classrooms.map((cls) => (
                            <motion.div
                                key={cls._id}
                                className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-200 
                                           hover:shadow-2xl hover:shadow-violet-200 hover:-translate-y-2 transition-all duration-300"
                                variants={cardVariants}
                            >
                                <div className="p-6 cursor-pointer group flex flex-col justify-between h-full">
                                    <div className="flex-grow" onClick={() => enterClassroom(cls._id)}>
                                        <h3 className="text-2xl font-bold text-slate-800 group-hover:text-violet-600 transition-colors duration-300">
                                            {cls.name}
                                        </h3>
                                        <p className="text-slate-500 mt-2">{cls.students.length} {cls.students.length === 1 ? "student" : "students"}</p>
                                    </div>

                                    {user.role === "teacher" && (
                                        <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
                                            <button
                                                onClick={() => goToCreateQuiz(cls._id)}
                                                className="flex items-center justify-center w-full px-4 py-2 font-semibold text-white bg-violet-600 rounded-md 
                                                           hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all duration-300"
                                            >
                                                <QuizIcon />
                                                Create Quiz
                                            </button>
                                            <button
                                                onClick={() => goToCreateChallenge(cls._id)}
                                                className="flex items-center justify-center w-full px-4 py-2 font-semibold text-white bg-purple-500 rounded-md 
                                                           hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 transition-all duration-300"
                                            >
                                                <ChallengeIcon />
                                                Create Challenge
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}