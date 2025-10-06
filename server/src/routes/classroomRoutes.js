import express from "express";
import { createClassroom, getAllClassrooms, getClassroomById, banStudents } from "../controllers/classroomController.js";

const router = express.Router();

// Create classroom
router.post("/", createClassroom);

// Get all classrooms
router.get("/", getAllClassrooms);

// Get a single classroom by ID
router.get("/:id", getClassroomById);

router.patch("/ban/:classroomId", banStudents);

export default router;
