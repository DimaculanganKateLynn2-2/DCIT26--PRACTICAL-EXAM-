const emergencySymptoms = new Set([
  'Difficulty Breathing', 'Seizures', 'Collapse', 'Heavy Bleeding',
  'Straining to Urinate With No Urine',
]);
// Conservative examples only, NOT a complete or validated medical triage tool.
const redFlagNotes = [
  /(?:cannot|can't|unable to|struggling to|difficulty|hard to)\s+(?:breathe|breath|urinate|pee)/i,
  /(?:not breathing|stopped breathing|unconscious|unresponsive|collapsed|seizure|convuls(?:ion|ing)|heavy bleeding)/i,
];

function hasRedFlag(symptoms = [], notes = '') {
  return symptoms.some(s => emergencySymptoms.has(s)) || redFlagNotes.some(pattern => pattern.test(notes));
}

module.exports = { hasRedFlag };
