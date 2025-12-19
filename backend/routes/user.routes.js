import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadAvatar, uploadCertification, deleteFromCloudinary } from '../config/cloudinary.js';

const router = express.Router();

// Get current user profile (full details)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        location: user.location,
        languages: user.languages,
        timezone: user.timezone,
        avatar: user.avatar,
        skillsTeaching: user.skillsTeaching,
        skillsLearning: user.skillsLearning,
        certifications: user.certifications,
        stats: user.stats,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { name, bio, location, languages, timezone } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (languages !== undefined) updateData.languages = languages;
    if (timezone !== undefined) updateData.timezone = timezone;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        location: user.location,
        languages: user.languages,
        timezone: user.timezone,
        avatar: user.avatar,
        skillsTeaching: user.skillsTeaching,
        skillsLearning: user.skillsLearning,
        certifications: user.certifications,
        stats: user.stats,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload avatar
router.post('/me/avatar', authenticateToken, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old avatar if exists
    if (user.avatarPublicId) {
      await deleteFromCloudinary(user.avatarPublicId);
    }

    // Update user with new avatar
    user.avatar = req.file.path;
    user.avatarPublicId = req.file.filename;
    await user.save();

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar: user.avatar,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete avatar
router.delete('/me/avatar', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.avatarPublicId) {
      await deleteFromCloudinary(user.avatarPublicId);
    }

    user.avatar = '';
    user.avatarPublicId = '';
    await user.save();

    res.json({
      success: true,
      message: 'Avatar deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add skill to teach
router.post('/me/skills/teaching', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Skill name is required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if skill already exists
    const exists = user.skillsTeaching.some(
      skill => skill.name.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      return res.status(400).json({ message: 'Skill already exists' });
    }

    user.skillsTeaching.push({ name, sessions: 0, rating: 0 });
    await user.save();

    res.json({
      success: true,
      message: 'Skill added successfully',
      skillsTeaching: user.skillsTeaching,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove skill to teach
router.delete('/me/skills/teaching/:skillId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.skillsTeaching = user.skillsTeaching.filter(
      skill => skill._id.toString() !== req.params.skillId
    );
    await user.save();

    res.json({
      success: true,
      message: 'Skill removed successfully',
      skillsTeaching: user.skillsTeaching,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add skill to learn
router.post('/me/skills/learning', authenticateToken, async (req, res) => {
  try {
    const { name, progress } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Skill name is required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if skill already exists (handle both object and legacy string formats)
    const exists = user.skillsLearning.some(skill => {
      const skillName = typeof skill === 'string' ? skill : skill.name;
      return skillName && skillName.toLowerCase() === name.toLowerCase();
    });
    if (exists) {
      return res.status(400).json({ message: 'Skill already exists' });
    }

    user.skillsLearning.push({ name, progress: progress || 0 });
    await user.save();

    res.json({
      success: true,
      message: 'Learning goal added successfully',
      skillsLearning: user.skillsLearning,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update learning skill progress
router.put('/me/skills/learning/:skillId', authenticateToken, async (req, res) => {
  try {
    const { progress } = req.body;
    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({ message: 'Progress must be between 0 and 100' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const skillIdParam = req.params.skillId;
    const skillIndex = user.skillsLearning.findIndex(skill => {
      // Handle object format with _id
      if (skill._id) {
        return skill._id.toString() === skillIdParam;
      }
      return false;
    });

    if (skillIndex === -1) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    user.skillsLearning[skillIndex].progress = progress;
    await user.save();

    res.json({
      success: true,
      message: 'Progress updated successfully',
      skillsLearning: user.skillsLearning,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove skill to learn
router.delete('/me/skills/learning/:skillId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const skillIdParam = req.params.skillId;

    // Handle both object format (with _id) and legacy string format
    user.skillsLearning = user.skillsLearning.filter(skill => {
      // If skill is an object with _id, compare _id
      if (skill._id) {
        return skill._id.toString() !== skillIdParam;
      }
      // If skill is a string (legacy format), compare the string directly
      return skill !== skillIdParam;
    });
    await user.save();

    res.json({
      success: true,
      message: 'Learning goal removed successfully',
      skillsLearning: user.skillsLearning,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add certification with file upload
// NOTE: multer/cloudinary errors happen *before* the async handler, so we wrap the upload
const uploadCertificationMiddleware = (req, res, next) => {
  uploadCertification.single('file')(req, res, (err) => {
    if (err) {
      console.error('Certification upload error:', err);
      // Multer errors (file size, invalid file, etc.)
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size too large. Maximum size is 10MB.' });
      }
      return res.status(500).json({
        message: err.message || 'Certification file upload failed',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      });
    }
    next();
  });
};

router.post('/me/certifications', authenticateToken, uploadCertificationMiddleware, async (req, res) => {
  try {
    const { name, issuer, year } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Certification name is required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const certification = {
      name: name.trim(),
      issuer: issuer ? issuer.trim() : '',
      year: year || '',
      // CloudinaryStorage puts the URL in req.file.path
      fileUrl: req.file ? (req.file.path || '') : '',
      // Cloudinary public id comes back as req.file.filename from multer-storage-cloudinary
      filePublicId: req.file ? (req.file.filename || '') : '',
      // Preserve original name + mimetype for proper downloads and rendering
      fileName: req.file?.originalname || '',
      fileMimeType: req.file?.mimetype || '',
    };

    user.certifications.push(certification);
    await user.save();

    res.json({
      success: true,
      message: 'Certification added successfully',
      certifications: user.certifications,
    });
  } catch (error) {
    console.error('Error adding certification:', error);
    res.status(500).json({
      message: error.message || 'Failed to add certification',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Download a certification file with correct filename/extension
router.get('/me/certifications/:certId/download', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const certification = user.certifications.find(
      (cert) => cert._id.toString() === req.params.certId
    );

    if (!certification || !certification.fileUrl) {
      return res.status(404).json({ message: 'Certification file not found' });
    }

    const upstream = await fetch(certification.fileUrl);
    if (!upstream.ok) {
      return res.status(502).json({ message: 'Failed to fetch file from storage provider' });
    }

    const contentType =
      upstream.headers.get('content-type') || certification.fileMimeType || 'application/octet-stream';

    // Prefer original filename, else derive from cert name
    let filename = certification.fileName?.trim() || `${certification.name || 'certificate'}`;

    // If filename looks like a Cloudinary public_id (common when original name wasn't stored), fall back to cert name
    const publicId = certification.filePublicId?.trim();
    if (publicId && filename === publicId) {
      filename = `${certification.name || 'certificate'}`;
    }
    // Add extension if missing (prefer stored mimetype, fallback to upstream Content-Type)
    const mimeForExt = certification.fileMimeType || contentType;
    if (!filename.includes('.') && mimeForExt) {
      const map = {
        'application/pdf': 'pdf',
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      };
      const ext = map[mimeForExt];
      if (ext) filename = `${filename}.${ext}`;
    }

    const disposition = req.query.disposition === 'inline' ? 'inline' : 'attachment';

    res.setHeader('Content-Type', contentType);
    // filename*= supports UTF-8; keep simple filename too for compatibility
    const safeName = filename.replace(/"/g, '');
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`
    );

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);
  } catch (error) {
    console.error('Error downloading certification:', error);
    res.status(500).json({ message: error.message || 'Failed to download certification' });
  }
});

// Remove certification
router.delete('/me/certifications/:certId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const certification = user.certifications.find(
      cert => cert._id.toString() === req.params.certId
    );

    // Delete file from Cloudinary if exists
    if (certification && certification.filePublicId) {
      const resourceType = certification.fileUrl.includes('.pdf') ? 'raw' : 'image';
      await deleteFromCloudinary(certification.filePublicId, resourceType);
    }

    user.certifications = user.certifications.filter(
      cert => cert._id.toString() !== req.params.certId
    );
    await user.save();

    res.json({
      success: true,
      message: 'Certification removed successfully',
      certifications: user.certifications,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users (admin only - you can add admin check middleware)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Download a certification file from another user's profile (public)
router.get('/:userId/certifications/:certId/download', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const certification = user.certifications.find(
      (cert) => cert._id.toString() === req.params.certId
    );

    if (!certification || !certification.fileUrl) {
      return res.status(404).json({ message: 'Certification file not found' });
    }

    const upstream = await fetch(certification.fileUrl);
    if (!upstream.ok) {
      return res.status(502).json({ message: 'Failed to fetch file from storage provider' });
    }

    const contentType =
      upstream.headers.get('content-type') || certification.fileMimeType || 'application/octet-stream';

    let filename = certification.fileName?.trim() || `${certification.name || 'certificate'}`;

    const publicId = certification.filePublicId?.trim();
    if (publicId && filename === publicId) {
      filename = `${certification.name || 'certificate'}`;
    }

    const mimeForExt = certification.fileMimeType || contentType;
    if (!filename.includes('.') && mimeForExt) {
      const map = {
        'application/pdf': 'pdf',
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      };
      const ext = map[mimeForExt];
      if (ext) filename = `${filename}.${ext}`;
    }

    const disposition = req.query.disposition === 'inline' ? 'inline' : 'attachment';

    res.setHeader('Content-Type', contentType);
    const safeName = filename.replace(/"/g, '');
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`
    );

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);
  } catch (error) {
    console.error('Error downloading certification:', error);
    res.status(500).json({ message: error.message || 'Failed to download certification' });
  }
});

// Get user by ID (public profile)
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        bio: user.bio,
        location: user.location,
        timezone: user.timezone,
        languages: user.languages,
        avatar: user.avatar,
        skillsTeaching: user.skillsTeaching,
        skillsLearning: user.skillsLearning,
        certifications: user.certifications,
        stats: user.stats,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
