import { useEffect, useState } from "react";
import API from "../api/axios";

export default function Quiz({ classroomId }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debug: Check what classroomId is being passed
  useEffect(() => {
    console.log("Classroom ID passed to Quiz:", classroomId);
  }, [classroomId]);

  useEffect(() => {
    if (!classroomId) {
      setError("No classroom selected.");
      setLoading(false);
      return;
    }

    // Optional: Validate ObjectId format before making request
    // If classroomId is not valid, stop here
    // This prevents hitting the backend with "class1" and causing a 500 error
    if (!/^[0-9a-fA-F]{24}$/.test(classroomId)) {
      setError("Invalid classroom ID format.");
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
        setError(err.response?.data?.message || "Failed to fetch quizzes. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [classroomId]);

  if (loading) return <p className="p-4">Loading quizzes...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;
  if (quizzes.length === 0) return <p className="p-4">No quizzes found for this classroom.</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Quizzes</h1>
      {quizzes.map((quiz) => (
        <div key={quiz._id} className="border p-4 mb-4 rounded-md shadow-sm">
          <h2 className="font-bold text-lg mb-2">{quiz.title}</h2>
          {quiz.questions.map((q, i) => (
            <div key={i} className="ml-4 my-2">
              <p className="font-medium">{q.question}</p>
              <ul className="list-disc list-inside ml-4">
                {q.options.map((opt, idx) => (
                  <li key={idx}>{opt}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
