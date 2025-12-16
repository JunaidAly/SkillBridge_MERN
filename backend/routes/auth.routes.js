import express from 'express';
import User from '../models/User.js';
import VerificationCode from '../models/VerificationCode.js';
import jwt from 'jsonwebtoken';
import { sendVerificationCode } from '../utils/emailService.js';

const router = express.Router();

// Generate 6-digit code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
    });

    // Generate and send verification code
    const code = generateCode();
    await VerificationCode.create({
      email: user.email,
      code,
      userId: user._id,
      purpose: 'signup',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await sendVerificationCode(user.email, code);

    // Return success but require verification
    res.status(201).json({
      success: true,
      requiresVerification: true,
      email: user.email,
      message: 'Verification code sent to your email',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate and send verification code
    const code = generateCode();
    await VerificationCode.create({
      email: user.email,
      code,
      userId: user._id,
      purpose: 'login',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await sendVerificationCode(user.email, code);

    // Return success but require verification
    res.json({
      success: true,
      requiresVerification: true,
      email: user.email,
      message: 'Verification code sent to your email',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Google OAuth
router.post('/google', async (req, res) => {
  try {
    const { credential, tokenId, email, name, googleId, sub } = req.body;

    if (!email || !name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const userId = googleId || sub || tokenId || credential;

    // Check if user exists
    let user = await User.findOne({ 
      $or: [{ email }, { googleId: userId }] 
    });

    if (user) {
      // Update googleId if not set
      if (!user.googleId && userId) {
        user.googleId = userId;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        googleId: userId,
        password: undefined, // OAuth users don't need password
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Facebook OAuth
router.post('/facebook', async (req, res) => {
  try {
    const { accessToken, email, name, facebookId, userID } = req.body;

    if (!email || !name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const fbId = facebookId || userID;

    // Check if user exists
    let user = await User.findOne({ 
      $or: [{ email }, { facebookId: fbId }] 
    });

    if (user) {
      // Update facebookId if not set
      if (!user.facebookId && fbId) {
        user.facebookId = fbId;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        facebookId: fbId,
        password: undefined, // OAuth users don't need password
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify code and complete authentication
router.post('/verify', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    // Find valid verification code
    const verification = await VerificationCode.findOne({
      email: email.toLowerCase().trim(),
      code: code.trim(),
      verified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!verification) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Mark as verified
    verification.verified = true;
    await verification.save();

    // Get user
    const user = await User.findById(verification.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Resend verification code
router.post('/resend-code', async (req, res) => {
  try {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
      return res.status(400).json({ message: 'Email and purpose are required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Invalidate old codes for this email and purpose
    await VerificationCode.updateMany(
      { email: email.toLowerCase().trim(), purpose, verified: false },
      { verified: true }
    );

    // Generate new code
    const code = generateCode();
    await VerificationCode.create({
      email: user.email,
      code,
      userId: user._id,
      purpose,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await sendVerificationCode(user.email, code);

    res.json({
      success: true,
      message: 'Verification code resent to your email',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

