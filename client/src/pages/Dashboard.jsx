// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

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
        const res = await API.get("/classrooms"); // GET classrooms from backend
        setClassrooms(res.data); // should be array of {_id, name, ...}
      } catch (err) {
        console.error("Failed to fetch classrooms:", err);
        setError("Could not load classrooms. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchClassrooms();
  }, []);

  const enterClassroom = (id) => {
    navigate(`/classroom/${id}`);
  };

  const goToCreateQuiz = (id) => {
    navigate(`/create-quiz/${id}`);
  };

  const goToCreateChallenge = (id) => {
    navigate(`/create-challenge/${id}`);
  };

  if (loading) return <p className="p-4">Loading classrooms...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.name}</h1>
      <h2 className="text-xl mb-2">Your Classrooms:</h2>

      {classrooms.length === 0 ? (
        <p>No classrooms available.</p>
      ) : (
        <div className="space-y-4">
          {classrooms.map((cls) => (
            <div key={cls._id} className="border p-3 rounded">
              <div
                className="cursor-pointer hover:bg-gray-100 p-2 rounded"
                onClick={() => enterClassroom(cls._id)}
              >
                <strong>{cls.name}</strong>
              </div>

              {user.role === "teacher" && (
                <div className="mt-2 space-x-2">
                  <button
                    onClick={() => goToCreateQuiz(cls._id)}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    Create Quiz
                  </button>
                  <button
                    onClick={() => goToCreateChallenge(cls._id)}
                    className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
                  >
                    Create Challenge
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
