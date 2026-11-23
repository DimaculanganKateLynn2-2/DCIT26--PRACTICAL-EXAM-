const express = require('express');
const mongoose = require('mongoose');
const { rateLimit } = require('express-rate-limit');
const Pet = require('../models/Pet');
const HealthRecord = require('../models/HealthRecord');
const AssessmentDraft = require('../models/AssessmentDraft');
const { hasEmergencyWarning, validateAssessment, normalizeReport } = require('../services/aiSafety');
const { generateAssessment, respondToAssistant } = require('../services/geminiService');

const router = express.Router();
const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, limit: 8, standardHeaders: 'draft-7', legacyHeaders: false,
  message: { message: 'AI request limit reached. Please try again later.' },
});

router.post('/assessment', aiLimiter, async (req, res, next) => {
  try {
    const validated = validateAssessment(req.body);
    if (validated.error) return res.status(400).json({ message: validated.error });
    const observation = validated.data;
    const pet = await Pet.findOne({ _id: observation.petId, owner: req.user._id });
    if (!pet) return res.status(404).json({ message: 'Registered pet not found in your account.' });

    const { raw, model } = await generateAssessment({ pet, observation });
    const report = normalizeReport(raw, {
      emergencyFlag: observation.emergencyFlag,
      severeReported: observation.symptomDetails.some(s => s.severity === 'Severe'),
    });
    const petSnapshot = { name: pet.name, species: pet.species, breed: pet.breed, age: pet.age, sex: pet.sex };
    const draft = await AssessmentDraft.create({
      owner: req.user._id, pet: pet._id, petSnapshot,
      symptoms: observation.symptoms, symptomDetails: observation.symptomDetails,
      duration: observation.duration, notes: observation.notes,
      emergencyFlag: observation.emergencyFlag, aiReport: report, aiModel: model,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    return res.json({ draftId: draft._id, pet: petSnapshot, report, emergencyFlag: observation.emergencyFlag });
  } catch (error) { next(error); }
});

router.post('/assessment/:draftId/save', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.draftId)) return res.status(400).json({ message: 'Invalid assessment draft ID.' });
    const draft = await AssessmentDraft.findOne({
      _id: req.params.draftId, owner: req.user._id, expiresAt: { $gt: new Date() },
    });
    if (!draft) return res.status(404).json({ message: 'Assessment draft expired or was not found. Run the assessment again.' });
    if (draft.savedRecord) {
      const saved = await HealthRecord.findOne({ _id: draft.savedRecord, owner: req.user._id });
      if (saved) return res.json(saved);
    }
    // Server-owned draft preserves Gemini output; client cannot forge an AI report.
    let record;
    try {
      record = await HealthRecord.create({
        owner: req.user._id, pet: draft.pet,
        symptoms: draft.symptoms, symptomDetails: draft.symptomDetails,
        duration: draft.duration, notes: draft.notes,
        emergencyFlag: draft.emergencyFlag,
        petSnapshot: draft.petSnapshot, aiReport: draft.aiReport, aiModel: draft.aiModel,
        assessmentDraftId: draft._id,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      record = await HealthRecord.findOne({ assessmentDraftId: draft._id, owner: req.user._id });
      if (!record) throw error;
    }
    await AssessmentDraft.updateOne({ _id: draft._id, owner: req.user._id }, { $set: { savedRecord: record._id } });
    await record.populate('pet', 'name species breed age sex');
    return res.status(201).json(record);
  } catch (error) { next(error); }
});

router.post('/assistant', aiLimiter, async (req, res, next) => {
  try {
    const { messages, consent } = req.body || {};
    if (consent !== true) return res.status(400).json({ message: 'Consent is required for Gemini requests.' });
    if (!Array.isArray(messages) || messages.length < 1 || messages.length > 8 ||
        messages.some(m => !m || !['user', 'assistant'].includes(m.role) || typeof m.text !== 'string' || !m.text.trim() || m.text.length > 600) ||
        messages[messages.length - 1].role !== 'user') {
      return res.status(400).json({ message: 'Provide a valid message of up to 600 characters.' });
    }
    const response = await respondToAssistant(messages);
    const emergencyFlag = messages[messages.length - 1].role === 'user' &&
      hasEmergencyWarning([], messages[messages.length - 1].text);
    return res.json({ reply: response.text.slice(0, 5000), emergencyFlag });
  } catch (error) { next(error); }
});
module.exports = router;
