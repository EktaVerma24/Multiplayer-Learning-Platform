import { useEffect, useState } from "react";
import API from "../api/axios.js";
export default function Challenge({ classroomId }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!classroomId) return;

    const fetchChallenges = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await API.get(
          `/challenges/classroom/${classroomId}`
        );
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
    return <p className="text-red-500">No classroom selected.</p>;
  }

  if (loading) return <p>Loading challenges...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Challenges</h1>
      {challenges.length === 0 ? (
        <p>No challenges available for this classroom.</p>
      ) : (
        <ul className="space-y-4">
          {challenges.map((ch, index) => (
            <li
              key={index}
              className="border p-4 rounded-lg shadow hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold">{ch.title}</h2>
              <p className="text-gray-600">{ch.description}</p>
              <p className="text-sm text-gray-500 mt-2">
                Difficulty: {ch.difficulty || "N/A"}
              </p>
              <button
                onClick={() => alert(`Attempting challenge: ${ch.title}`)}
                className="bg-blue-500 text-white px-4 py-2 rounded mt-3 hover:bg-blue-600"
              >
                Attempt
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
