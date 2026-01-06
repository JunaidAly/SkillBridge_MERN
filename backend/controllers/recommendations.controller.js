import axios from 'axios';
import User from '../models/User.js';

const RECOMMENDATION_SERVICE_URL = process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:8001';
const RECOMMENDATION_SERVICE_API_KEY = process.env.RECOMMENDATION_SERVICE_API_KEY || 'your-secret-api-key-here';

/**
 * Get AI-powered teacher recommendations for a student
 * @route GET /api/recommendations/me
 * @access Private (Student only)
 */
export const getMyRecommendations = async (req, res) => {
  try {
    // JWT contains { userId: ... } not { id: ... }
    const userId = req.user.userId || req.user.id || req.user._id;
    const limit = parseInt(req.query.limit) || 10;
    
    console.log('🔍 req.user:', req.user);
    console.log('🔍 Extracted userId:', userId);

    // Fetch full user data from database (JWT doesn't have skillsLearning)
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found in database for ID:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('✅ User found:', user.name);

    // Validate user has learning skills (is a student/learner)
    if (!user.skillsLearning || user.skillsLearning.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only users with learning skills can get recommendations. Please add skills you want to learn in your profile.'
      });
    }

    // Call Python recommendation service
    console.log('🔍 Requesting recommendations for user:', userId);
    const response = await axios.post(
      `${RECOMMENDATION_SERVICE_URL}/recommend`,
      {
        student_id: userId.toString(),
        limit: limit
      },
      {
        headers: {
          'X-API-Key': RECOMMENDATION_SERVICE_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    console.log('📡 Python service response:', JSON.stringify(response.data, null, 2));

    // Return recommendations
    res.status(200).json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('❌ Error getting recommendations:', error.message);
    if (error.response) {
      console.error('❌ Python service error status:', error.response.status);
      console.error('❌ Python service error data:', error.response.data);
    }

    // Handle specific errors
    if (error.response) {
      // Recommendation service returned an error
      const status = error.response.status;
      const message = error.response.data?.detail || 'Failed to get recommendations';

      if (status === 503) {
        return res.status(503).json({
          success: false,
          message: 'Recommendation service is not ready. Models need to be trained first.'
        });
      }

      if (status === 404) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      return res.status(500).json({
        success: false,
        message: message
      });
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'AI recommendation system is currently offline. Our team is working on it. Please check back later.'
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations. Please try again later.'
    });
  }
};

/**
 * Trigger model training (Admin only)
 * @route POST /api/recommendations/train
 * @access Private (Admin only)
 */
export const trainModels = async (req, res) => {
  try {
    // Validate user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can trigger model training'
      });
    }

    const forceRetrain = req.body.force_retrain || false;

    // Call Python recommendation service
    const response = await axios.post(
      `${RECOMMENDATION_SERVICE_URL}/train`,
      {
        force_retrain: forceRetrain
      },
      {
        headers: {
          'X-API-Key': RECOMMENDATION_SERVICE_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 2 minute timeout (training can take time)
      }
    );

    res.status(200).json({
      success: true,
      message: 'Model training completed successfully',
      data: response.data
    });

  } catch (error) {
    console.error('Error training models:', error.message);

    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data?.detail || 'Training failed'
      });
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'Recommendation service is unavailable'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to train models'
    });
  }
};

/**
 * Check recommendation service health
 * @route GET /api/recommendations/health
 * @access Private
 */
export const checkServiceHealth = async (req, res) => {
  try {
    const response = await axios.get(`${RECOMMENDATION_SERVICE_URL}/health`, {
      timeout: 5000
    });

    res.status(200).json({
      success: true,
      data: response.data
    });

  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Recommendation service is unavailable',
      error: error.message
    });
  }
};
