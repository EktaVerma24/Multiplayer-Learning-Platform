import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ClassroomPage from "./pages/ClassroomPage.jsx";
import ProtectedRoute from "./pages/ProtectedRoute.jsx"; 
import API from "./api/axios";

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
        {/* Your Login component now only needs to set the token. 
            The user state will be handled by the refresh or next navigation.
            However, passing setUser for an instant UI update is still good practice.
        */}
        <Route path="/" element={<Login setUser={setUser} />} />

        {/* 👇 All your protected routes are now clean and nested */}
        <Route element={<ProtectedRoute user={user} />}>
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/classroom/:id" element={<ClassroomPage user={user} />} />
          {/* Add other protected routes here */}
        </Route>

        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;