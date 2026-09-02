import User from '../models/User.js';

// Must run after authenticateToken. The JWT payload only carries userId, not
// role, so admin status has to be looked up from the database on each request.
export const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('role');
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.user.role = user.role;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
