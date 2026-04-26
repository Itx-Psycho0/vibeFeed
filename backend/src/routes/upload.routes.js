import { uploadFile } from '../controllers/upload.controller.js';
import auth from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import express from 'express';

const router = express.Router();

router.post('/', auth, upload.single('file'), uploadFile);

export default router;
