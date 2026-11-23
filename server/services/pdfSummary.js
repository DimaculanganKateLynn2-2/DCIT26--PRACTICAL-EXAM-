const PDFDocument = require('pdfkit');

function formatDate(value) {
  return new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila' });
}

function makeVisitSummary(res, record, pet) {
  const filename = `vetcare-visit-summary-${record._id}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  const pdf = new PDFDocument({ size: 'A4', margin: 54, info: { Title: 'VetCare Meadow - Vet Visit Summary' } });
  pdf.on('error', () => { if (!res.headersSent) res.status(500).end(); else res.destroy(); });
  pdf.pipe(res);

  pdf.fillColor('#166534').fontSize(21).text('VetCare Meadow', { continued: false });
  pdf.fillColor('#374151').fontSize(15).text('Veterinary Visit Summary');
  pdf.moveDown(0.5);
  pdf.fillColor('#6B7280').fontSize(9).text(`Generated: ${formatDate(new Date())}`);
  pdf.moveDown();

  pdf.fillColor('#166534').fontSize(13).text('Pet Information');
  pdf.fillColor('#111827').fontSize(11)
    .text(`Name: ${pet.name}`)
    .text(`Species: ${pet.species}`)
    .text(`Breed: ${pet.breed || 'Not specified'}`)
    .text(`Age (reported): ${pet.age} years`)
    .text(`Sex: ${pet.sex || 'Unknown'}`);
  pdf.moveDown();

  pdf.fillColor('#166534').fontSize(13).text('Reported Observation');
  pdf.fillColor('#111827').fontSize(11)
    .text(`Recorded: ${formatDate(record.createdAt)}`)
    .text(`Duration reported: ${record.duration}`)
    .text('Symptoms:');
  for (const symptom of record.symptoms) pdf.text(`  - ${symptom}`);
  pdf.moveDown(0.4);
  pdf.text('Owner notes:');
  pdf.text(record.notes || 'No additional notes.', { width: 470 });
  pdf.moveDown();

  if (record.emergencyFlag) {
    pdf.fillColor('#B91C1C').fontSize(11).text('Emergency warning sign was recorded. If ongoing, seek emergency veterinary care.');
    pdf.moveDown();
  }
  pdf.fillColor('#6B7280').fontSize(10)
    .text('This document contains user-reported observations, not a diagnosis, prescription, or verified veterinary record. Do not delay care while preparing a summary.',
      { width: 480 });
  pdf.end();
}

module.exports = { makeVisitSummary };
