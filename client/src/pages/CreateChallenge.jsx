import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";

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

    // Basic required field checks
    if (!user?._id) {
      alert("You must be logged in as a teacher to create a challenge.");
      return;
    }
    if (!classroomId) {
      alert("No classroom selected.");
      return;
    }
    if (!title.trim()) {
      alert("Challenge title is required.");
      return;
    }
    if (!description.trim()) {
      alert("Challenge description is required.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("difficulty", difficulty);
    formData.append("classroom", classroomId);
    formData.append("teacher", user._id);
    if (image) {
      formData.append("image", image);
    }

    console.log("Submitting challenge payload:", {
      title: title.trim(),
      description: description.trim(),
      difficulty,
      classroom: classroomId,
      teacher: user._id,
      image: image ? image.name : null,
    });

    try {
      await API.post("/challenges", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Challenge created successfully!");
      navigate(`/classroom/${classroomId}`);
    } catch (err) {
      console.error("Error creating challenge:", err);
      if (err.response?.data?.message) {
        alert(`Error: ${err.response.data.message}`);
      } else {
        alert("Failed to create challenge. Check console for details.");
      }
    }
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
