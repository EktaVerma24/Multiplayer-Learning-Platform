import express from "express";
import Classroom from "../models/Classroom.js";

const router = express.Router();

// Create classroom
router.post("/", async (req, res) => {
  try {
    const classroom = await Classroom.create(req.body);
    res.status(201).json(classroom);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all classrooms
router.get("/", async (req, res) => {
  try {
    const classrooms = await Classroom.find().populate("teacher").populate("students");
    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
