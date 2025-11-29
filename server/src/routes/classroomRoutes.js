import express from "express";
import { createClassroom, getAllClassrooms, getClassroomById, banStudents, deleteClassroom } from "../controllers/classroomController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createClassroom);

router.get("/", protect, getAllClassrooms);

router.get("/:id", protect, getClassroomById);

router.patch("/ban/:classroomId", protect, banStudents);

router.delete("/:id", protect, deleteClassroom);

export default router;
