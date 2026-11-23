'use strict';

const express = require('express');
const mongoose = require('mongoose');
const HealthRecord = require('../models/HealthRecord');
const { createVeterinarySummaryPdf } = require('../services/pdfService');

// Mounted behind requireAuth in server.js. No public PDF endpoints.
const router = express.Router();

router.get('/health-records/:recordId/pdf', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.recordId)) {
      return res.status(400).json({ message: 'Invalid health record ID.' });
    }

    // BOTH the record ID and logged-in owner must match. Prevents other
    // accounts from downloading private pet observations by guessing IDs.
    const record = await HealthRecord.findOne({
      _id: req.params.recordId,
      owner: req.user._id,
    }).populate('pet', 'name species breed age sex');

    if (!record) {
      return res.status(404).json({ message: 'Health record not found in your account.' });
    }

    const pdfBuffer = await createVeterinarySummaryPdf(record);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="vetcare-visit-summary-${record._id}.pdf"`,
      'Content-Length': String(pdfBuffer.length),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
