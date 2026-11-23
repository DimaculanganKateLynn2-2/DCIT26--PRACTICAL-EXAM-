import { apiRequest } from './api';
export const getPets = signal => apiRequest('/api/pets', { signal });
export const createPet = pet => apiRequest('/api/pets', { method: 'POST', body: JSON.stringify(pet) });
export const updatePet = (id, pet) => apiRequest(`/api/pets/${encodeURIComponent(id)}`, {
  method: 'PUT', body: JSON.stringify(pet),
});
export const deletePet = id => apiRequest(`/api/pets/${encodeURIComponent(id)}`, { method: 'DELETE' });
