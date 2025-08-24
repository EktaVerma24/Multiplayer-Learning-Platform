import { useState, useEffect, use } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios"; // Using axios for API calls
import API from "../api/axios";
import { Bolt, FileOutput } from "lucide-react";

// --- Inlined SVG Icons to remove external dependency ---
const FaPlay = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"></path></svg>;
const FaCheck = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path></svg>;
const FaSpinner = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M304 48c0 26.51-21.49 48-48 48s-48-21.49-48-48 21.49-48 48-48 48 21.49 48 48zm-48 368c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zm208-208c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zM96 256c0-26.51-21.49-48-48-48S0 229.49 0 256s21.49 48 48 48 48-21.49 48-48zm12.922 99.078c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.491-48-48-48zm294.156 0c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.49-48-48-48zM108.922 60.922c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.491-48-48-48z"></path></svg>;
const FaCode = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M278.9 511.5l-61-17.7c-6.4-1.8-10-8.5-8.2-14.9L346.2 8.7c1.8-6.4 8.5-10 14.9-8.2l61 17.7c6.4 1.8 10 8.5 8.2 14.9L293.8 503.3c-1.9 6.4-8.5 10.1-14.9 8.2zm-114-112.2l43.5-46.4c4.6-4.9 4.3-12.7-.8-17.2L117 256l90.6-79.7c5.1-4.5 5.5-12.3.8-17.2l-43.5-46.4c-4.5-4.8-12.1-5.1-17-.5L3.8 247.2c-5.1 4.7-5.1 12.8 0 17.5l144.1 135.1c4.9 4.6 12.5 4.4 17-.5zm327.2.6l144.1-135.1c5.1-4.7 5.1-12.8 0-17.5L492.1 112.1c-4.8-4.5-12.4-4.3-17 .5L431.6 159c-4.6 4.9-4.3 12.7.8 17.2L523 256l-90.6 79.7c-5.1 4.5-5.5-12.3-.8 17.2l43.5 46.4c4.5 4.9 12.1 5.1 17 .6z"></path></svg>;
const FaExclamationTriangle = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M569.517 440.013C587.975 472.007 564.806 512 527.94 512H48.054c-36.937 0-60.035-39.993-41.577-71.987L246.423 23.985c18.467-32.009 64.72-31.951 83.154 0l239.94 416.028zM288 354c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346l7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.982 12.654z"></path></svg>;
const FaHome = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M280.37 148.26L96 300.11V464a16 16 0 0 0 16 16l112.06-.29a16 16 0 0 0 15.94-16V368a16 16 0 0 1 16-16h64a16 16 0 0 1 16 16v95.64a16 16 0 0 0 16 16.05L464 480a16 16 0 0 0 16-16V300.11L295.63 148.26a12.19 12.19 0 0 0-15.26 0zM571.6 251.47L488 182.58V44.05a12 12 0 0 0-12-12h-40a12 12 0 0 0-12 12v72.61L318.47 43a48 48 0 0 0-61 0L4.34 251.47a12 12 0 0 0-1.6 16.9l25.5 31A12 12 0 0 0 45.15 301l225.1-187.37a12 12 0 0 1 15.5 0L530.9 301a12 12 0 0 0 16.9-1.6l25.5-31a12 12 0 0 0-1.7-16.93z"></path></svg>;

const LANGUAGES = [
    { label: "JavaScript", value: "javascript" },
    { label: "Python", value: "python" },
    { label: "C++", value: "cpp" },
    { label: "Java", value: "java" },
    { label: "C", value: "c" },
    { label: "TypeScript", value: "typescript" },
];

const BOILERPLATE_CODE = {
    javascript: `function solve() {\n  // Write your code here\n  console.log("Hello, JavaScript!");\n}`,
    python: `def solve():\n  # Write your code here\n  print("Hello, Python!")`,
    cpp: `#include <iostream>\n\nint main() {\n  // Write your code here\n  std::cout << "Hello, C++!";\n  return 0;\n}`,
    java: `public class Main {\n  public static void main(String[] args) {\n    // Write your code here\n    System.out.println("Hello, Java!");\n  }\n}`,
    c: `#include <stdio.h>\n\nint main() {\n  // Write your code here\n  printf("Hello, C!");\n  return 0;\n}`,
    typescript: `function solve(): void {\n  // Write your code here\n  console.log("Hello, TypeScript!");\n}`,
};

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <FaSpinner className="animate-spin text-5xl text-violet-500" />
        <p className="mt-4 text-lg font-semibold text-slate-700">Loading Challenge...</p>
    </div>
);

