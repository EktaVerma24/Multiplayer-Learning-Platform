import Message from '../models/Message.js';

export const saveMessage = async (req, res) => {
    try {
        const { classroomId, userId, message } = req.body;

        const newMessage = new Message({
            classroomId,
            user: userId, // Ensure this matches the lowercase 'user' field in your Message model
            message
        });

        // Save the message to the database
        await newMessage.save();

        // Populate the 'user' field with only the 'name' before sending the response
        const populatedMessage = await newMessage.populate('user', 'name');

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error("Error saving message:", error);
        // Respond with the specific validation error if it's a Mongoose validation failure
        if (error.name === 'ValidationError') {
             return res.status(400).json({ error: error.message, details: error.errors });
        }
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { classroomId } = req.params;

        const messages = await Message.find({ classroomId })
            .sort('timestamp') // Sort chronologically
            .populate('user', 'name') // Only include the user's name for display
            .lean(); // Use .lean() for faster query

        res.status(200).json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

export default {
    saveMessage,
    getMessages
};