// Independent, conservative rule checks. These are not a medical triage system.
const EMERGENCY_SYMPTOMS = new Set([
  'difficulty breathing', 'seizures', 'collapse', 'heavy bleeding',
  'straining to urinate with no urine', 'unresponsiveness', 'severe bleeding',
]);
const URGENCY = ['Low', 'Moderate', 'High'];
const DURATIONS = new Set([
  'Just started', 'Less than 24 hours', '1-2 days', '3 days or longer', 'Not sure',
]);
const SEVERITIES = new Set(['Mild', 'Moderate', 'Severe', 'Not Sure']);
// Text checks are supplemental; absence of matching words cannot establish safety.
const NOTE_DANGER = /\b(?:can't breathe|cannot breathe|not breathing|struggl(?:e|ing) to breathe|seizures?|convulsions?|collapsed|unresponsive|unconscious|bleeding heavily|can't pee|cannot urinate|unable to urinate)\b/i;

function hasEmergencyWarning(symptoms = [], notes = '') {
  return symptoms.some(s => typeof s === 'string' && EMERGENCY_SYMPTOMS.has(s.toLowerCase().trim())) ||
    NOTE_DANGER.test(notes);
}

function validateAssessment(body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Invalid assessment.' };
  if (typeof body.petId !== 'string' || !/^[0-9a-f]{24}$/i.test(body.petId)) return { error: 'Choose a registered pet.' };
  if (!Array.isArray(body.symptoms) || body.symptoms.length < 1 || body.symptoms.length > 16 ||
      body.symptoms.some(s => typeof s !== 'string' || !s.trim() || s.length > 100)) {
    return { error: 'Select 1–16 valid observed symptoms.' };
  }
  if (!DURATIONS.has(body.duration)) return { error: 'Select a valid duration.' };
  if (typeof body.notes !== 'string' || body.notes.length > 1500) return { error: 'Notes are too long.' };
  if (body.consent !== true) return { error: 'Consent is required to send demo data to Gemini.' };
  if (!body.severityBySymptom || typeof body.severityBySymptom !== 'object' || Array.isArray(body.severityBySymptom)) {
    return { error: 'Specify the observed severity of each symptom.' };
  }
  const symptoms = [...new Set(body.symptoms.map(s => s.trim()))];
  const symptomDetails = symptoms.map(name => ({ name, severity: body.severityBySymptom[name] }));
  if (symptomDetails.some(s => !SEVERITIES.has(s.severity))) return { error: 'Select a valid severity for each symptom.' };
  return {
    data: {
      petId: body.petId, symptoms, duration: body.duration, notes: body.notes.trim(), symptomDetails,
      emergencyFlag: hasEmergencyWarning(symptoms, body.notes),
    },
  };
}

function safeString(value, max = 700) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function safeList(value, maxItems = 5) {
  return Array.isArray(value) ? value.filter(x => typeof x === 'string').slice(0, maxItems).map(x => safeString(x, 450)).filter(Boolean) : [];
}
function normalizeReport(raw, { emergencyFlag = false, severeReported = false } = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid AI guidance format.');
  let urgency = URGENCY.includes(raw.urgency) ? raw.urgency : 'Moderate';
  if (emergencyFlag) urgency = 'High';
  else if (severeReported && urgency === 'Low') urgency = 'Moderate';
  return {
    urgency,
    possibleConcerns: safeList(raw.possibleConcerns, 4),
    explanations: safeList(raw.explanations, 4),
    nextSteps: safeList(raw.nextSteps, 6),
    warningSigns: safeList(raw.warningSigns, 5),
    questionsForVet: safeList(raw.questionsForVet, 4),
    disclaimer: 'AI-generated educational guidance only. Not a diagnosis or treatment plan. A veterinarian must assess the pet.',
  };
}
module.exports = { hasEmergencyWarning, validateAssessment, normalizeReport };
