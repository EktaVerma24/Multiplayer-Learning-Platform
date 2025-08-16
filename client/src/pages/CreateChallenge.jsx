import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios.js";

export default function CreateChallenge() {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await API.post(`/challenges`, {
      classroomId,
      title,
      description,
      difficulty
    });
    navigate(`/classroom/${classroomId}`);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Create Challenge</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Challenge Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 w-full mb-4"
        />
        <textarea
          placeholder="Challenge Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 w-full mb-4"
        />
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="border p-2 w-full mb-4"
        >
          <option value="">Select Difficulty</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <button type="submit" className="bg-purple-500 text-white px-4 py-2 rounded">
          Save Challenge
        </button>
      </form>
    </div>
  );
}
