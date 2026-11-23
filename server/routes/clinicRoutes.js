'use strict';
const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { findClinics, geocodePlace, validCoordinates } = require('../services/clinicService');
const router = express.Router();
// Account-only route is mounted behind requireAuth in server.js.
router.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 15, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'Too many map searches. Try again later.' } }));

router.get('/geocode', async (req,res,next) => {
  try { return res.json(await geocodePlace(req.query.q)); }
  catch(err) { next(err); }
});
router.get('/search', async (req,res,next) => {
  try {
    const lat = Number(req.query.lat), lon = Number(req.query.lon);
    const radius = req.query.radius === undefined ? 5 : Number(req.query.radius);
    if (!req.query.lat || !req.query.lon || !validCoordinates(lat,lon) || ![3,5,10].includes(radius)) return res.status(400).json({ message: 'Valid latitude, longitude and radius (3, 5 or 10 km) are required.' });
    return res.json(await findClinics(lat,lon,radius));
  } catch(err) { next(err); }
});
module.exports = router;
