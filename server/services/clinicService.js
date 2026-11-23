'use strict';

/**
 * Non-commercial, small academic demo adapter for OpenStreetMap-based providers.
 * No automatic polling. Only fetch after explicit user actions; provider services
 * are independent, best-effort resources, NOT guaranteed live clinic directories.
 */
// Provider endpoints are configurable so shared services can be changed without code edits.
const NOMINATIM = process.env.OSM_NOMINATIM_URL || 'https://nominatim.openstreetmap.org/search';
const OVERPASS = process.env.OSM_OVERPASS_URL || 'https://overpass-api.de/api/interpreter';
const geocodeCache = new Map();
const clinicCache = new Map();
let lastNominatimAt = 0;
let lastOverpassAt = 0;

function validCoordinates(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}
function distanceKm(lat1, lon1, lat2, lon2) {
  const r = Math.PI / 180;
  const dLat = (lat2 - lat1) * r, dLon = (lon2 - lon1) * r;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*r)*Math.cos(lat2*r)*Math.sin(dLon/2)**2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 10) / 10;
}
function providerAgent() {
  const email = (process.env.OSM_CONTACT_EMAIL || '').trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error('Map search setup incomplete. Add an OSM_CONTACT_EMAIL project contact in server/.env. See Phase 4 guide.');
    error.status = 503;
    throw error;
  }
  return `VetCareMeadowAcademicDemo/1.0 (${email})`;
}
function overpassQuery(lat, lon, radius) {
  return `[out:json][timeout:20];(nwr["amenity"="veterinary"](around:${radius},${lat},${lon});nwr["healthcare"="veterinary"](around:${radius},${lat},${lon}););out center 100;`;
}
function addressFromTags(tags) {
  const parts = [tags['addr:housenumber'], tags['addr:street'], tags['addr:suburb'], tags['addr:city'] || tags['addr:town'] || tags['addr:village'], tags['addr:province']].filter(Boolean);
  return tags['addr:full'] || (parts.length ? parts.join(', ') : null);
}
function clinicFromElement(el, originLat, originLon) {
  if (!el || !['node','way','relation'].includes(el.type) || !Number.isSafeInteger(el.id) || el.id < 1) return null;
  const lat = Number(el.lat ?? el.center?.lat);
  const lon = Number(el.lon ?? el.center?.lon);
  if (!validCoordinates(lat,lon)) return null;
  const tags = el.tags || {};
  const label = typeof tags.name === 'string' && tags.name.trim() ? tags.name.trim().slice(0, 140) : 'Unnamed veterinary facility';
  const phone = tags['contact:phone'] || tags.phone || null;
  return {
    id: `${el.type}-${el.id}`, name: label, lat, lon,
    distanceKm: distanceKm(originLat, originLon, lat, lon),
    address: addressFromTags(tags),
    phone: typeof phone === 'string' ? phone.slice(0, 80) : null,
    openingHours: typeof tags.opening_hours === 'string' ? tags.opening_hours.slice(0, 140) : null,
    osmUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
  };
}
function copyCached(cache, key, ms) {
  const existing = cache.get(key);
  if (existing && existing.at + ms > Date.now()) return existing.value;
  cache.delete(key);
  return null;
}
async function requestJson(url, opts, errorLabel) {
  let response;
  try { response = await fetch(url, { ...opts, signal: AbortSignal.timeout(25000) }); }
  catch (_) { const error = new Error(`${errorLabel} is not responding. Please try again later.`); error.status = 503; throw error; }
  if (!response.ok) {
    const error = new Error(`${errorLabel} is temporarily unavailable (HTTP ${response.status}). Try again later.`);
    error.status = [429, 502, 503, 504].includes(response.status) ? 503 : 502;
    throw error;
  }
  try { return await response.json(); }
  catch (_) { const error = new Error(`${errorLabel} returned unreadable map data.`); error.status = 502; throw error; }
}
async function geocodePlace(query) {
  const q = String(query || '').trim();
  if (q.length < 3 || q.length > 100) { const error = new Error('Enter a place name with 3–100 characters.'); error.status = 400; throw error; }
  const agent = providerAgent();
  const key = q.toLowerCase();
  const cached = copyCached(geocodeCache,key,86400000);
  if (cached) return cached;
  if (Date.now() - lastNominatimAt < 1200) { const error = new Error('Please allow a moment between place searches.'); error.status = 429; throw error; }
  lastNominatimAt = Date.now();
  const url = `${NOMINATIM}?q=${encodeURIComponent(q)}&format=jsonv2&limit=1&addressdetails=0`;
  const result = await requestJson(url, { headers: { 'User-Agent': agent, 'Accept': 'application/json' } }, 'Place search');
  if (!Array.isArray(result) || !result[0]) { const error = new Error('No matching place was found. Try a city and province, e.g. General Trias, Cavite.'); error.status = 404; throw error; }
  const item = result[0];
  const lat = Number(item.lat), lon = Number(item.lon);
  if (!validCoordinates(lat,lon)) { const error = new Error('The place service returned invalid coordinates.'); error.status = 502; throw error; }
  const place = { lat, lon, label: String(item.display_name || q).slice(0, 220) };
  geocodeCache.set(key, { at: Date.now(), value: place });
  if (geocodeCache.size > 200) geocodeCache.delete(geocodeCache.keys().next().value);
  return place;
}
async function findClinics(lat, lon, radiusKm = 5) {
  if (!validCoordinates(lat,lon) || ![3,5,10].includes(radiusKm)) { const error = new Error('Invalid search coordinates or search radius.'); error.status = 400; throw error; }
  const agent = providerAgent();
  // Round coordinates for the cache to reduce repeated public service requests.
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}:${radiusKm}`;
  const cached = copyCached(clinicCache,key,600000);
  if (cached) return cached;
  if (Date.now() - lastOverpassAt < 5000) { const error = new Error('Please wait five seconds between new clinic searches.'); error.status = 429; throw error; }
  lastOverpassAt = Date.now();
  const body = new URLSearchParams({ data: overpassQuery(Number(lat.toFixed(5)), Number(lon.toFixed(5)), radiusKm * 1000) });
  const response = await requestJson(OVERPASS, {
    method: 'POST', headers: { 'User-Agent': agent, 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' }, body,
  }, 'Clinic directory');
  if (!Array.isArray(response?.elements)) { const error = new Error('Clinic directory returned invalid data.'); error.status = 502; throw error; }
  const unique = new Map();
  for (const el of response.elements) {
    const clinic = clinicFromElement(el,lat,lon);
    if (clinic && clinic.distanceKm <= radiusKm + 0.2) unique.set(clinic.id,clinic);
  }
  const clinics = [...unique.values()].sort((a,b) => a.distanceKm - b.distanceKm).slice(0,50);
  const result = { clinics, searchedAt: new Date().toISOString(), source: 'OpenStreetMap contributors via Overpass API' };
  clinicCache.set(key,{ at: Date.now(), value: result });
  if (clinicCache.size > 150) clinicCache.delete(clinicCache.keys().next().value);
  return result;
}
module.exports = { validCoordinates, distanceKm, clinicFromElement, overpassQuery, geocodePlace, findClinics };
