import express from 'express';
import passport from '../config/passport.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Google OAuth login
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign(
      { userId: req.user._id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Redirect to frontend with token
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendURL}/auth/callback?token=${token}`);
  }
);

// Logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
