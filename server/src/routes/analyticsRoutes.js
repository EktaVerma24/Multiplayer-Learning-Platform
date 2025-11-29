// server/src/routes/analyticsRoutes.js
import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { ingestEvents, getWeeklyRetention, getUserWeeklyRetention, getInteractionSummary, seedDummyData, removeSeededData } from "../controllers/analyticsController.js";

const router = express.Router();

router.post("/events", protect, ingestEvents);
router.get("/weekly-retention", protect, getWeeklyRetention); // Overall (all users)
router.get("/user-retention", protect, getUserWeeklyRetention); // Current user
router.get("/interaction-summary", protect, getInteractionSummary);
router.post("/seed-dummy-data", protect, seedDummyData); // Seed dummy data for all users (includes current user)
router.delete("/seed-dummy-data", protect, removeSeededData); // Remove seeded dummy data

export default router;