require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { requireAuth, requireCsrf, enforceOrigin } = require('./middleware/auth');
const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const petRoutes = require('./routes/petRoutes');
const healthRecordRoutes = require('./routes/healthRecordRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const aiRoutes = require('./routes/aiRoutes');
const clinicRoutes = require('./routes/clinicRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.disable('x-powered-by');
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '16kb' }));
app.use(cookieParser());
app.use(enforceOrigin);

app.get('/api/health', (_req, res) => res.json({
  server: 'running',
  database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
}));
app.use('/api/auth', authRoutes);
app.use('/api/account', requireAuth, requireCsrf, accountRoutes);
app.use('/api/pets', requireAuth, requireCsrf, petRoutes);
app.use('/api/health-records', requireAuth, requireCsrf, healthRecordRoutes);
app.use('/api/reports', requireAuth, pdfRoutes);
app.use('/api/ai', requireAuth, requireCsrf, aiRoutes);
app.use('/api/clinics', requireAuth, clinicRoutes);

app.use((_req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((error, _req, res, _next) => {
  if (error.type === 'entity.too.large') return res.status(413).json({ message: 'Request is too large.' });
  if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ message: 'Invalid JSON.' });
  console.error('API request failed:', error.name, error.message);
  return res.status(error.status >= 400 && error.status < 600 ? error.status : 500)
    .json({ message: error.status ? error.message : 'Internal server error.' });
});

async function start() {
  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI. Keep the working MongoDB URI in server/.env.');
    process.exitCode = 1;
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB || 'vetcare_meadow',
    });
    console.log('MongoDB connected.');
    app.listen(PORT, () => console.log(`VetCare Meadow API: http://localhost:${PORT}`));
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) start();
module.exports = app;
