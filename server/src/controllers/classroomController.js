import Classroom from "../models/Classroom.js";

export const createClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.create(req.body);
    res.status(201).json(classroom);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find().populate("teacher").populate("students");
    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export const getClassroomById = async (req, res) => {
  try {
    const { id } = req.params;
    const classroom = await Classroom.findById(id).populate("teacher").populate("students");
    if (!classroom) return res.status(404).json({ message: "Classroom not found" });
    res.json(classroom);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
