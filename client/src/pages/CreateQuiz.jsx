<<<<<<< HEAD
import { useState, useEffect } from "react";
=======
import { useState } from "react";
import API from "../api/axios";
>>>>>>> origin/Murtaza
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function CreateQuiz({ user }) {
  const { id: classroomId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([
    { question: "", options: ["", "", "", ""], correctOption: 0 }
  ]);

  // If classroomId is missing, redirect back to dashboard
  useEffect(() => {
    if (!classroomId) {
      console.error("Missing classroomId in route");
      navigate("/dashboard");
    }
  }, [classroomId, navigate]);

  const handleQuestionChange = (qIndex, value) => {
    const updated = [...questions];
    updated[qIndex].question = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  const handleCorrectOptionChange = (qIndex, value) => {
    const updated = [...questions];
    updated[qIndex].correctOption = parseInt(value, 10);
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question: "", options: ["", "", "", ""], correctOption: 0 }
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
<<<<<<< HEAD

    // Basic required field checks
    if (!user?._id) {
      alert("You must be logged in as a teacher to create a quiz.");
      return;
    }
    if (!classroomId) {
      alert("No classroom selected.");
      return;
    }
    if (!title.trim()) {
      alert("Quiz title is required.");
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        alert(`Question ${i + 1} is missing text`);
        return;
      }
      if (q.options.some(opt => !opt.trim())) {
        alert(`Question ${i + 1} has an empty option`);
        return;
      }
      if (isNaN(q.correctOption) || q.correctOption < 0 || q.correctOption >= q.options.length) {
        alert(`Question ${i + 1} has an invalid correct option index`);
        return;
      }
    }

    const payload = {
      title: title.trim(),
      classroom: classroomId,
      teacher: user._id,
      questions: questions.map(q => ({
        question: q.question.trim(),
        options: q.options.map(opt => opt.trim()),
        correctOption: q.correctOption
      }))
    };

    console.log("Submitting quiz payload:", payload);

    try {
      await API.post("/quizzes", payload);
      alert("Quiz created successfully!");
      navigate(`/classroom/${classroomId}`);
    } catch (err) {
      console.error("Error creating quiz:", err);
      if (err.response?.data?.message) {
        alert(`Error: ${err.response.data.message}`);
      } else {
        alert("Failed to create quiz. Check console for details.");
      }
    }
=======
    await API.post(`/quizzes`, {
      classroomId,
      title,
      questions
    });
    navigate(`/classroom/${classroomId}`);
>>>>>>> origin/Murtaza
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Create Quiz</h1>

      <input
        type="text"
        placeholder="Quiz title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 w-full"
      />

      {questions.map((q, qIndex) => (
        <div key={qIndex} className="border p-3 rounded space-y-2">
          <input
            type="text"
            placeholder={`Question ${qIndex + 1}`}
            value={q.question}
            onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
            className="border p-2 w-full"
          />
          {q.options.map((opt, optIndex) => (
            <input
              key={optIndex}
              type="text"
              placeholder={`Option ${optIndex + 1}`}
              value={opt}
              onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
              className="border p-2 w-full"
            />
          ))}
          <label>
            Correct Option Index:
            <select
              value={q.correctOption}
              onChange={(e) => handleCorrectOptionChange(qIndex, e.target.value)}
              className="border p-1 ml-2"
            >
              {q.options.map((_, idx) => (
                <option key={idx} value={idx}>
                  {idx}
                </option>
              ))}
            </select>
          </label>
        </div>
      ))}

      <button
        type="button"
        onClick={addQuestion}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Add Question
      </button>

      <button
        type="submit"
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Save Quiz
      </button>
    </form>
  );
}
