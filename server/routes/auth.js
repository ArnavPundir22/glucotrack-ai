import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { JWT_SECRET, verifyToken } from '../middleware/auth.js';
import { generateCaptcha, verifyCaptchaToken } from '../utils/captcha.js';

const router = express.Router();

// 1. User Sign Up (Registration)
router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name, preferred_unit = 'mg/dL' } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({
        status: 'error',
        message: 'Full name, email, and password are required for registration.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await db.run(
      `INSERT INTO users (id, email, password_hash, full_name, target_low_mgdl, target_high_mgdl, preferred_unit)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, cleanEmail, password_hash, full_name.trim(), 70, 180, preferred_unit]
    );

    // Issue JWT Token
    const token = jwt.sign(
      { id: userId, email: cleanEmail, full_name: full_name.trim() },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      status: 'success',
      message: 'Account created successfully.',
      token,
      user: {
        id: userId,
        email: cleanEmail,
        full_name: full_name.trim(),
        preferred_unit,
      },
    });
  } catch (err) {
    console.error('[Auth Signup Error]:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create user account.' });
  }
});

// 2. User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await db.get('SELECT * FROM users WHERE email = ?', [cleanEmail]);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.',
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash || '');
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.',
      });
    }

    // Issue JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      status: 'success',
      message: 'Authenticated successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        preferred_unit: user.preferred_unit || 'mg/dL',
      },
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err);
    res.status(500).json({ status: 'error', message: 'Failed to authenticate user.' });
  }
});

// 3. Get Current User Profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await db.get(
      'SELECT id, email, full_name, target_low_mgdl, target_high_mgdl, preferred_unit, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User profile not found.' });
    }

    res.json({
      status: 'success',
      user,
    });
  } catch (err) {
    console.error('[Auth Me Error]:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch user profile.' });
  }
});

// 3b. Generate Visual Anti-Bot Captcha
router.get('/captcha', (req, res) => {
  try {
    const captcha = generateCaptcha();
    res.json({
      status: 'success',
      captchaSvg: captcha.svg,
      captchaDataUrl: captcha.dataUrl,
      captchaToken: captcha.captchaToken,
    });
  } catch (err) {
    console.error('[Captcha Generation Error]:', err);
    res.status(500).json({ status: 'error', message: 'Failed to generate visual captcha challenge.' });
  }
});

// 3c. Instant Captcha-Verified Password Reset
router.post('/reset-password-captcha', async (req, res) => {
  try {
    const { email, captchaToken, captchaAnswer, newPassword } = req.body;

    if (!email || !captchaToken || !captchaAnswer || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Email, visual captcha code, and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters long.',
      });
    }

    // 1. Verify Captcha
    const isCaptchaValid = verifyCaptchaToken(captchaToken, captchaAnswer);
    if (!isCaptchaValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Incorrect security captcha code. Please try again with the refreshed code.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Find User
    const user = await db.get('SELECT * FROM users WHERE email = ?', [cleanEmail]);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'No account found with this email address. Please check the spelling or sign up.',
      });
    }

    // 3. Hash New Password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    // 4. Update Database
    await db.run(
      'UPDATE users SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
      [password_hash, user.id]
    );

    console.log(`[Captcha Password Reset Success]: Updated password for user ${user.id} (${cleanEmail})`);

    // 5. Issue JWT Token for Auto Login
    const token = jwt.sign(
      { id: user.id, email: user.email, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      status: 'success',
      message: 'Your password has been reset successfully! You are now logged in.',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        preferred_unit: user.preferred_unit || 'mg/dL',
      },
    });
  } catch (err) {
    console.error('[Captcha Reset Password Error]:', err);
    res.status(500).json({ status: 'error', message: 'Failed to reset password. Please try again.' });
  }
});

export default router;
