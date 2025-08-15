import express from "express";
import { createClassroom , getAllClassrooms } from "../controllers/classroomController.js";

const router = express.Router();

// Create classroom
router.post("/", createClassroom);

// Get all classrooms
router.get("/", getAllClassrooms);

export default router;
