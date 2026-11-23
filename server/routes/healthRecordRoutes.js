const express = require('express');
const mongoose = require('mongoose');
const HealthRecord = require('../models/HealthRecord');
const Pet = require('../models/Pet');
const router = express.Router();

const allowedDurations = new Set([
  'Just started', 'Less than 24 hours', '1-2 days', '3 days or longer', 'Not sure',
]);
const emergencySigns = new Set([
  'difficulty breathing', 'seizures', 'collapse', 'heavy bleeding',
  'straining to urinate with no urine',
]);

function validateObservation(body = {}) {
  const { petId, symptoms, duration, notes = '' } = body;
  if (!mongoose.isValidObjectId(petId)) return { error: 'Select a registered pet.' };
  if (!Array.isArray(symptoms) || symptoms.length < 1 || symptoms.length > 16 ||
      symptoms.some(item => typeof item !== 'string' || !item.trim() || item.length > 100)) {
    return { error: 'Select between 1 and 16 valid symptoms.' };
  }
  if (!allowedDurations.has(duration)) return { error: 'Select a valid duration.' };
  if (typeof notes !== 'string' || notes.length > 1500) return { error: 'Invalid observations.' };
  const cleanSymptoms = [...new Set(symptoms.map(item => item.trim()))];
  return {
    data: {
      pet: petId,
      symptoms: cleanSymptoms,
      duration,
      notes: notes.trim(),
      // A basic predefined flag only; this is NOT a comprehensive veterinary screening tool.
      emergencyFlag: cleanSymptoms.some(item => emergencySigns.has(item.toLowerCase())),
    },
  };
}

router.get('/', async (req, res, next) => {
  try {
    const records = await HealthRecord.find({ owner: req.user._id })
      .populate('pet', 'name species breed age sex')
      .sort({ createdAt: -1 }).limit(100);
    res.json(records);
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const validated = validateObservation(req.body);
    if (validated.error) return res.status(400).json({ message: validated.error });
    const pet = await Pet.findOne({ _id: validated.data.pet, owner: req.user._id });
    if (!pet) return res.status(404).json({ message: 'Pet not found in your account.' });
    const record = await HealthRecord.create({ ...validated.data, owner: req.user._id });
    await record.populate('pet', 'name species breed age sex');
    return res.status(201).json(record);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid record ID.' });
    const validated = validateObservation(req.body);
    if (validated.error) return res.status(400).json({ message: validated.error });
    const pet = await Pet.findOne({ _id: validated.data.pet, owner: req.user._id });
    if (!pet) return res.status(404).json({ message: 'Pet not found in your account.' });
    const record = await HealthRecord.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      validated.data,
      { new: true, runValidators: true }
    ).populate('pet', 'name species breed age sex');
    if (!record) return res.status(404).json({ message: 'Observation not found.' });
    return res.json(record);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid record ID.' });
    const record = await HealthRecord.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!record) return res.status(404).json({ message: 'Observation not found.' });
    return res.json({ message: 'Observation deleted.' });
  } catch (error) { next(error); }
});

module.exports = router;
