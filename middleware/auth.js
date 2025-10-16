import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateToken = async (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return { user: null };
  }

  const token = authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return { user: null };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return { user: null };
    }

    return { user };
  } catch (error) {
    console.error('Token verification error:', error.message);
    return { user: null };
  }
};
