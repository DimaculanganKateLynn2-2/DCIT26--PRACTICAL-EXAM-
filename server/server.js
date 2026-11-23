require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { requireAuth, requireCsrf, enforceOrigin } = require('./middleware/auth');
const authRoutes = require('./routes/authRoutes');
const petRoutes = require('./routes/petRoutes');
const healthRecordRoutes = require('./routes/healthRecordRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.disable('x-powered-by');
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '12kb' }));
app.use(cookieParser());
app.use(enforceOrigin);

app.get('/api/health', (req, res) => res.json({
  server: 'running', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
}));
app.use('/api/auth', authRoutes);
app.use('/api/pets', requireAuth, requireCsrf, petRoutes);
app.use('/api/health-records', requireAuth, requireCsrf, healthRecordRoutes);
app.use('/api/ai', requireAuth, requireCsrf, aiRoutes);
app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Request is too large.' });
  if (err instanceof SyntaxError && 'body' in err) return res.status(400).json({ message: 'Invalid JSON.' });
  console.error('Request failed:', err.name, err.message);
  res.status(err.status && err.status >= 400 && err.status < 600 ? err.status : 500)
    .json({ message: err.status ? err.message : 'Internal server error.' });
});

async function start() {
  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI in server/.env');
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'vetcare_meadow' });
    console.log('MongoDB connected successfully!');
    app.listen(PORT, () => console.log(`VetCare Meadow backend running on port ${PORT}`));
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) start();
module.exports = app;
