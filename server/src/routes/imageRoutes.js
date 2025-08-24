import express from 'express';
import { getImageProxy } from '../controllers/noteController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/image-proxy', getImageProxy);

export default router;