const test = require('node:test');
const assert = require('node:assert/strict');
const { generateAssessment, respondToAssistant } = require('../services/geminiService');

// These tests use mocked network responses and DO NOT call the real Gemini API.
const originalFetch = global.fetch;
const originalKey = process.env.GEMINI_API_KEY;
const originalModel = process.env.GEMINI_MODEL;

test('Gemini integration constructs a server-side authenticated request', async () => {
  process.env.GEMINI_API_KEY = 'test-fake-key';
  process.env.GEMINI_MODEL = 'gemini-3.5-flash-lite';
  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ urgency: 'Moderate', possibleConcerns: ['Possible non-specific digestive upset'], explanations: ['Symptoms need assessment'], nextSteps: ['Call a veterinarian'], warningSigns: ['Worsening signs'], questionsForVet: ['What should I document?'] }) }] } }] }) };
  };
  try {
    const result = await generateAssessment({ pet: { species: 'Dog', breed: 'Aspin', age: 5, sex: 'Male' }, observation: { symptomDetails: [{ name: 'Vomiting', severity: 'Mild' }], duration: 'Just started', notes: '', emergencyFlag: false } });
    assert.equal(result.raw.urgency, 'Moderate');
    assert.match(request.url, /gemini-3\.5-flash-lite:generateContent$/);
    assert.equal(request.options.headers['x-goog-api-key'], 'test-fake-key');
    assert.equal(JSON.parse(request.options.body).generationConfig.responseMimeType, 'application/json');
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.GEMINI_MODEL; else process.env.GEMINI_MODEL = originalModel;
  }
});

test('Gemini assistant refuses API calls when key is unconfigured', async () => {
  delete process.env.GEMINI_API_KEY;
  await assert.rejects(() => respondToAssistant([{ role: 'user', text: 'Pet care?' }]), /not configured/);
  if (originalKey !== undefined) process.env.GEMINI_API_KEY = originalKey;
});
