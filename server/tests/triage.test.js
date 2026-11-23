const { test } = require('node:test');
const assert = require('node:assert/strict');
const { hasRedFlag } = require('../services/triage');

test('selected difficulty breathing triggers alert', () => {
  assert.equal(hasRedFlag(['Difficulty Breathing']), true);
});
test('selected loss of appetite alone does not trigger predefined alert', () => {
  assert.equal(hasRedFlag(['Loss of Appetite']), false);
});
test('critical free text triggers conservative alert', () => {
  assert.equal(hasRedFlag(['Sneezing'], 'Not breathing'), true);
});
test('no red flag does not prove safety', () => {
  assert.equal(hasRedFlag(['Vomiting'], 'ongoing'), false);
});
