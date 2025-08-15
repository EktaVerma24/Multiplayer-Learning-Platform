import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Classroom from "./pages/Classroom.jsx";
import Whiteboard from "./pages/Whiteboard.jsx";
import Quiz from "./pages/Quiz.jsx";

function App() {
  const user = { name: "John Doe" }; // Replace with logged-in user
  const classroomId = "689f184b7c7bb3f37223c4ee"; // Replace dynamically from classroom selection

  return (
    <Router>
      <Routes>
        <Route
          path="/classroom"
          element={<Classroom classroomId={classroomId} user={user} />}
        />
        <Route
          path="/whiteboard"
          element={<Whiteboard classroomId={classroomId} user={user} />}
        />
        <Route
          path="/quiz"
          element={<Quiz classroomId={classroomId} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
