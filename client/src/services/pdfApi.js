import { apiRequest } from './api';

// Returns a PDF Blob using the existing authenticated fetch + session cookie.
// Never place passwords, session cookies, or CSRF tokens in download URLs.
export function getHealthRecordPdf(recordId) {
  if (!recordId) throw new Error('A saved record is required.');
  return apiRequest(`/api/reports/health-records/${encodeURIComponent(recordId)}/pdf`, {
    method: 'GET',
    asBlob: true,
  });
}
