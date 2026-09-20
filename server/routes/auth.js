import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { JWT_SECRET, verifyToken } from '../middleware/auth.js';
import { sendPasswordResetEmail } from '../utils/email.js';

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

// Helper function to reliably parse expiration timestamps across PostgreSQL, SQLite, and JS Date objects
function parseExpiryTimestamp(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (val instanceof Date) return val.getTime();
  const str = String(val).trim();
  if (/^\d+$/.test(str)) return parseInt(str, 10);
  let iso = str.replace(' ', 'T');
  if (!iso.endsWith('Z') && !iso.includes('+') && !iso.includes('-')) {
    iso += 'Z';
  }
  const parsed = new Date(iso).getTime();
  return isNaN(parsed) ? new Date(str).getTime() : parsed;
}

// 4. Request Password Reset Code
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email address is required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await db.get('SELECT id, full_name FROM users WHERE email = ?', [cleanEmail]);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'No account found with this email address. Please check the spelling or sign up.',
      });
    }

    // Generate 6-digit numeric reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    // Set 1-hour expiration timestamp
    const expiresAt = new Date(Date.now() + 3600000).toISOString();

    await db.run(
      'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
      [resetCode, expiresAt, user.id]
    );

    console.log(`[Forgot Password]: Generated code ${resetCode} for user ${user.id} (${cleanEmail}), expires at ${expiresAt}`);

    // Send email via Resend / SMTP (or console simulator if not configured)
    const emailResult = await sendPasswordResetEmail(cleanEmail, resetCode, user.full_name);

    const isRealEmailSent = emailResult && emailResult.success && emailResult.mode !== 'simulator';

    res.json({
      status: 'success',
      message: isRealEmailSent
        ? `A 6-digit password reset code has been sent to ${cleanEmail}.`
        : `Password reset code generated for ${cleanEmail}.`,
      ...(isRealEmailSent ? {} : { resetCode }),
    });
  } catch (err) {
    console.error('[Forgot Password Error]:', err);
    res.status(500).json({ status: 'error', message: 'Failed to process password reset request.' });
  }
});

// 5. Verify Password Reset Code
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and reset code are required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = String(code).trim();

    const user = await db.get('SELECT reset_password_token, reset_password_expires FROM users WHERE email = ?', [cleanEmail]);

    if (!user || !user.reset_password_token) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid password reset request or code.',
      });
    }

    const dbToken = String(user.reset_password_token).trim();
    if (dbToken !== cleanCode) {
      console.warn(`[Verify Code Mismatch]: Received code '${cleanCode}', stored code is '${dbToken}'`);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid verification code. Please check and try again.',
      });
    }

    const expiry = parseExpiryTimestamp(user.reset_password_expires);
    const now = Date.now();
    if (isNaN(expiry) || now > expiry) {
      console.warn(`[Verify Code Expired]: Expiry timestamp ${expiry} vs current timestamp ${now}`);
      return res.status(400).json({
        status: 'error',
        message: 'Password reset code has expired. Please request a new code.',
      });
    }

    res.json({
      status: 'success',
      message: 'Verification code is valid.',
    });
  } catch (err) {
    console.error('[Verify Reset Code Error]:', err);
    res.status(500).json({ status: 'error', message: 'Failed to verify reset code.' });
  }
});

// 6. Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Email, verification code, and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters long.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = String(code).trim();

    const user = await db.get('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    if (!user || !user.reset_password_token) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid password reset request.',
      });
    }

    const dbToken = String(user.reset_password_token).trim();
    if (dbToken !== cleanCode) {
      console.warn(`[Reset Password Mismatch]: Received code '${cleanCode}', stored code is '${dbToken}'`);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid verification code.',
      });
    }

    const expiry = parseExpiryTimestamp(user.reset_password_expires);
    const now = Date.now();
    if (isNaN(expiry) || now > expiry) {
      console.warn(`[Reset Password Expired]: Expiry timestamp ${expiry} vs current timestamp ${now}`);
      return res.status(400).json({
        status: 'error',
        message: 'Verification code has expired. Please request a new reset code.',
      });
    }

    // Hash new password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    // Update user password and clear reset token & expiration
    await db.run(
      'UPDATE users SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
      [password_hash, user.id]
    );

    // Issue new JWT token for auto-login
    const token = jwt.sign(
      { id: user.id, email: user.email, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      status: 'success',
      message: 'Password reset successfully! You are now logged in.',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        preferred_unit: user.preferred_unit || 'mg/dL',
      },
    });
  } catch (err) {
    console.error('[Reset Password Error]:', err);
    res.status(500).json({ status: 'error', message: 'Failed to reset password. Please try again.' });
  }
});

export default router;
