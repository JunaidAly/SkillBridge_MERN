import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { uploadVerificationDoc } from '../config/cloudinary.js';
import { submitVerification } from '../controllers/verification.controller.js';

const router = express.Router();

// NOTE: multer/cloudinary errors happen *before* the async handler, so we wrap the upload
// (same pattern as routes/user.routes.js's certification upload)
const uploadVerificationDocsMiddleware = (req, res, next) => {
  uploadVerificationDoc.array('docs', 5)(req, res, (err) => {
    if (err) {
      console.error('Verification doc upload error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size too large. Maximum size is 10MB.' });
      }
      return res.status(500).json({ message: err.message || 'Document upload failed' });
    }
    next();
  });
};

router.post('/submit', authenticateToken, uploadVerificationDocsMiddleware, submitVerification);

export default router;
