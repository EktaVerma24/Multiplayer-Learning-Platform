import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ClassroomPage from "./pages/ClassroomPage.jsx";
import CreateQuiz from "./pages/CreateQuiz.jsx";
import CreateChallenge from "./pages/CreateChallenge.jsx";

function App() {
  const [user, setUser] = useState(null);

  // Load saved user from localStorage on first render
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Store user in both state and localStorage
  const handleSetUser = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  return (
    <Router>
      <Routes>
        {/* Login */}
        <Route path="/" element={<Login setUser={handleSetUser} />} />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={user ? <Dashboard user={user} /> : <Navigate to="/" replace />}
        />

        {/* Classroom */}
        <Route
          path="/classroom/:id"
          element={user ? <ClassroomPage user={user} /> : <Navigate to="/" replace />}
        />

        {/* Create Quiz */}
        <Route
          path="/create-quiz/:id"
          element={user ? <CreateQuiz user={user} /> : <Navigate to="/" replace />}
        />

        {/* Create Challenge */}
        <Route
          path="/create-challenge/:id"
          element={user ? <CreateChallenge user={user} /> : <Navigate to="/" replace />}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
