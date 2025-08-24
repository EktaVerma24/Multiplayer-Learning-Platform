// src/pages/Dashboard.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../api/axios";

// Libraries for PDF Generation
import jsPDF from "jspdf";
import domtoimage from "dom-to-image-more";

// SVG icons for buttons
const QuizIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> );
const ChallengeIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> );


export default function Dashboard({ user }) {
    const navigate = useNavigate();
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [syllabus, setSyllabus] = useState("");
    const [notes, setNotes] = useState([]);
    const [notesLoading, setNotesLoading] = useState(false);
    const [downloading, setDownloading] = useState(null); 
    
    const [notesVisible, setNotesVisible] = useState(false);
    const [activeNoteId, setActiveNoteId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const [classroomsRes, notesRes] = await Promise.all([
                    API.get("/classrooms"),
                    API.get("/notes")
                ]);
                setClassrooms(classroomsRes.data);
                setNotes(notesRes.data);
            } catch (err) {
                console.error("Failed to fetch initial data:", err);
                setError("Could not load dashboard. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleGenerateNotes = async () => {
        if (!syllabus.trim()) return alert("Enter a syllabus or topic first.");
        try {
            setNotesLoading(true);
            const res = await API.post("/notes/generate", { syllabus });
            const newNote = res.data;
            
            setNotes([newNote, ...notes]);
            setSyllabus("");
            
            setNotesVisible(true); 
            setActiveNoteId(newNote._id); 
        } catch (err) {
            console.error("Failed to generate notes:", err);
            alert("Error generating notes.");
        } finally {
            setNotesLoading(false);
        }
    };

    // --- Correctly placed handleDownloadPDF function ---
    const handleDownloadPDF = async (note) => {
    const noteContent = document.getElementById(`note-content-${note._id}`);
    if (!noteContent) return;

    setDownloading(note._id);

    try {
        // Generate PNG using dom-to-image-more
        const dataUrl = await domtoimage.toPng(noteContent, { bgcolor: "#ffffff", quality: 1 });

        const img = new Image();
        img.src = dataUrl;

        img.onload = () => {
            const pdf = new jsPDF("p", "mm", "a4");
            const { width: pdfWidth, height: pdfHeight } = pdf.internal.pageSize;

            const ratio = img.width / img.height;
            let imageWidth = pdfWidth - 20;
            let imageHeight = imageWidth / ratio;

            if (imageHeight > pdfHeight - 20) {
                imageHeight = pdfHeight - 20;
                imageWidth = imageHeight * ratio;
            }

            pdf.setFontSize(16);
            pdf.text(note.syllabus, 10, 15);
            pdf.addImage(dataUrl, "PNG", 10, 25, imageWidth, imageHeight);
            pdf.save(`${note.syllabus.replace(/\s+/g, "_") || "note"}.pdf`);
        };
    } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("Could not create PDF. Please try again.");
    } finally {
        setDownloading(null);
    }
};

    const handleNoteToggle = (noteId) => {
        setActiveNoteId(prevId => (prevId === noteId ? null : noteId));
    };
    
    const filteredNotes = notes.filter(note =>
        note.syllabus.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const enterClassroom = (id) => navigate(`/classroom/${id}`);

    const goToCreateQuiz = async (id) => {
        try {
            const res = await API.get(`/quizzes/eligible`, { params: { userId: user._id, classroomId: id } });
            if (res.data.eligible) {
                navigate(`/create-quiz/${id}`);
            } else {
                alert("You are not eligible to create a quiz at this time.");
            }
        } catch (err) {
            console.error("Failed to check quiz eligibility:", err);
            alert("Could not check quiz eligibility. Please try again.");
        }
    };
    
    const goToCreateChallenge = async (id) => {
        try {
            const res = await API.get(`/challenges/eligible`, { params: { userId: user._id, classroomId: id } });
            if (res.data.eligible) {
                navigate(`/create-challenge/${id}`);
            } else {
                alert("You are not eligible to create a challenge at this time.");
            }
        } catch (err) {
            console.error("Failed to check challenge eligibility:", err);
            alert("Could not check challenge eligibility. Please try again.");
        }
    };
    
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const cardVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    if (loading) { return ( <div className="flex justify-center items-center h-screen"><p>Loading dashboard...</p></div> ); }
    if (error) { return ( <div className="flex justify-center items-center h-screen"><p>{error}</p></div> ); }

    return (
        <div className="min-h-screen bg-white text-slate-800 p-6 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">Welcome back, <span className="text-violet-500">{user.name}</span>!</h1>
                <p className="text-slate-500 text-lg mb-8">Choose a classroom to continue your journey.</p>
                
                {/* AI Notes Generator Section */}
                <div className="mb-10 p-6 bg-violet-50 border border-violet-200 rounded-lg shadow">
                    <h2 className="text-2xl font-bold text-violet-700 mb-4">📘 AI Notes Generator</h2>
                    <textarea
                        className="border p-3 w-full rounded-md mb-3"
                        placeholder="Enter syllabus or topic..."
                        value={syllabus}
                        onChange={(e) => setSyllabus(e.target.value)}
                    />
                    <button onClick={handleGenerateNotes} disabled={notesLoading} className="bg-violet-600 text-white px-5 py-2 rounded-md hover:bg-violet-700 transition">
                        {notesLoading ? "Generating..." : "Generate Notes"}
                    </button>

                    {/* Expandable Notes List */}
                    <div className="mt-6">
                        <div onClick={() => setNotesVisible(!notesVisible)} className="flex items-center justify-between cursor-pointer border-b pb-2">
                            <h3 className="text-xl font-bold text-gray-700">My Notes</h3>
                            <svg className={`w-6 h-6 text-gray-600 transition-transform ${notesVisible ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>

                        {notesVisible && (
                            <div className="mt-4">
                                <input
                                    type="text"
                                    placeholder="Search notes by title..."
                                    className="w-full p-2 border border-gray-300 rounded-md mb-4"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <div className="space-y-2 max-h-96 overflow-y-auto p-1">
                                    {filteredNotes.map((note) => (
                                        <div key={note._id} className="bg-white rounded-lg shadow-sm border">
                                            <div onClick={() => handleNoteToggle(note._id)} className="p-4 cursor-pointer flex justify-between items-center">
                                                <h4 className="font-semibold text-violet-700">{note.syllabus}</h4>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDownloadPDF(note); }}
                                                    disabled={downloading === note._id}
                                                    className="bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-md hover:bg-gray-300 transition"
                                                >
                                                    {downloading === note._id ? "..." : "PDF"}
                                                </button>
                                            </div>
                                            {activeNoteId === note._id && (
                                                <div id={`note-content-${note._id}`} className="p-4 border-t border-gray-200">
                                                    {note.sections?.map((section, i) => (
                                                        <div key={i} className="mt-3 first:mt-0">
                                                            <h5 className="font-bold text-gray-800">{section.title}</h5>
                                                            {section.imageUrl && (
                                                                <img src={`http://localhost:5000/api/notes/image-proxy?url=${encodeURIComponent(section.imageUrl)}`} 
                                                                 alt={section.title} 
                                                                 //crossOrigin="anonymous"
                                                                 className="my-2 max-w-full h-auto rounded-md border" />
                                                            )}
                                                            <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{section.content}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Classrooms Section */}
                {classrooms.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-lg">
                        <h3 className="text-2xl font-bold text-slate-700">No classrooms available.</h3>
                    </div>
                ) : (
                    <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={containerVariants} initial="hidden" animate="visible">
                        {classrooms.map((cls) => (
                            <motion.div key={cls._id} className="bg-white rounded-lg shadow-md overflow-hidden border" variants={cardVariants}>
                                <div className="p-6 cursor-pointer group flex flex-col justify-between h-full" onClick={() => enterClassroom(cls._id)}>
                                    <div className="flex-grow">
                                        <h3 className="text-2xl font-bold text-slate-800 group-hover:text-violet-600">{cls.name}</h3>
                                        <h3 className="text-md text-slate-500">Teacher : {cls.teacher?.name}</h3>
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