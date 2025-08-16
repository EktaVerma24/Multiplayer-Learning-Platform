import { useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

export default function CreateChallenge({ user }) {
  const { id: classroomId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [image, setImage] = useState(null);

  // Redirect if classroomId is missing
  useEffect(() => {
    if (!classroomId) {
      console.error("Missing classroomId in route");
      navigate("/dashboard");
    }
  }, [classroomId, navigate]);

  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post(`http://localhost:5000/api/challenges`, {
      classroomId,
      title,
      description,
      difficulty
    });
    navigate(`/classroom/${classroomId}`);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Create Challenge</h1>

      <input
        type="text"
        placeholder="Challenge title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 w-full"
      />

      <textarea
        placeholder="Challenge description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border p-2 w-full"
      />

      <label>
        Difficulty:
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="border p-1 ml-2"
        >
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </label>

      <input
        type="file"
        onChange={handleFileChange}
        className="border p-2 w-full"
      />

      <button
        type="submit"
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Save Challenge
      </button>
    </form>
  );
}
