import React, { useState } from "react";
import { motion } from "framer-motion";

export default function JobSearch() {
  const [query, setQuery] = useState("developer");
  const [city, setCity] = useState("Delhi");
  const [country, setCountry] = useState("in");
  const [datePosted, setDatePosted] = useState("all");
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);


  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://jsearch.p.rapidapi.com/search?query=${query} in ${city}&page=${page}&num_pages=1&country=${country}&date_posted=${datePosted}`,
        {
          method: "GET",
          headers: {
            "X-RapidAPI-Key": import.meta.env.VITE_RAPIDAPI_KEY,
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
          },
        }
      );
      const data = await response.json();
      setJobs(data.data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[300px]">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl font-bold text-center mb-8 text-gray-800"
     >
        Find <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-pink-500">Jobs</span>
      </motion.h1>

      {/* Search Filters */}
      <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur-md rounded-2xl shadow-md p-6 mb-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchJobs();
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Job Title (e.g., Developer)"
            className="p-3 rounded-xl shadow-sm focus:ring-violet-400 outline-none bg-white/70"
          />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City (e.g., Delhi)"
            className="p-3 rounded-xl shadow-sm focus:ring-violet-400 outline-none bg-white/70"
          />
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="p-3 cursor-pointer rounded-xl shadow-sm focus:ring-violet-400 outline-none bg-white/70"
          >
            <option value="in">India</option>
            <option value="us">USA</option>
            <option value="ca">Canada</option>
            <option value="uk">UK</option>
          </select>
          <select
            value={datePosted}
            onChange={(e) => setDatePosted(e.target.value)}
            className="p-3 cursor-pointer rounded-xl shadow-sm focus:ring-violet-400 outline-none bg-white/70"
          >
            <option value="all">All</option>
            <option value="today">Last 24 hours</option>
            <option value="3days">Last 3 days</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
          </select>
          <input
            type="number"
            value={page}
            onChange={(e) => setPage(e.target.value)}
            placeholder="Page"
            className="p-3 rounded-xl shadow-sm focus:ring-violet-400 outline-none bg-white/70"
          />

          <button
            type="submit"
            className=" cursor-pointer col-span-1 md:col-span-2 mt-4 w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90 transition"
          >
            {loading ? "Searching..." : "Search Jobs"}
          </button>
        </form>
      </div>

      {/* Job Results */}
      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {jobs.map((job, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-sm hover:shadow-md transition transform hover:scale-[1.02]"
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-lg font-semibold text-gray-800">
                {job.job_title.length > 30 ? `${job.job_title.slice(0, 30)} . . .` : job.job_title}
              </h2>
              <span className="bg-green-100 text-green-600 text-xs font-medium px-3 py-1 rounded-full">
                {job.job_employment_type || "Full-time"}
              </span>
            </div>
            <p className="text-gray-600 text-sm">{job.employer_name}</p>
            <p className="text-gray-400 text-sm">Source: {job.job_publisher || "Unknown Portal"}</p>
            <p className="text-gray-400 text-sm mb-4">
              {job.job_city == null ? "Unknown City" : job.job_city} , {job.job_country == null ? "Unknown Country" : job.job_country}
            </p>
            <a
              href={job.job_apply_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-5 py-2 rounded-full text-white text-sm font-medium bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90 transition"
            >
              Apply Now
            </a>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
