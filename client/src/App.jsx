import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ClassroomPage from "./pages/ClassroomPage.jsx";

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Routes>
        {/* Login page */}
        <Route path="/" element={<Login setUser={setUser} />} />

        {/* Dashboard page */}
        <Route
          path="/dashboard"
          element={user ? <Dashboard user={user} /> : <Navigate to="/" replace />}
        />

        {/* Classroom page */}
        <Route
          path="/classroom/:id"
          element={user ? <ClassroomPage user={user} /> : <Navigate to="/" replace />}
        />

        {/* Fallback for unmatched routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
