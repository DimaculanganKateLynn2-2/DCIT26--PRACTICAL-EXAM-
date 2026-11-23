'use strict';

const PDFDocument = require('pdfkit');

function clean(value, max = 1000) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function formatDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Not available';
  return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
}

function printHeading(doc, title) {
  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#166534').text(title);
  doc.moveDown(0.25);
  doc.font('Helvetica').fontSize(10).fillColor('#1f2937');
}

function printField(doc, label, value) {
  doc.font('Helvetica-Bold').fillColor('#111827').text(`${label}: `, { continued: true });
  doc.font('Helvetica').fillColor('#374151').text(clean(value || 'Not provided', 1000));
  doc.moveDown(0.15);
}

function printItems(doc, title, entries, maxItems = 12) {
  const items = Array.isArray(entries)
    ? entries.filter(item => typeof item === 'string' && item.trim()).slice(0, maxItems)
    : [];
  if (!items.length) return;
  printHeading(doc, title);
  for (const item of items) {
    doc.font('Helvetica').fontSize(10).fillColor('#374151').text(`- ${clean(item, 750)}`, {
      indent: 12,
      paragraphGap: 3,
    });
  }
}

/**
 * Create a veterinary visit preparation PDF from an ALREADY AUTHORIZED record.
 * Authorization belongs in the route. The PDF never calls an AI service.
 * @param {object} record - MongoDB HealthRecord with optional populated pet.
 * @returns {Promise<Buffer>}
 */
function createVeterinarySummaryPdf(record) {
  if (!record || !record._id) {
    return Promise.reject(new Error('A saved health record is required.'));
  }

  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({
      size: 'A4',
      margins: { top: 48, bottom: 56, left: 52, right: 52 },
      info: {
        Title: 'VetCare Meadow - Veterinary Visit Summary',
        Subject: 'Owner-reported pet health observations for a veterinary visit',
        Author: 'VetCare Meadow',
      },
      bufferPages: false,
      compress: true,
    });
    const buffers = [];
    pdf.on('data', chunk => buffers.push(chunk));
    pdf.once('error', reject);
    pdf.once('end', () => resolve(Buffer.concat(buffers)));

    try {
      const pet = record.petSnapshot?.name ? record.petSnapshot : (record.pet || {});
      const aiReport = record.aiReport && typeof record.aiReport === 'object' ? record.aiReport : null;

      pdf.font('Helvetica-Bold').fontSize(20).fillColor('#166534').text('VetCare Meadow');
      pdf.moveDown(0.1);
      pdf.font('Helvetica-Bold').fontSize(14).fillColor('#111827').text('Veterinary Visit Summary');
      pdf.moveDown(0.4);
      pdf.font('Helvetica').fontSize(9).fillColor('#6b7280')
        .text('For visit preparation only. NOT a medical diagnosis or veterinarian-confirmed record.');
      pdf.moveDown(0.4);
      pdf.moveTo(pdf.x, pdf.y).lineTo(543, pdf.y).strokeColor('#bbf7d0').lineWidth(1).stroke();

      printHeading(pdf, 'Pet information');
      printField(pdf, 'Name', pet.name);
      printField(pdf, 'Species', pet.species);
      printField(pdf, 'Breed', pet.breed);
      printField(pdf, 'Age (years)', pet.age === 0 ? '0' : pet.age);
      printField(pdf, 'Sex', pet.sex);

      printHeading(pdf, 'Owner-reported observations');
      printField(pdf, 'Recorded on', formatDate(record.createdAt));
      printField(pdf, 'Duration', record.duration);
      printItems(pdf, 'Selected symptoms', record.symptoms);
      if (Array.isArray(record.symptomDetails) && record.symptomDetails.length) {
        printItems(pdf, 'Owner-reported severity', record.symptomDetails.slice(0, 16).map(s =>
          `${clean(s.name, 100)}: ${clean(s.severity, 30) || 'Not specified'}`));
      }
      if (record.notes) printField(pdf, 'Additional observations', clean(record.notes, 1500));
      if (record.emergencyFlag) {
        pdf.moveDown(0.4);
        pdf.font('Helvetica-Bold').fontSize(10).fillColor('#991b1b')
          .text('An emergency warning sign was selected. Seek immediate veterinary assistance.');
      }

      if (aiReport) {
        printHeading(pdf, 'AI-generated educational guidance (not verified by a veterinarian)');
        printField(pdf, 'Reported AI urgency', clean(aiReport.urgency || 'Not available', 40));
        printField(pdf, 'AI model', clean(record.aiModel || 'Not recorded', 80));
        printItems(pdf, 'Possible concerns (not diagnoses)', aiReport.possibleConcerns);
        printItems(pdf, 'Explanations', aiReport.explanations);
        printItems(pdf, 'Suggested next steps', aiReport.nextSteps);
        printItems(pdf, 'Warning signs to discuss', aiReport.warningSigns);
        printItems(pdf, 'Questions for your veterinarian', aiReport.questionsForVet);
      } else {
        printHeading(pdf, 'AI guidance');
        pdf.font('Helvetica').fontSize(10).fillColor('#374151')
          .text('No AI analysis was generated for this observation. This PDF is still useful for recording what the owner observed.');
      }

      printHeading(pdf, 'Important safety reminder');
      pdf.font('Helvetica').fontSize(9).fillColor('#374151')
        .text('This document contains owner-reported observations and, if present, unverified AI-generated educational content. It cannot confirm or rule out any illness. A veterinarian must assess the pet, especially if symptoms are severe, worsen, or suggest an emergency. Do not delay emergency care to prepare this report.', { paragraphGap: 4 });
      pdf.end();
    } catch (error) {
      pdf.destroy(error);
      reject(error);
    }
  });
}

module.exports = { createVeterinarySummaryPdf };
