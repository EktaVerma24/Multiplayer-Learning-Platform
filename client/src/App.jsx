import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ClassroomPage from "./pages/ClassroomPage.jsx";
import ProtectedRoute from "./pages/ProtectedRoute.jsx"; 
import API from "./api/axios";
import CreateQuiz from "./pages/CreateQuiz.jsx";
import CreateChallenge from "./pages/CreateChallenge.jsx";
import AttemptChallenge from "./pages/AttemptChallenge.jsx";
import Analytics from "./pages/Analytics.jsx";
import { track } from "./api/analytics";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-10">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-violet-500"></div>
    </div>
  );

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
  
  if (loading) return <LoadingSpinner />;
  

  return (
    <Router>
      {user && <RouteAnalytics />}
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Login setUser={setUser} />} />
        <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />

        {/* 👇 All your protected routes are now clean and nested */}
        <Route element={<ProtectedRoute user={user} />}>
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/classroom/:id" element={<ClassroomPage user={user} />} />
          <Route path="/create-quiz/:id" element={<CreateQuiz user={user} />} />
          <Route path="/create-challenge/:id" element={<CreateChallenge user={user} />} />
          <Route path="/attemptchallenge/:id" element={<AttemptChallenge user={user} />} />
          <Route path="/analytics" element={<Analytics />} />
          {/* <Route path="/availablejobs" element={<AvailableJobs user={user} />} /> */}
        </Route>

        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;

// Route-level analytics: page views + dwell time
function RouteAnalytics() {
  const location = useLocation();
  const last = (RouteAnalytics.__last ||= { path: location.pathname, ts: Date.now() });

  // on route change, emit page_view for previous path with duration
  useEffect(() => {
    const now = Date.now();
    const durationMs = now - last.ts;
    // send dwell for previous page
    track("page_view", { page: last.path }, { durationMs });
    // update ref
    last.path = location.pathname;
    last.ts = now;
    // heartbeat while on page
    const id = setInterval(() => track("session_heartbeat", { page: last.path }), 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return null;
}