const ErrorDisplay = ({ message }) => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-red-600">
        <FaExclamationTriangle className="text-5xl" />
        <p className="mt-4 text-lg font-semibold">Failed to load challenge</p>
        <p className="text-sm text-slate-500">{message}</p>
    </div>
);

export default function AttemptChallenge() {
    const { id } = useParams();
    const [challenge, setChallenge] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [availableLanguages , setAvailableLanguages] = useState([]);
    const [language, setLanguage] = useState("java");
    const [code, setCode] = useState(BOILERPLATE_CODE.javascript);
    const [isRunning, setIsRunning] = useState(false);
    const [runResult, setRunResult] = useState({ status: null, message: "" });


    useEffect(() => {
        const fetchChallenge = async () => {
            if (!id) {
                setError("No challenge ID provided.");
                setIsLoading(false);
                return;
            }
            try {
                const response = await API.get(`/challenges/${id}`);
                // console.log(response.data);

                setChallenge(response.data);
                
                if (response.data.languageTemplates) {
                // A helper to make labels look nice (e.g., "java" -> "Java")
                const languageLabelMap = {
                    javascript: "JavaScript",
                    python: "Python",
                    java: "Java",
                    cpp: "C++",
                };

                // Get the keys from the map (e.g., ["java", "python"])
                const languages = Object.keys(response.data.languageTemplates).map(key => ({
                    value: key,
                    label: languageLabelMap[key] || key
                }));
                
                setAvailableLanguages(languages);

                console.log(availableLanguages);
                

                // Automatically select the first available language as the default
                if (languages.length > 0) {
                    setLanguage(languages[0].value);
                }
            }
            } catch (err) {
                setError(err.response?.data?.message || "An unknown error occurred.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchChallenge();
    }, [id]);

    useEffect(() => {
        if (challenge && language) {
            const rawBoilerplate = challenge.languageTemplates?.[language]?.boilerplate;
    
            const formattedBoilerplate = rawBoilerplate ? rawBoilerplate.replace(/\\n/g, '\n') : `// Boilerplate for ${language} not found.`;

            setCode(formattedBoilerplate);
        }   
    }, [challenge, language]);

    const runCode = async () => {
    if (!challenge.testCases || challenge.testCases.length === 0) {
        setRunResult({ status: 'error', message: "No test cases available to run." });
        return;
    }

    setIsRunning(true);

    // Use a for...of loop to handle async calls sequentially
    for (const [index, testCase] of challenge.testCases.entries()) {
        // 1. Update the UI to show progress
        setRunResult({ status: null, message: `Running test case ${index + 1}/${challenge.testCases.length}...` });
        console.log(testCase.input);
        try {
            const response = await API.post('/challenges/run', {
                code: code,
                language: language,
                input: testCase.input,
                challengeId: id,
            });

            const result = response.data;
            const status = result.status.description;

            console.log(response);

            // 2. Check for compilation or runtime errors first
            if (status !== "Accepted") {
                const errorMessage = result.compile_output || result.stderr || "An unknown error occurred.";
                setRunResult({ 
                    status: 'error', 
                    message: `❌ Test Case #${index + 1} Failed: ${status}\n\n${errorMessage}` 
                });
                setIsRunning(false);
                return; // Stop execution on the first error
            }
            
            // 3. Compare the output for the current test case
            const apiOutput = result.stdout ? result.stdout.trim() : "";
            const expectedOutput = testCase.expectedOutput.trim();

            if (apiOutput !== expectedOutput) {
                let resultMessage = `Input:\n${testCase.input}\n\nExpected:\n${expectedOutput}\n\nYour Output:\n${apiOutput}`;
                setRunResult({ 
                    status: 'error', 
                    message: `❌ Test Case #${index + 1} Failed: Incorrect Answer\n\n${resultMessage}` 
                });
                setIsRunning(false);
                return; // Stop execution on the first failure
            }

        } catch (err) {
            const errorMessage = err.response?.data?.details || "An unexpected error occurred.";
            setRunResult({ status: 'error', message: `API Request Failed:\n${errorMessage}` });
            setIsRunning(false);
            return;
        }
    }

    // 4. If the loop completes, all test cases passed
    setRunResult({ status: 'success', message: `✅ All ${challenge.testCases.length} test cases passed!` });
    setIsRunning(false);
};

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Submitting final solution:", { code, language });
        alert("Solution submitted! (Check console for data)");
    };

    if (isLoading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay message={error} />;
    if (!challenge) return <ErrorDisplay message="Challenge data is not available." />;

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-violet-100 p-4 sm:p-6 lg:p-8 font-sans">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-7xl mx-auto bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl shadow-violet-200/50 border border-white/80 p-6 sm:p-8 relative"
            >
                {/* --- NEW: Home Button --- */}
                <a href="/dashboard" className="absolute -top-5 right-4 p-2.5 rounded-full bg-violet-100 transition-all duration-300 shadow-sm hover:shadow-md">
                    <FaHome size={20} />
                </a>

                {/* --- Header --- */}
                <div className="flex justify-between items-start mb-8 pb-6 border-b border-slate-200">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
                            {challenge.title}
                        </h1>
                        <p className="text-slate-500 mt-2 max-w-2xl">{challenge.description}</p>
                        <img src={challenge.image} alt={challenge.title} className="mt-4 rounded-lg shadow-md" />
                        <div>
                            <h3 className="font-bold mt-4">Test Cases:</h3>
                            <ul className="list-disc pl-5 text-slate-600">
                                {challenge.testCases.map(testCase => (
                                // The key prop is essential for React to keep track of list items
                                <li key={testCase._id}>
                                    <strong className="text-blue-800">Input:</strong> <span>{testCase.input}</span>, <strong className="text-green-800">Output:</strong> <span>{testCase.expectedOutput}</span>
                                </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <span className={`capitalize px-4 py-1.5 text-sm font-semibold rounded-full ${
                        challenge.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                        challenge.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                        {challenge.difficulty}
                    </span>
                </div>

                {/* --- Main Content: Editor and Output --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* --- Left Side: Code Editor --- */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <label className="font-bold text-slate-700 flex items-center gap-2">
                                <FaCode className="text-violet-600"/>
                                Solution Editor
                            </label>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:outline-none bg-slate-50 text-slate-700 font-semibold"
                            >
                                {availableLanguages.map((lang) => (
                                    <option key={lang.value} value={lang.value}>
                                        {lang.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="rounded-xl overflow-hidden border border-slate-300 h-[400px] md:h-[450px] bg-white focus-within:ring-4 focus-within:ring-violet-300/70 transition-all shadow-inner">
                            <textarea
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full h-full bg-transparent text-slate-800 font-mono text-[15px] p-4 resize-none focus:outline-none placeholder-slate-400"
                                placeholder="// Write your code here..."
                                spellCheck="false"
                            />
                        </div>
                    </div>

                    {/* --- Right Side: Output and Controls --- */}
                    <div className="flex flex-col gap-4">
                         <h3 className="text-lg mt-2 font-bold text-slate-700 flex items-center gap-2">
                            <FileOutput size={20} className="text-black"/>
                            Execution Output
                        </h3>
                        <div className={`min-h-[150px] flex-grow rounded-xl p-4 font-mono text-sm whitespace-pre-wrap border transition-colors duration-300 shadow-inner ${
                            runResult.status === 'success' ? 'border-green-300 bg-green-50/80 text-green-800' :
                            runResult.status === 'error' ? 'border-red-300 bg-red-50/80 text-red-800' :
                            'border-slate-300 bg-slate-100/80 text-slate-600'
                        }`}>
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={runResult.message || "initial"}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {runResult.message || "Your code's output will appear here..."}
                                </motion.p>
                            </AnimatePresence>
                        </div>
                        <form onSubmit={handleSubmit} className="flex gap-4 items-center mt-auto pt-6 border-t border-slate-200">
                            <motion.button
                                type="button"
                                onClick={runCode}
                                disabled={isRunning}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-600 text-white font-bold shadow-lg shadow-green-500/30 hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                whileHover={{ scale: 1 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {isRunning ? <FaSpinner className="animate-spin" /> : <FaPlay />}
                                Run Code
                            </motion.button>
                            <motion.button
                                type="submit"
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all"
                                whileHover={{ scale: 1 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <FaCheck />
                                Submit Solution
                            </motion.button>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
