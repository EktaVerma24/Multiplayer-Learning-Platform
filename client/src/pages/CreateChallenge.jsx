import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function CreateChallenge({ user }) {
  const { id: classroomId } = useParams(); // ✅ same as CreateQuiz
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "Easy",
    dueDate: "",
  });

  // If classroomId is missing, redirect back to dashboard
  useEffect(() => {
    if (!classroomId) {
      console.error("❌ Missing classroomId in route");
      navigate("/dashboard");
    }
  }, [classroomId, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!user?._id) {
      alert("You must be logged in as a teacher to create a challenge.");
      return;
    }
    if (!classroomId) {
      alert("No classroom selected.");
      return;
    }
    if (!formData.title.trim() || !formData.description.trim()) {
      alert("Title and description are required.");
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      difficulty: formData.difficulty,
      dueDate: formData.dueDate,
      classroom: classroomId, // ✅ match backend field name
      teacher: user._id,
    };

    console.log("📤 Submitting challenge payload:", payload);

    try {
      await API.post("/challenges", payload);
      alert("✅ Challenge created successfully!");
      navigate(`/classroom/${classroomId}`);
    } catch (err) {
      console.error("❌ Error creating challenge:", err);
      if (err.response?.data?.message) {
        alert(`Error: ${err.response.data.message}`);
      } else {
        alert("Failed to create challenge. Check console for details.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold">Create Challenge</h1>

      <input
        type="text"
        name="title"
        placeholder="Challenge title"
        value={formData.title}
        onChange={handleChange}
        className="border p-2 w-full"
        required
      />

      <textarea
        name="description"
        placeholder="Challenge description"
        value={formData.description}
        onChange={handleChange}
        className="border p-2 w-full"
        required
      />

      <div>
        <label className="block mb-1 font-semibold">Difficulty</label>
        <select
          name="difficulty"
          value={formData.difficulty}
          onChange={handleChange}
          className="border p-2 w-full"
        >
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>
      </div>

      <div>
        <label className="block mb-1 font-semibold">Due Date</label>
        <input
          type="date"
          name="dueDate"
          value={formData.dueDate}
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />
      </div>

      <button
        type="submit"
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Save Challenge
      </button>
    </form>
  );
}
