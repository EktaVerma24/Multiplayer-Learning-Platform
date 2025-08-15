import Classroom from "../models/Classroom.js";

const createClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.create(req.body);
    res.status(201).json(classroom);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find().populate("teacher").populate("students");
    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export { createClassroom , getAllClassrooms };