// src/pages/Dashboard.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../api/axios";

// Libraries for PDF Generation
import jsPDF from "jspdf";
import domtoimage from "dom-to-image-more";

// --- SVG Icons ---
const QuizIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> );
const ChallengeIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> );
const GenerateIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>);
const SearchIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>);
const ShowAllIcon = ({ open }) => (<svg className={`w-5 h-5 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>);


export default function Dashboard({ user }) {
    const navigate = useNavigate();
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notes, setNotes] = useState([]);
    const [syllabus, setSyllabus] = useState("");
    const [notesLoading, setNotesLoading] = useState(false);
    const [downloading, setDownloading] = useState(null); 
    const [notesVisible, setNotesVisible] = useState(true);
    const [activeNoteId, setActiveNoteId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showAllClassrooms, setShowAllClassrooms] = useState(false);

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

    const handleNoteToggle = (noteId) => {
        setActiveNoteId(prevId => (prevId === noteId ? null : noteId));
    };

    const handleDownloadPDF = async (note) => {
        const noteContent = document.getElementById(`note-content-${note._id}`);
        if (!noteContent) {
            alert("Could not find note content to download.");
            return;
        }
        setDownloading(note._id);
        try {
            const canvas = await html2canvas(noteContent, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true 
            });
            const imageData = canvas.toDataURL("image/png");
            const pdf = new jsPDF('p', 'mm', 'a4');
            const { width: pdfWidth, height: pdfHeight } = pdf.internal.pageSize;
            const ratio = canvas.width / canvas.height;
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
        } catch (error) {
            console.error("Failed to generate PDF:", error);
            alert("Could not create PDF. Please try again.");
        } finally {
            setDownloading(null);
        }
};
    
    const filteredNotes = notes.filter(note =>
        note.syllabus.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const displayedClassrooms = showAllClassrooms ? classrooms : classrooms.slice(0, 3);
    
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

    if (loading) { return ( <div className="flex justify-center items-center h-screen bg-gray-50"><p>Loading dashboard...</p></div> ); }
    if (error) { return ( <div className="flex justify-center items-center h-screen bg-gray-50"><p className="p-6 bg-red-100 text-red-700 rounded-lg">{error}</p></div> ); }

    return (
        <div className="min-h-screen bg-white text-slate-800 p-6 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                        Welcome back, <span className="text-violet-500">{user.name}</span>!
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Ready to learn? Dive into a classroom or generate new study notes.
                    </p>
                </header>
                
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">Your Classrooms</h2>
                    {classrooms.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed">
                            <h3 className="text-xl font-semibold text-slate-700">No classrooms found.</h3>
                            <p className="text-slate-500 mt-2">
                                {user.role === "teacher" ? "Create a new classroom to get started." : "Please wait for your teacher to enroll you."}
                            </p>
                        </div>
                    ) : (
                        <>
                            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={containerVariants} initial="hidden" animate="visible">
                                {displayedClassrooms.map((cls) => (
                                    <motion.div 
                                        key={cls._id} 
                                        className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-200 hover:shadow-2xl hover:shadow-violet-200 hover:-translate-y-2 transition-all duration-300" 
                                        variants={cardVariants}
                                    >
                                        <div className="p-6 flex flex-col justify-between h-full group">
                                            <div className="cursor-pointer" onClick={() => enterClassroom(cls._id)}>
                                                <h3 className="text-xl font-bold text-slate-800 group-hover:text-violet-600 transition-colors duration-300">{cls.name}</h3>
                                                <p className="text-slate-500 text-sm mt-1">Taught by {cls.teacher?.name}</p>
                                                <p className="text-slate-500 text-sm mt-2">{cls.students.length} {cls.students.length === 1 ? "student" : "students"}</p>
                                            </div>
                                            {user.role === "teacher" && (
                                                <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
                                                    <button onClick={(e) => { e.stopPropagation(); goToCreateQuiz(cls._id); }} className="flex items-center justify-center w-full px-4 py-2 font-semibold text-sm text-white bg-violet-600 rounded-md hover:bg-violet-700 transition">
                                                        <QuizIcon /> Create Quiz
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); goToCreateChallenge(cls._id); }} className="flex items-center justify-center w-full px-4 py-2 font-semibold text-sm text-white bg-purple-500 rounded-md hover:bg-purple-600 transition">
                                                        <ChallengeIcon /> Create Challenge
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {classrooms.length > 3 && (
                                <div className="mt-8 text-center">
                                    <button 
                                        onClick={() => setShowAllClassrooms(!showAllClassrooms)}
                                        className="inline-flex items-center font-semibold text-violet-500 hover:text-violet-700 transition"
                                    >
                                        {showAllClassrooms ? 'Show Less' : `Show all ${classrooms.length} classrooms`}
                                        <ShowAllIcon open={showAllClassrooms} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </section>
                
                <section className="p-6 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center mb-4">
                        <span className="p-2 bg-violet-100 text-violet-600 rounded-lg mr-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.707.707M12 21v-1m-4.636-1.636l.707-.707" /></svg>
                        </span>
                        <h2 className="text-2xl font-bold text-gray-800">AI Notes Generator</h2>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <textarea
                            className="flex-grow bg-white border border-gray-300 p-3 w-full rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                            placeholder="Enter a topic, like 'Quantum Physics' or 'The Roman Empire'..."
                            value={syllabus}
                            onChange={(e) => setSyllabus(e.target.value)}
                        />
                        <button 
                            onClick={handleGenerateNotes} 
                            disabled={notesLoading} 
                            className="flex items-center justify-center bg-violet-600 text-white px-5 py-3 rounded-md font-semibold hover:bg-violet-700 transition disabled:bg-violet-300"
                        >
                            <GenerateIcon />
                            {notesLoading ? "Generating..." : "Generate Notes"}
                        </button>
                    </div>

                    <div className="mt-8">
                        <div onClick={() => setNotesVisible(!notesVisible)} className="flex items-center justify-between cursor-pointer p-3 rounded-md hover:bg-slate-100 transition">
                            <h3 className="text-xl font-bold text-gray-700">My Notes</h3>
                            <svg className={`w-6 h-6 text-gray-600 transition-transform ${notesVisible ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>

                        {notesVisible && (
                            <div className="mt-4">
                                <div className="relative mb-4">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                        <SearchIcon />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Search your notes..."
                                        className="w-full bg-white p-2 pl-10 border border-gray-300 rounded-md focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-3 max-h-96 overflow-y-auto p-1">
                                    {filteredNotes.length > 0 ? (
                                        filteredNotes.map((note) => (
                                            <div key={note._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                <div onClick={() => handleNoteToggle(note._id)} className="p-4 cursor-pointer flex justify-between items-center hover:bg-slate-50 transition">
                                                    <h4 className="font-semibold text-violet-600">{note.syllabus}</h4>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDownloadPDF(note); }}
                                                        disabled={downloading === note._id}
                                                        className="bg-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full font-medium hover:bg-slate-300 transition disabled:opacity-50"
                                                    >
                                                        {downloading === note._id ? "..." : "PDF"}
                                                    </button>
                                                </div>
                                                {activeNoteId === note._id && (
                                                    <div id={`note-content-${note._id}`} className="p-4 border-t border-gray-200 bg-white">
                                                        {note.sections?.map((section, i) => (
                                                            <div key={i} className="mb-4 last:mb-0">
                                                                <h5 className="font-bold text-gray-800 text-md">{section.title}</h5>
                                                                {section.imageUrl && (
                                                                    <img src={`image-proxy?url=${encodeURIComponent(section.imageUrl)}`} alt={section.title} className="my-2 max-w-sm h-auto rounded-md border" />
                                                                )}
                                                                <p className="text-sm text-gray-600 whitespace-pre-wrap mt-1">{section.content}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center p-8 border-2 border-dashed rounded-lg text-gray-400">
                                            <p>No notes found.</p>
                                            <p className="text-sm">Try generating a new note or adjusting your search.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}