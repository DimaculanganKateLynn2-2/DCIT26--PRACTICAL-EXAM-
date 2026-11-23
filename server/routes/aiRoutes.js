const express = require('express');
const mongoose = require('mongoose');
const { rateLimit } = require('express-rate-limit');
const Pet = require('../models/Pet');
const { analyzeObservation } = require('../services/aiService');

const router = express.Router();
router.use(rateLimit({
  windowMs: 60 * 60 * 1000, limit: 20,
  standardHeaders: 'draft-7', legacyHeaders: false,
  message: { message: 'AI request limit reached. Please try later.' },
}));
const allowedDurations = new Set(['Just started', 'Less than 24 hours', '1-2 days', '3 days or longer', 'Not sure']);

router.post('/symptoms', async (req, res, next) => {
  try {
    const { petId, species, age, symptoms, duration, notes = '', consent } = req.body || {};
    if (consent !== true) return res.status(400).json({ message: 'Consent is required before sending observations to the AI provider.' });
    if (!Array.isArray(symptoms) || symptoms.length < 1 || symptoms.length > 16 ||
        symptoms.some(s => typeof s !== 'string' || !s.trim() || s.length > 100) ||
        !allowedDurations.has(duration) || typeof notes !== 'string' || notes.length > 1500) {
      return res.status(400).json({ message: 'Enter valid symptoms, duration, and notes.' });
    }
    let petSpecies = species;
    let petAge = age;
    if (petId) {
      if (!mongoose.isValidObjectId(petId)) return res.status(400).json({ message: 'Invalid pet ID.' });
      const pet = await Pet.findOne({ _id: petId, owner: req.user._id });
      if (!pet) return res.status(404).json({ message: 'Pet not found.' });
      petSpecies = pet.species;
      petAge = pet.age;
    }
    if (!['Dog', 'Cat'].includes(petSpecies)) return res.status(400).json({ message: 'Select Dog or Cat.' });
    if (petAge !== undefined && petAge !== null && petAge !== 'Not provided' && petAge !== '') {
      petAge = Number(petAge);
      if (!Number.isFinite(petAge) || petAge < 0 || petAge > 40) {
        return res.status(400).json({ message: 'Invalid pet age.' });
      }
    } else petAge = null;
    const result = await analyzeObservation({
      species: petSpecies, age: petAge, symptoms: symptoms.map(s => s.trim()), duration, notes: notes.trim(),
    });
    res.json(result);
  } catch (error) { next(error); }
});

module.exports = router;
