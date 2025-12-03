// server/src/controllers/analyticsController.js
import Event from "../models/Events.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// Ingest events (single or batch)
export const ingestEvents = async (req, res) => {
  const userId = req.user._id;
  const payload = Array.isArray(req.body) ? req.body : [req.body];
  const docs = payload.map(e => ({
    user: userId,
    eventType: e.eventType,
    context: e.context || {},
    durationMs: e.durationMs || 0,
    ts: e.ts ? new Date(e.ts) : new Date(),
  }));
  await Event.insertMany(docs, { ordered: false });
  res.status(204).send();
};

// Helper function to get week start (Sunday-based week)
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = d.getDate() - day; // days to subtract to get to Sunday
  const weekStart = new Date(d);
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

// Rolling weekly retention and averages - OVERALL (all users)
export const getWeeklyRetention = async (req, res) => {
  try {
    const weeks = Number(req.query.weeks || 8); // last 8 weeks
    const cutoffDate = new Date(Date.now() - (weeks + 1) * 7 * 24 * 60 * 60 * 1000);

    // Get all events in the time range
    const events = await Event.find({ ts: { $gte: cutoffDate } })
      .select('user ts')
      .lean();

    if (!events || events.length === 0) {
      return res.json({ 
        weeks: [], 
        avgRetention: null,
        message: "No data available yet. Start using the platform to see retention metrics." 
      });
    }

    // Group events by week
    const weeksMap = new Map();
    events.forEach(event => {
      const weekStart = getWeekStart(event.ts);
      const weekKey = weekStart.toISOString();
      if (!weeksMap.has(weekKey)) {
        weeksMap.set(weekKey, {
          week: weekStart,
          users: new Set(),
          eventCount: 0
        });
      }
      weeksMap.get(weekKey).users.add(String(event.user));
      weeksMap.get(weekKey).eventCount++;
    });

    // Convert to array and sort by week
    const weeksData = Array.from(weeksMap.entries())
      .map(([key, value]) => ({
        week: value.week,
        users: Array.from(value.users),
        activeUsers: value.users.size,
        eventCount: value.eventCount
      }))
      .sort((a, b) => a.week - b.week);

    // Fill in missing weeks to ensure we always show exactly `weeks` weeks
    const allWeeks = [];
    const today = new Date();
    const dataMap = new Map(weeksData.map(w => [w.week.toISOString(), w]));
    
    for (let i = weeks; i >= 0; i--) {
      const weekStart = getWeekStart(new Date(today.getTime() - i * 7 * 24 * 60 * 60 * 1000));
      const weekKey = weekStart.toISOString();
      const existing = dataMap.get(weekKey);
      allWeeks.push(existing || {
        week: weekStart,
        users: [],
        activeUsers: 0,
        eventCount: 0
      });
    }

    // Compute retention% = |users_this ∩ users_prev| / |users_prev|
    const enriched = allWeeks.map((w, idx, arr) => {
      if (idx === 0) return { ...w, retention: null };
      const prev = arr[idx - 1];
      
      // If previous week had no users, retention is N/A
      if (prev.activeUsers === 0) {
        return { ...w, retention: null };
      }
      
      // If current week has no data but previous week had users, retention is 0%
      if (w.activeUsers === 0) {
        return { ...w, retention: 0 };
      }
      
      const prevSet = new Set(prev.users);
      const intersection = w.users.filter(u => prevSet.has(u)).length;
      const retention = prev.activeUsers > 0 
        ? Math.round((intersection / prev.activeUsers) * 100) 
        : null;
      return { ...w, retention };
    });

    const recent = enriched.slice(-weeks);
    const retentionValues = recent.map(r => r.retention).filter(v => typeof v === "number");
    const avgRetention = retentionValues.length
      ? Math.round(retentionValues.reduce((a, b) => a + b, 0) / retentionValues.length)
      : null;

    // Debug logging (can remove later)
    console.log(`Retention calculation: Found ${weeksData.length} weeks with data, showing ${recent.length} weeks`);
    console.log(`Recent weeks retention values:`, recent.map(w => ({ week: w.week.toISOString().split('T')[0], retention: w.retention })));
    
    res.json({ 
      weeks: recent.map(w => ({
        week: w.week instanceof Date ? w.week.toISOString() : w.week,
        activeUsers: w.activeUsers,
        eventCount: w.eventCount,
        retention: w.retention
      })), 
      avgRetention 
    });
  } catch (error) {
    console.error("Error getting weekly retention:", error);
    res.status(500).json({ error: "Failed to fetch retention data" });
  }
};

