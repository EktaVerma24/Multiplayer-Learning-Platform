import express from 'express';
import messageController from '../controllers/messageController.js'; 
import { protect } from '../middlewares/authMiddleware.js'; 

const {saveMessage, getMessages} = messageController;

const router = express.Router();

router.get('/:classroomId', protect, getMessages);
router.post('/', protect, saveMessage);

export default router;