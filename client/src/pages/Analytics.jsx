// client/src/pages/Analytics.jsx
import { useEffect, useState } from "react";
import API from "../api/axios";
import { motion } from "framer-motion";

export default function Analytics() {
  const [overallData, setOverallData] = useState({ weeks: [], avgRetention: null, loading: true, error: null });
  const [userData, setUserData] = useState({ weeks: [], avgRetention: null, totalEvents: 0, loading: true, error: null });
  const [seeding, setSeeding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [seedMessage, setSeedMessage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch overall retention (all users)
        const overallRes = await API.get("/analytics/weekly-retention?weeks=8");
        console.log(overallRes);
        setOverallData({ ...overallRes.data, loading: false, error: null });
      } catch (err) {
        console.error("Failed to fetch overall retention:", err);
        setOverallData({ weeks: [], avgRetention: null, loading: false, error: err.response?.data?.error || "Failed to load data" });
      }

      try {
        // Fetch user-specific retention
        const userRes = await API.get("/analytics/user-retention?weeks=8");
        setUserData({ ...userRes.data, loading: false, error: null });
      } catch (err) {
        console.error("Failed to fetch user retention:", err);
        setUserData({ weeks: [], avgRetention: null, totalEvents: 0, loading: false, error: err.response?.data?.error || "Failed to load data" });
      }
    };
    fetchData();
  }, []);

  const handleSeedData = async () => {
    setSeeding(true);
    setSeedMessage(null);
    try {
      const res = await API.post("/analytics/seed-dummy-data");
      setSeedMessage({ type: "success", text: res.data.message });
      // Refresh data after seeding
      setTimeout(() => {
        const fetchData = async () => {
          try {
            const overallRes = await API.get("/analytics/weekly-retention?weeks=8");
            setOverallData({ ...overallRes.data, loading: false, error: null });
            
            const userRes = await API.get("/analytics/user-retention?weeks=8");
            setUserData({ ...userRes.data, loading: false, error: null });
          } catch (err) {
            console.error("Failed to refresh data:", err);
          }
        };
        fetchData();
      }, 1000);
    } catch (err) {
      setSeedMessage({ 
        type: "error", 
        text: err.response?.data?.error || "Failed to seed dummy data" 
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleRemoveSeededData = async () => {
    if (!window.confirm("Are you sure you want to remove all seeded dummy data? This action cannot be undone.")) {
      return;
    }

    setRemoving(true);
    setSeedMessage(null);
    try {
      const res = await API.delete("/analytics/seed-dummy-data");
      setSeedMessage({ type: "success", text: res.data.message });
      // Refresh data after removal
      setTimeout(() => {
        const fetchData = async () => {
          try {
            const overallRes = await API.get("/analytics/weekly-retention?weeks=8");
            setOverallData({ ...overallRes.data, loading: false, error: null });
            
            const userRes = await API.get("/analytics/user-retention?weeks=8");
            setUserData({ ...userRes.data, loading: false, error: null });
          } catch (err) {
            console.error("Failed to refresh data:", err);
          }
        };
        fetchData();
      }, 1000);
    } catch (err) {
      setSeedMessage({ 
        type: "error", 
        text: err.response?.data?.error || "Failed to remove seeded data" 
      });
    } finally {
      setRemoving(false);
    }
  };

  // Format week date for display
  const formatWeek = (weekISO) => {
    const date = new Date(weekISO);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Simple bar chart component
  const BarChart = ({ data, title, maxValue = 100 }) => {
    if (!data || data.length === 0) return null;
    
    const maxRetention = Math.max(...data.map(d => d.retention || 0).filter(v => v !== null), maxValue);
    
    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-10 text-slate-700">{title}</h3>
        <div className="flex items-end gap-2 h-64 border-b-2 border-l-2 border-slate-300 pl-2 pb-2">
          {data.map((week, idx) => {
            const barHeight = week.retention !== null ? (week.retention / maxRetention) * 100 : 0;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 relative">
                {/* Percentage label above the bar */}
                <div className="absolute -top-6 left-0 right-0 text-center">
                  <span className="text-xs font-medium text-slate-700 bg-white px-1 rounded">
                    {week.retention !== null ? `${week.retention}%` : '—'}
                  </span>
                </div>
                
                {/* Bar container */}
                <div className="relative w-full bg-slate-100 rounded-t" style={{ height: '200px', minHeight: '200px' }}>
                  {week.retention !== null && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${barHeight}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      className={`absolute bottom-0 left-0 right-0 rounded-t ${
                        week.retention >= 70 ? 'bg-green-500' :
                        week.retention >= 40 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      title={`${week.retention}% retention`}
                      style={{ height: `${barHeight}%` }}
                    />
                  )}
                  {week.retention === null && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-slate-400 font-medium">N/A</span>
                    </div>
                  )}
                </div>
                
                {/* Week label below */}
                <div className="text-xs text-slate-500 text-center mt-1 transform -rotate-45 origin-top-left whitespace-nowrap w-full" style={{ height: '60px', writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                  {formatWeek(week.week)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-2 text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>≥70% (Good)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>40-69% (Fair)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>&lt;40% (Low)</span>
          </div>
        </div>
      </div>
    );
  };

  if (overallData.loading || userData.loading) {
    return (
      <div className="min-h-screen bg-white p-6 sm:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-violet-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-800 p-6 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Analytics Dashboard
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              Track user retention and engagement metrics
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSeedData}
              disabled={seeding || removing}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 transition disabled:bg-violet-300 disabled:cursor-not-allowed"
              title="Generate 10 weeks of dummy analytics data for all users (including your retention data)"
            >
              {seeding ? "Seeding..." : "Seed Dummy Data"}
            </button>
            <button
              onClick={handleRemoveSeededData}
              disabled={removing || seeding}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:bg-red-300 disabled:cursor-not-allowed"
              title="Remove all seeded dummy analytics data"
            >
              {removing ? "Removing..." : "Remove Seeded Data"}
            </button>
          </div>
        </header>

        {seedMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            seedMessage.type === "success" 
              ? "bg-green-50 border border-green-200 text-green-800" 
              : "bg-red-50 border border-red-200 text-red-800"
          }`}>
            {seedMessage.text}
          </div>
        )}

        {/* Overall Retention Section */}
        <section className="mb-12 bg-slate-50 border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-800">Overall Platform Retention</h2>
            <div className="bg-violet-100 text-violet-700 px-4 py-2 rounded-lg font-semibold">
              Average: {overallData.avgRetention !== null ? `${overallData.avgRetention}%` : '—%'}
            </div>
          </div>
          
          {overallData.error ? (
            <p className="text-red-500">{overallData.error}</p>
          ) : overallData.message ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">{overallData.message}</p>
              <p className="text-sm text-yellow-700 mt-2">
                Retention requires at least 2 weeks of data. Keep using the platform and check back next week!
              </p>
            </div>
          ) : overallData.weeks.length === 0 ? (
            <p className="text-slate-600">No retention data available yet.</p>
          ) : (
            <>
              <BarChart data={overallData.weeks} title="Weekly Retention (%)" />
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600">Total Active Users</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {overallData.weeks[overallData.weeks.length - 1]?.activeUsers || 0}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600">Total Events (Last Week)</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {overallData.weeks[overallData.weeks.length - 1]?.eventCount || 0}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600">Current Week Retention</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {overallData.weeks[overallData.weeks.length - 1]?.retention !== null 
                      ? `${overallData.weeks[overallData.weeks.length - 1].retention}%` 
                      : overallData.weeks.length === 1 || overallData.weeks.filter(w => w.activeUsers > 0).length === 1
                        ? 'N/A (Need 2 weeks)'
                        : '—'}
                  </p>
                  {overallData.weeks[overallData.weeks.length - 1]?.retention === null && 
                   overallData.weeks.filter(w => w.activeUsers > 0).length === 1 && (
                    <p className="text-xs text-slate-500 mt-1">Retention requires 2+ weeks of data</p>
                  )}
                </div>
              </div>
            </>
          )}
        </section>

        {/* User-Specific Retention Section */}
        <section className="mb-12 bg-slate-50 border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-800">Your Retention</h2>
            <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold">
              Average: {userData.avgRetention !== null ? `${userData.avgRetention}%` : '—%'}
            </div>
          </div>

          {userData.error ? (
            <p className="text-red-500">{userData.error}</p>
          ) : userData.message ? (
            <p className="text-slate-600">{userData.message}</p>
          ) : userData.weeks.length === 0 ? (
            <p className="text-slate-600">No activity data for your account yet.</p>
          ) : (
            <>
              <BarChart data={userData.weeks} title="Your Weekly Activity Retention (%)" />
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600">Total Events (Last 8 Weeks)</p>
                  <p className="text-2xl font-bold text-slate-800">{userData.totalEvents}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600">Active Weeks</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {userData.weeks.filter(w => w.wasActive).length} / {userData.weeks.length}
                  </p>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}