// User-specific weekly retention
export const getUserWeeklyRetention = async (req, res) => {
  try {
    const userId = req.user._id;
    const weeks = Number(req.query.weeks || 8);
    const cutoffDate = new Date(Date.now() - (weeks + 1) * 7 * 24 * 60 * 60 * 1000);

    // Get user's events
    const events = await Event.find({ 
      user: userId, 
      ts: { $gte: cutoffDate } 
    })
      .select('ts eventType')
      .lean();

    if (!events || events.length === 0) {
      return res.json({ 
        weeks: [], 
        avgRetention: null,
        totalEvents: 0,
        message: "No activity data for this user yet." 
      });
    }

    // Group by week
    const weeksMap = new Map();
    events.forEach(event => {
      const weekStart = getWeekStart(event.ts);
      const weekKey = weekStart.toISOString();
      if (!weeksMap.has(weekKey)) {
        weeksMap.set(weekKey, {
          week: weekStart,
          eventCount: 0,
          eventTypes: {}
        });
      }
      weeksMap.get(weekKey).eventCount++;
      weeksMap.get(weekKey).eventTypes[event.eventType] = 
        (weeksMap.get(weekKey).eventTypes[event.eventType] || 0) + 1;
    });

    const weeksData = Array.from(weeksMap.entries())
      .map(([key, value]) => ({
        week: value.week.toISOString(),
        eventCount: value.eventCount,
        eventTypes: value.eventTypes,
        wasActive: true // user was active this week
      }))
      .sort((a, b) => new Date(a.week) - new Date(b.week));

    // Fill in missing weeks to ensure we always show exactly `weeks` weeks
    const allWeeks = [];
    const today = new Date();
    const dataMap = new Map(weeksData.map(w => [w.week, w]));
    
    for (let i = weeks; i >= 0; i--) {
      const weekStart = getWeekStart(new Date(today.getTime() - i * 7 * 24 * 60 * 60 * 1000));
      const weekKey = weekStart.toISOString();
      const existing = dataMap.get(weekKey);
      allWeeks.push(existing || {
        week: weekKey,
        eventCount: 0,
        eventTypes: {},
        wasActive: false
      });
    }

    // Calculate retention: did user return this week after being active last week?
    const enriched = allWeeks.map((w, idx, arr) => {
      if (idx === 0) return { ...w, retention: null };
      const prev = arr[idx - 1];
      
      // If previous week user was not active, retention is N/A
      if (!prev.wasActive) {
        return { ...w, retention: null };
      }
      
      // If previous week was active: 100% if returned, 0% if not
      const retention = w.wasActive ? 100 : 0;
      return { ...w, retention };
    });

    const recent = enriched.slice(-weeks);
    const retentionValues = recent.map(r => r.retention).filter(v => typeof v === "number");
    const avgRetention = retentionValues.length
      ? Math.round(retentionValues.reduce((a, b) => a + b, 0) / retentionValues.length)
      : null;

    res.json({ 
      weeks: recent, 
      avgRetention,
      totalEvents: events.length
    });
  } catch (error) {
    console.error("Error getting user weekly retention:", error);
    res.status(500).json({ error: "Failed to fetch user retention data" });
  }
};

// Per-student interaction summary
export const getInteractionSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const since = req.query.since ? new Date(req.query.since) : new Date(Date.now() - 7*24*60*60*1000);
    const stats = await Event.aggregate([
      { $match: { user: userId, ts: { $gte: since } } },
      { $group: {
        _id: "$eventType",
        count: { $sum: 1 },
        durationMs: { $sum: "$durationMs" }
      }},
    ]);
    res.json({ stats, since });
  } catch (error) {
    console.error("Error getting interaction summary:", error);
    res.status(500).json({ error: "Failed to fetch interaction summary" });
  }
};

// Get student interaction network for a classroom
export const getStudentInteractions = async (req, res) => {
  try {
    const { classroomId } = req.params;
    
    const interactions = await Event.find({
      eventType: 'chat_send',
      'context.classroomId': classroomId,
      'context.extra.interactionWith': { $exists: true, $ne: null },
      'context.extra.isReply': true
    })
    .populate('user', 'name email role')
    .sort({ ts: -1 });

    // Build interaction graph
    const graph = {};
    const userMap = {};
    
    interactions.forEach(event => {
      const userId = event.user._id.toString();
      const partnerId = event.context.extra.interactionWith;
      
      userMap[userId] = event.user.name;
      
      if (!graph[userId]) graph[userId] = {};
      if (!graph[userId][partnerId]) graph[userId][partnerId] = 0;
      
      graph[userId][partnerId]++;
    });

    // Convert to network format
    const nodes = Object.keys(userMap).map(id => ({
      id,
      name: userMap[id]
    }));
    
    const edges = [];
    for (const [source, targets] of Object.entries(graph)) {
      for (const [target, weight] of Object.entries(targets)) {
        edges.push({ 
          source, 
          target, 
          weight,
          label: `${weight} ${weight === 1 ? 'reply' : 'replies'}`
        });
      }
    }

    res.json({ 
      nodes, 
      edges, 
      totalInteractions: interactions.length,
      interactions: interactions.slice(0, 50) // Last 50 interactions
    });
  } catch (error) {
    console.error("Error fetching student interactions:", error);
    res.status(500).json({ error: error.message });
  }
};

