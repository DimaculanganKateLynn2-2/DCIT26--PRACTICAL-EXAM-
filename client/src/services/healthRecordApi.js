import { apiRequest } from './api';
export const getHealthRecords = signal => apiRequest('/api/health-records', { signal });
export const createHealthRecord = record => apiRequest('/api/health-records', {
  method: 'POST', body: JSON.stringify(record),
});
export const updateHealthRecord = (id, record) => apiRequest(`/api/health-records/${encodeURIComponent(id)}`, {
  method: 'PUT', body: JSON.stringify(record),
});
export const deleteHealthRecord = id => apiRequest(`/api/health-records/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const downloadVisitSummary = id => apiRequest(`/api/health-records/${encodeURIComponent(id)}/visit-summary`, {
  asBlob: true,
});
