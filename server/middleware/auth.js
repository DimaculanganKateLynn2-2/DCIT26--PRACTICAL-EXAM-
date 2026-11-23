const crypto = require('node:crypto');
const Session = require('../models/Session');
const User = require('../models/User');

const COOKIE = 'vetcare_session';
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/api',
};

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function createSession(res, user) {
  const token = crypto.randomBytes(32).toString('hex');
  const csrfToken = crypto.randomBytes(32).toString('hex');
  await Session.create({
    user: user._id,
    tokenHash: hashToken(token),
    csrfToken,
    expiresAt: new Date(Date.now() + SEVEN_DAYS),
  });
  res.cookie(COOKIE, token, { ...cookieOptions, maxAge: SEVEN_DAYS });
  return { user: { id: String(user._id), name: user.name, email: user.email }, csrfToken };
}

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE];
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
      return res.status(401).json({ message: 'Please log in.' });
    }
    const session = await Session.findOne({
      tokenHash: hashToken(token),
      expiresAt: { $gt: new Date() },
    });
    if (!session) return res.status(401).json({ message: 'Session expired. Please log in again.' });
    const user = await User.findById(session.user);
    if (!user) return res.status(401).json({ message: 'Account not found.' });
    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    next(error);
  }
}

function requireCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const supplied = req.get('X-CSRF-Token');
  const expected = req.session?.csrfToken;
  if (!supplied || !expected || supplied.length !== expected.length) {
    return res.status(403).json({ message: 'Missing or invalid CSRF token.' });
  }
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (!crypto.timingSafeEqual(a, b)) {
    return res.status(403).json({ message: 'Missing or invalid CSRF token.' });
  }
  next();
}

function enforceOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('Origin');
  const allowed = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  if (origin !== allowed) {
    return res.status(403).json({ message: 'Untrusted request origin.' });
  }
  // Authenticated writes additionally require an unguessable CSRF token.
  next();
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE, cookieOptions);
}

module.exports = { createSession, requireAuth, requireCsrf, enforceOrigin, clearSessionCookie };
