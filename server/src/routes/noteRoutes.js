// server/src/routes/noteRoutes.js
import express from 'express';
import { generateNotes, getNotes, getImageProxy, generateSummary } from '../controllers/noteController.js';
import { protect } from '../middlewares/authMiddleware.js'; // ⬅️ Import your middleware

const router = express.Router();

// This secures the route for getting notes (GET /api/notes)
router.get('/:id', getNotes);

// This secures the route for creating notes (POST /api/notes/generate)
router.post('/generate', protect, generateNotes);

router.post('/summarize', protect, generateSummary);

//image 
router.get('/image-proxy', getImageProxy);

export default router;