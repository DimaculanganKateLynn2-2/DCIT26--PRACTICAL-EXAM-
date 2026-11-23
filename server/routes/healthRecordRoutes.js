const express = require('express');
const mongoose = require('mongoose');
const HealthRecord = require('../models/HealthRecord');
const Pet = require('../models/Pet');
const { hasRedFlag } = require('../services/triage');
const { makeVisitSummary } = require('../services/pdfSummary');
const router = express.Router();

const durations = new Set(['Just started', 'Less than 24 hours', '1-2 days', '3 days or longer', 'Not sure']);
function validate(body = {}) {
  const { petId, symptoms, duration, notes = '' } = body;
  if (!mongoose.isValidObjectId(petId)) return { error: 'Invalid pet ID.' };
  if (!Array.isArray(symptoms) || symptoms.length < 1 || symptoms.length > 16 ||
      symptoms.some(s => typeof s !== 'string' || !s.trim() || s.length > 100)) {
    return { error: 'Select 1–16 valid symptoms.' };
  }
  if (!durations.has(duration)) return { error: 'Invalid symptom duration.' };
  if (typeof notes !== 'string' || notes.length > 1500) return { error: 'Invalid notes.' };
  const clean = [...new Set(symptoms.map(s => s.trim()))];
  return { data: { pet: petId, symptoms: clean, duration, notes: notes.trim(), emergencyFlag: hasRedFlag(clean, notes) } };
}

router.get('/', async (req, res, next) => {
  try {
    res.json(await HealthRecord.find({ owner: req.user._id })
      .populate('pet', 'name species breed age sex')
      .sort({ createdAt: -1 }).limit(100));
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const checked = validate(req.body);
    if (checked.error) return res.status(400).json({ message: checked.error });
    const pet = await Pet.findOne({ _id: checked.data.pet, owner: req.user._id });
    if (!pet) return res.status(404).json({ message: 'Pet not found.' });
    const record = await HealthRecord.create({ ...checked.data, owner: req.user._id });
    await record.populate('pet', 'name species breed age sex');
    res.status(201).json(record);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid record ID.' });
    const checked = validate(req.body);
    if (checked.error) return res.status(400).json({ message: checked.error });
    const pet = await Pet.findOne({ _id: checked.data.pet, owner: req.user._id });
    if (!pet) return res.status(404).json({ message: 'Pet not found.' });
    const record = await HealthRecord.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id }, checked.data, { new: true, runValidators: true }
    ).populate('pet', 'name species breed age sex');
    if (!record) return res.status(404).json({ message: 'Record not found.' });
    res.json(record);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid record ID.' });
    const record = await HealthRecord.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!record) return res.status(404).json({ message: 'Record not found.' });
    res.json({ message: 'Health record deleted.' });
  } catch (error) { next(error); }
});

router.get('/:id/visit-summary', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid record ID.' });
    const record = await HealthRecord.findOne({ _id: req.params.id, owner: req.user._id });
    if (!record) return res.status(404).json({ message: 'Record not found.' });
    const pet = await Pet.findOne({ _id: record.pet, owner: req.user._id });
    if (!pet) return res.status(404).json({ message: 'Pet profile unavailable.' });
    makeVisitSummary(res, record, pet);
  } catch (error) { next(error); }
});

module.exports = router;
