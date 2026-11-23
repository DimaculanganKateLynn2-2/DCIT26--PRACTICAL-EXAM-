import { apiRequest } from './api';

export function getAiGuidance(observation) {
  return apiRequest('/api/ai/symptoms', {
    method: 'POST',
    body: JSON.stringify({
      petId: observation.petId || undefined,
      species: observation.petType,
      age: observation.petAge === 'Not provided' ? null : observation.petAge,
      symptoms: observation.symptoms,
      duration: observation.duration,
      notes: observation.notes || '',
      consent: true,
    }),
  });
}
