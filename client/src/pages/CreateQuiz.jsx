import { useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

export default function CreateQuiz({ user }) {
  const { classroomId } = useParams(); // ✅ Get classroomId from route
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([{ question: "", options: ["", "", "", ""], answer: "" }]);

  // ✅ Debug log
  console.log("classroomId:", classroomId, "teacherId:", user?._id);

  const handleAddQuestion = () => {
    setQuestions([...questions, { question: "", options: ["", "", "", ""], answer: "" }]);
  };

  const handleChangeQuestion = (index, field, value) => {
    const updated = [...questions];
    if (field === "question" || field === "answer") {
      updated[index][field] = value;
    } else {
      updated[index].options[field] = value;
    }
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!classroomId || !user?._id) {
      console.error("❌ Missing classroomId or teacherId", { classroomId, teacherId: user?._id });
      alert("Error: Missing classroom or teacher info. Please try again.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/quizzes/create",
        {
          title,
          questions,
          classroomId,
          teacherId: user._id,
        },
        { withCredentials: true } // ✅ ensures cookie/session is sent
      );

      alert("✅ Quiz created successfully!");
      navigate(`/classroom/${classroomId}`);
    } catch (err) {
      console.error("Error creating quiz:", err.response?.data || err.message);
      alert("Failed to create quiz. Please try again.");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Create Quiz</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Quiz Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />

        {questions.map((q, index) => (
          <div key={index} className="p-4 border rounded space-y-2">
            <input
              type="text"
              placeholder="Question"
              value={q.question}
              onChange={(e) => handleChangeQuestion(index, "question", e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
            {q.options.map((opt, i) => (
              <input
                key={i}
                type="text"
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) => handleChangeQuestion(index, i, e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            ))}
            <input
              type="text"
              placeholder="Correct Answer"
              value={q.answer}
              onChange={(e) => handleChangeQuestion(index, "answer", e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        ))}

        <button type="button" onClick={handleAddQuestion} className="px-4 py-2 bg-gray-500 text-white rounded">
          ➕ Add Question
        </button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          ✅ Create Quiz
        </button>
      </form>
    </div>
  );
}
