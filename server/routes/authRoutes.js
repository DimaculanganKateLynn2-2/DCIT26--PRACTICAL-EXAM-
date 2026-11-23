const express = require('express');
const bcrypt = require('bcryptjs');
const { rateLimit } = require('express-rate-limit');
const User = require('../models/User');
const Session = require('../models/Session');
const { createSession, requireAuth, requireCsrf, clearSessionCookie } = require('../middleware/auth');

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Try again later.' },
});

function validEmail(email) {
  return typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 80 ||
        !validEmail(email) || typeof password !== 'string' || password.length < 12 || password.length > 128) {
      return res.status(400).json({ message: 'Enter a name, valid email and password of 12–128 characters.' });
    }
    const normalizedEmail = email.toLowerCase().trim();
    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({ message: 'Email is already registered.' });
    }
    const user = await User.create({
      name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12),
    });
    res.status(201).json(await createSession(res, user));
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Email is already registered.' });
    next(error);
  }
});

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!validEmail(email) || typeof password !== 'string') {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }
    res.json(await createSession(res, user));
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({
    user: { id: String(req.user._id), name: req.user.name, email: req.user.email },
    csrfToken: req.session.csrfToken,
  });
});

router.post('/logout', requireAuth, requireCsrf, async (req, res, next) => {
  try {
    await Session.deleteOne({ _id: req.session._id });
    clearSessionCookie(res);
    res.json({ message: 'Logged out.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
