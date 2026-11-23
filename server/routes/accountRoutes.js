'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { rateLimit } = require('express-rate-limit');
const User = require('../models/User');
const Session = require('../models/Session');
const Pet = require('../models/Pet');
const HealthRecord = require('../models/HealthRecord');
const AssessmentDraft = require('../models/AssessmentDraft');
const { clearSessionCookie } = require('../middleware/auth');

// Mounted under /api/account with requireAuth and requireCsrf in server.js.
const router = express.Router();
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many account attempts. Try again later.' },
});

router.patch('/profile', async (req, res, next) => {
  try {
    const name = req.body?.name;
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) {
      return res.status(400).json({ message: 'Enter an account name of 1–80 characters.' });
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $set: { name: name.trim() } },
      { new: true, runValidators: true });
    if (!user) return res.status(401).json({ message: 'Account no longer exists.' });
    return res.json({ user: { id: String(user._id), name: user.name, email: user.email } });
  } catch (error) { next(error); }
});

router.post('/password', sensitiveLimiter, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' ||
        newPassword.length < 12 || newPassword.length > 128 || currentPassword === newPassword) {
      return res.status(400).json({ message: 'Enter the current password and a different new password of 12–128 characters.' });
    }
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(403).json({ message: 'Current password is incorrect.' });
    }
    await User.updateOne({ _id: user._id }, { $set: { passwordHash: await bcrypt.hash(newPassword, 12) } });
    // End all sessions so the new password is required for future access.
    await Session.deleteMany({ user: user._id });
    clearSessionCookie(res);
    return res.json({ message: 'Password changed. Please log in again.', signedOut: true });
  } catch (error) { next(error); }
});

router.delete('/me', sensitiveLimiter, async (req, res, next) => {
  try {
    const { currentPassword, confirmation } = req.body || {};
    if (confirmation !== 'DELETE' || typeof currentPassword !== 'string' || !currentPassword) {
      return res.status(400).json({ message: 'Enter your current password and type DELETE exactly.' });
    }
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(403).json({ message: 'Current password is incorrect.' });
    }
    // Atomic deletion: if a database operation fails, no partial deletion is committed.
    // The MongoDB deployment must support replica-set transactions.
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const owner = user._id;
        await HealthRecord.deleteMany({ owner }).session(session);
        await AssessmentDraft.deleteMany({ owner }).session(session);
        await Pet.deleteMany({ owner }).session(session);
        await Session.deleteMany({ user: owner }).session(session);
        const deleted = await User.deleteOne({ _id: owner }).session(session);
        if (deleted.deletedCount !== 1) throw new Error('Account could not be deleted.');
      });
    } finally {
      await session.endSession();
    }
    clearSessionCookie(res);
    return res.json({ message: 'Account and related VetCare records permanently deleted.' });
  } catch (error) {
    // Do not attempt non-transactional fallback for destructive operations.
    if (/transaction numbers are only allowed|replica set|does not support transactions/i.test(error.message || '')) {
      return res.status(503).json({ message: 'Account deletion requires MongoDB transaction support; no records were deleted.' });
    }
    next(error);
  }
});

module.exports = router;
