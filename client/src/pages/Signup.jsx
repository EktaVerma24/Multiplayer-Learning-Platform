import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      await API.post("/auth/register", { 
        name, 
        email, 
        password, 
        role 
      });
      
      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-pink-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden">
          <div className="px-6 pt-6 pb-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create Account</h1>
            <p className="text-slate-500 mt-1">Join EduBridge to start learning</p>
          </div>

          {success ? (
            <div className="px-6 pb-6 pt-4">
              <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-center">
                <p className="font-semibold text-green-800 mb-1">Account created successfully!</p>
                <p className="text-sm text-green-600">Redirecting to login...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4">
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">I am a</label>
                <select
                  id="role"
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 pr-10 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-700 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3.94 4.94a1.5 1.5 0 012.122 0l9 9a1.5 1.5 0 11-2.122 2.12l-1.392-1.392A8.5 8.5 0 012 10s2.2-5.5 8-5.5c1.236 0 2.34.202 3.313.56L6.06 4.94a1.5 1.5 0 00-2.121 0z" /><path d="M11.297 8.176l-3.12-3.12A4 4 0 0010 14a4 4 0 001.297-5.824z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5C4.2 3.5 2 9 2 9s2.2 5.5 8 5.5S18 9 18 9s-2.2-5.5-8-5.5zm0 9A3.5 3.5 0 1110 5a3.5 3.5 0 010 7.5z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 pr-10 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-700 focus:outline-none"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3.94 4.94a1.5 1.5 0 012.122 0l9 9a1.5 1.5 0 11-2.122 2.12l-1.392-1.392A8.5 8.5 0 012 10s2.2-5.5 8-5.5c1.236 0 2.34.202 3.313.56L6.06 4.94a1.5 1.5 0 00-2.121 0z" /><path d="M11.297 8.176l-3.12-3.12A4 4 0 0010 14a4 4 0 001.297-5.824z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5C4.2 3.5 2 9 2 9s2.2 5.5 8 5.5S18 9 18 9s-2.2-5.5-8-5.5zm0 9A3.5 3.5 0 1110 5a3.5 3.5 0 010 7.5z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 font-semibold text-white bg-violet-600 rounded-md shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-600 transition disabled:bg-violet-300"
              >
                {submitting ? "Creating account..." : "Create Account"}
              </button>

              <p className="text-center text-sm text-slate-500 mt-4">
                Already have an account?{" "}
                <Link to="/" className="font-medium text-violet-600 hover:text-violet-700">
                  Sign in
                </Link>
              </p>

              <p className="text-center text-xs text-slate-500 mt-3">
                By signing up, you agree to our <span className="font-medium text-slate-600">Terms</span> and <span className="font-medium text-slate-600">Privacy Policy</span>.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
