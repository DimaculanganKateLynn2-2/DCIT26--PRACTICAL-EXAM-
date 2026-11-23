import { apiRequest } from './api';

export function findNearbyClinics({ lat, lon, radius = 5 }, signal) {
  const qs = new URLSearchParams({ lat: String(lat), lon: String(lon), radius: String(radius) });
  return apiRequest(`/api/clinics/search?${qs}`, { signal });
}
export function searchClinicPlace(q, signal) {
  return apiRequest(`/api/clinics/geocode?q=${encodeURIComponent(q)}`, { signal });
}
