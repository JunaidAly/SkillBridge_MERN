import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

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

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
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

export default router;

