import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // A suspended user's JWT stays technically valid until it expires, so an
    // admin block wouldn't take effect until then without this check - the
    // socket kick (see server.js) handles the same-session case immediately,
    // this covers every other request (new tabs, page loads, API calls).
    try {
      const dbUser = await User.findById(user.userId).select('isSuspended');
      if (dbUser?.isSuspended) {
        return res.status(403).json({
          message: 'Your account has been suspended. Contact support for help.',
          code: 'ACCOUNT_SUSPENDED',
        });
      }
    } catch (e) {
      return res.status(500).json({ message: 'Auth check failed' });
    }

    req.user = user;
    next();
  });
};

