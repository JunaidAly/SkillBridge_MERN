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
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Skill name is required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if skill already exists
    if (user.skillsLearning.includes(name)) {
      return res.status(400).json({ message: 'Skill already exists' });
    }

    user.skillsLearning.push(name);
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

// Remove skill to learn
router.delete('/me/skills/learning/:skillName', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.skillsLearning = user.skillsLearning.filter(
      skill => skill !== req.params.skillName
    );
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
router.post('/me/certifications', authenticateToken, uploadCertification.single('file'), async (req, res) => {
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
      name,
      issuer: issuer || '',
      year: year || '',
      fileUrl: req.file ? req.file.path : '',
      filePublicId: req.file ? req.file.filename : '',
    };

    user.certifications.push(certification);
    await user.save();

    res.json({
      success: true,
      message: 'Certification added successfully',
      certifications: user.certifications,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
