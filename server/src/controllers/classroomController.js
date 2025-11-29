// classroomController.js

import Classroom from "../models/Classroom.js";
import mongoose from 'mongoose';

export const createClassroom = async (req, res) => {
    try {
        // ✅ Use authenticated user's ID from protect middleware
        const teacherId = req.user._id;

        // ✅ Verify user is a teacher
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ error: "Only teachers can create classrooms" });
        }

        console.log("Teacher ID Retrieved:", teacherId);

        const classroomData = {
            ...req.body,
            teacher: teacherId,
        };
        delete classroomData.creatorId;

        console.log("Payload to Mongoose:", classroomData);

        // 1. Create the document
        let classroom = await Classroom.create(classroomData);
        
        // 🏆 FIX: Populate the 'teacher' field on the newly created document
        // This ensures the client receives the teacher's name immediately.
        classroom = await classroom.populate("teacher");
        
        res.status(201).json(classroom);
    } catch (err) {
        console.error("Mongoose Validation/Creation Error:", err.message); 
        
        if (err.name === 'ValidationError') {
            return res.status(400).json({ 
                message: "Validation failed: Check required fields (name, description) or data types.",
                error: err.message
            });
        }

        res.status(400).json({ 
            message: "Failed to create classroom due to an unexpected server error.",
            error: err.message
        });
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

// ---------------------------------------------------------------- //

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

export const banStudents = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { userId } = req.body;

    const requestingUserId = req.user._id;

    if(!userId) return res.status(400).json({ message: "User ID is required" });
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) return res.status(404).json({ message: "Classroom not found" });

    if (!classroom.teacher.equals(requestingUserId)) {
      return res.status(403).json({ message: "Only the classroom teacher can ban students" });
    }

    if(classroom.bannedUsers.includes(userId)) {
      return res.status(400).json({ message: "User is already banned" });
    }
    const banEntry = { userId };
    classroom.bannedUsers.push(banEntry);
    await classroom.save();
    res.json(classroom.bannedUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteClassroom = async (req, res) => {
    try {
        const { id } = req.params;
        
        const requestingUserId = req.user._id;
        
        const classroom = await Classroom.findById(id);
        if(!classroom){
            return res.status(404).json({ message: `No classroom with this id: ${id}` });
        }
        
        if (!classroom.teacher.equals(requestingUserId)) {
            return res.status(403).json({ message: "Only the classroom teacher can delete this classroom" });
        }
        
        const deletedClassroom = await Classroom.findByIdAndDelete(id);
        return res.status(200).send(deletedClassroom);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
