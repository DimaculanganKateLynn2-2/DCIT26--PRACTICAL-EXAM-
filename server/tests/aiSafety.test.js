const test = require('node:test');
const assert = require('node:assert/strict');
const { hasEmergencyWarning, validateAssessment, normalizeReport } = require('../services/aiSafety');

const sample = {
  petId: '507f1f77bcf86cd799439011',
  symptoms: ['Vomiting'], duration: '1-2 days', notes: '',
  severityBySymptom: { Vomiting: 'Not Sure' }, consent: true,
};
test('validates a basic observation', () => assert.equal(validateAssessment(sample).data.symptoms[0], 'Vomiting'));
test('requires a registered pet', () => assert.match(validateAssessment({ ...sample, petId: '' }).error, /registered pet/));
test('requires positive AI data-sharing consent', () => assert.match(validateAssessment({ ...sample, consent: false }).error, /Consent/));
test('rejects missing symptom list', () => assert.ok(validateAssessment({ ...sample, symptoms: [] }).error));
test('rejects invalid duration', () => assert.ok(validateAssessment({ ...sample, duration: 'month' }).error));
test('rejects invalid severity', () => assert.ok(validateAssessment({ ...sample, severityBySymptom: { Vomiting: 'Extreme' } }).error));
test('detects breathing difficulty from selected list', () => assert.equal(hasEmergencyWarning(['Difficulty Breathing']), true));
test('detects collapse from notes', () => assert.equal(hasEmergencyWarning([], 'My cat collapsed.'), true));
test('does not confuse ordinary vomiting with predefined emergency flag', () => assert.equal(hasEmergencyWarning(['Vomiting']), false));
test('forces High urgency if independent emergency rule triggered', () => assert.equal(normalizeReport({ urgency: 'Low' }, { emergencyFlag: true }).urgency, 'High'));
test('blocks Low urgency if severe symptoms reported', () => assert.equal(normalizeReport({ urgency: 'Low' }, { severeReported: true }).urgency, 'Moderate'));
test('does not accept fake non-enum urgency', () => assert.equal(normalizeReport({ urgency: 'Perfectly Safe' }).urgency, 'Moderate'));
