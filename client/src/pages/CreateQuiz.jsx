import { useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

export default function CreateQuiz() {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([{ question: "", options: [], correctAnswer: "" }]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { question: "", options: [], correctAnswer: "" }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post(`http://localhost:5000/api/quizzes`, {
      classroomId,
      title,
      questions
    });
    navigate(`/classroom/${classroomId}`);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Create Quiz</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Quiz Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 w-full mb-4"
        />
        {questions.map((q, i) => (
          <div key={i} className="border p-2 mb-2">
            <input
              type="text"
              placeholder="Question"
              value={q.question}
              onChange={(e) => {
                const newQs = [...questions];
                newQs[i].question = e.target.value;
                setQuestions(newQs);
              }}
              className="border p-1 w-full"
            />
            <textarea
              placeholder="Comma separated options"
              onChange={(e) => {
                const newQs = [...questions];
                newQs[i].options = e.target.value.split(",");
                setQuestions(newQs);
              }}
              className="border p-1 w-full mt-2"
            />
            <input
              type="text"
              placeholder="Correct Answer"
              value={q.correctAnswer}
              onChange={(e) => {
                const newQs = [...questions];
                newQs[i].correctAnswer = e.target.value;
                setQuestions(newQs);
              }}
              className="border p-1 w-full mt-2"
            />
          </div>
        ))}
        <button type="button" onClick={handleAddQuestion} className="bg-blue-500 text-white px-3 py-1 rounded mt-2">
          + Add Question
        </button>
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded mt-4 block">
          Save Quiz
        </button>
      </form>
    </div>
  );
}
