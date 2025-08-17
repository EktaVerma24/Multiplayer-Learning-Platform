import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ClassroomPage from "./pages/ClassroomPage.jsx";
import ProtectedRoute from "./pages/ProtectedRoute.jsx"; 
import API from "./api/axios";
import CreateQuiz from "./pages/CreateQuiz.jsx";
import CreateChallenge from "./pages/CreateChallenge.jsx";
import AttemptChallenge from "./pages/AttemptChallenge.jsx";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // This useEffect is the most important change
  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // Set the token for your API instance
          API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          // ✅ Use your new backend route to get the user
          const res = await API.get("/auth/me");
          setUser(res.data);
        } catch (error) {
          console.error("Token validation failed:", error);
          localStorage.removeItem("token"); // Clean up invalid token
        }
      }
      setLoading(false);
    };

    validateSession();
  }, []);

  // Show a loading indicator while the session is being validated
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login setUser={setUser} />} />

        {/* 👇 All your protected routes are now clean and nested */}
        <Route element={<ProtectedRoute user={user} />}>
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/classroom/:id" element={<ClassroomPage user={user} />} />
          <Route path="/create-quiz/:id" element={<CreateQuiz user={user} />} />
          <Route path="/create-challenge/:id" element={<CreateChallenge user={user} />} />
          <Route path="/attemptchallenge/:id" element={<AttemptChallenge user={user} />} />
        </Route>

        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;