// client/src/api/analytics.js
import axios from "axios";

// Dedicated axios instance that does NOT use the global 401 redirect
const AnalyticsAPI = axios.create({ baseURL: "http://localhost:5000/api" });

let queue = [];
let timer = null;

export function track(eventType, context = {}, extras = {}) {
  // Skip if not authenticated
  const token = localStorage.getItem("token");
  if (!token) return;
  queue.push({
    eventType,
    context,
    durationMs: extras.durationMs || 0,
    ts: new Date().toISOString(),
  });
  if (!timer) {
    timer = setTimeout(flush, 3000); // batch every 3s
  }
}

async function flush() {
  const batch = queue;
  queue = [];
  clearTimeout(timer);
  timer = null;
  try {
    if (!batch.length) return;
    const token = localStorage.getItem("token");
    if (!token) return; // nothing to send if unauthenticated
    await AnalyticsAPI.post("/analytics/events", batch, {
      headers: { Authorization: `Bearer ${token}` },
      // Never throw on 401 for analytics
      validateStatus: () => true,
    });
  } catch (e) {
    // ignore to avoid UX degradation
    console.error("analytics flush failed", e);
  }
}