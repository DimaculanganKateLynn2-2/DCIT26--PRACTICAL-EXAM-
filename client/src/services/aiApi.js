import { apiRequest } from './api';

export function runAiAssessment(observation) {
  return apiRequest('/api/ai/assessment', { method: 'POST', body: JSON.stringify({ ...observation, consent: true }) });
}
export function saveAiAssessment(draftId) {
  return apiRequest(`/api/ai/assessment/${encodeURIComponent(draftId)}/save`, { method: 'POST' });
}
export function sendPetAssistant(messages) {
  return apiRequest('/api/ai/assistant', { method: 'POST', body: JSON.stringify({ messages, consent: true }) });
}