// Seed dummy analytics data for testing
export const seedDummyData = async (req, res) => {
  try {
    // Get all users from database
    const users = await User.find().select('_id role').lean();
    
    if (users.length === 0) {
      return res.status(400).json({ 
        error: "No users found. Please create at least one user account first." 
      });
    }

    const userIds = users.map(u => u._id);
    const currentUserId = String(req.user._id); // Ensure current user is always included
    const eventTypes = ['page_view', 'chat_send', 'wb_edit', 'quiz_submit', 'challenge_run', 'notes_generate', 'session_heartbeat'];
    const pages = ['/dashboard', '/classroom/123', '/create-quiz/123', '/attemptchallenge/456'];
    
    // Generate events for the last 10 weeks
    const weeksToGenerate = 10;
    const events = [];
    const today = new Date();
    
    // Track which users are active each week (for realistic retention simulation)
    const weeklyActiveUsers = new Map(); // weekKey -> Set of userIds
    
    for (let weekOffset = weeksToGenerate; weekOffset >= 0; weekOffset--) {
      const weekStart = getWeekStart(new Date(today.getTime() - weekOffset * 7 * 24 * 60 * 60 * 1000));
      const weekKey = weekStart.toISOString();
      
      // Determine which users are active this week
      // Create realistic retention: some users drop off, some stay active
      let activeUsersThisWeek = new Set();
      
      if (weekOffset === weeksToGenerate) {
        // First week: all users active
        userIds.forEach(id => activeUsersThisWeek.add(String(id)));
      } else {
        // Subsequent weeks: retention pattern
        const prevWeekKey = getWeekStart(new Date(today.getTime() - (weekOffset + 1) * 7 * 24 * 60 * 60 * 1000)).toISOString();
        const prevActiveUsers = weeklyActiveUsers.get(prevWeekKey) || new Set();
        
        // Simulate retention rates: 70-90% return each week
        const retentionRate = 0.75 + Math.random() * 0.15; // 75-90%
        prevActiveUsers.forEach(userId => {
          if (Math.random() < retentionRate) {
            activeUsersThisWeek.add(userId);
          }
        });
        
        // Add some new users (10-20% of inactive users)
        const inactiveUsers = userIds.filter(id => !prevActiveUsers.has(String(id)));
        const newUsersCount = Math.floor(inactiveUsers.length * (0.1 + Math.random() * 0.1));
        for (let i = 0; i < newUsersCount && i < inactiveUsers.length; i++) {
          activeUsersThisWeek.add(String(inactiveUsers[i]));
        }
      }
      
      // 🔥 IMPORTANT: Always ensure current user is active (for good personal retention)
      activeUsersThisWeek.add(currentUserId);
      
      weeklyActiveUsers.set(weekKey, activeUsersThisWeek);
      
      // Generate events for each active user this week
      activeUsersThisWeek.forEach(userIdStr => {
        const userId = new mongoose.Types.ObjectId(userIdStr);
        // Current user gets more events to show higher engagement
        const isCurrentUser = userIdStr === currentUserId;
        const eventsPerUser = isCurrentUser 
          ? 15 + Math.floor(Math.random() * 10) // 15-25 events for current user (high engagement)
          : 5 + Math.floor(Math.random() * 15); // 5-20 events for other users
        
        for (let i = 0; i < eventsPerUser; i++) {
          const dayOffset = Math.floor(Math.random() * 7); // Random day in the week
          const hour = Math.floor(Math.random() * 12) + 8; // Between 8 AM and 8 PM
          const minute = Math.floor(Math.random() * 60);
          
          const eventDate = new Date(weekStart);
          eventDate.setDate(eventDate.getDate() + dayOffset);
          eventDate.setHours(hour, minute, 0, 0);
          
          const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
          const page = pages[Math.floor(Math.random() * pages.length)];
          
          events.push({
            user: userId,
            eventType: eventType,
            context: {
              page: page,
              extra: { test: true }
            },
            durationMs: eventType === 'page_view' ? Math.floor(Math.random() * 300000) : 0, // 0-5 minutes
            ts: eventDate
          });
        }
      });
    }
    
    // Clear existing events (optional - comment out if you want to keep existing data)
    await Event.deleteMany({ 'context.extra.test': true });
    
    // Insert all events
    if (events.length > 0) {
      await Event.insertMany(events, { ordered: false });
    }
    
    res.json({ 
      message: `Successfully seeded ${events.length} dummy events across ${weeksToGenerate} weeks`,
      eventsCreated: events.length,
      weeks: weeksToGenerate,
      users: userIds.length
    });
  } catch (error) {
    console.error("Error seeding dummy data:", error);
    res.status(500).json({ error: "Failed to seed dummy data", details: error.message });
  }
};

// Remove seeded dummy analytics data
export const removeSeededData = async (req, res) => {
  try {
    // Delete all events marked as test data
    const result = await Event.deleteMany({ 'context.extra.test': true });
    
    res.json({ 
      message: `Successfully removed ${result.deletedCount} seeded events`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Error removing seeded data:", error);
    res.status(500).json({ error: "Failed to remove seeded data", details: error.message });
  }
};