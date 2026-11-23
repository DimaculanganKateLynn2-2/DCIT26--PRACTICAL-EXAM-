const test = require('node:test');
const assert = require('node:assert/strict');
const { validCoordinates, distanceKm, clinicFromElement, overpassQuery } = require('../services/clinicService');

test('rejects invalid geographic coordinates', () => {
  assert.equal(validCoordinates(15,121),true);
  assert.equal(validCoordinates(91,121),false);
  assert.equal(validCoordinates(10,NaN),false);
  assert.equal(validCoordinates(14,181),false);
});
test('distance calculation is zero at the same point',()=>{
  assert.equal(distanceKm(14.3,120.9,14.3,120.9),0);
  assert.ok(distanceKm(14.3,120.9,14.31,120.91)>0);
});
test('converts OSM node to a facility without inventing contact details',()=>{
  const c = clinicFromElement({ type:'node',id:34,lat:14.3,lon:120.9,tags:{name:'Demo Vet'} },14.3,120.9);
  assert.equal(c.name,'Demo Vet');
  assert.equal(c.phone,null); assert.equal(c.address,null); assert.equal(c.openingHours,null);
  assert.equal(c.osmUrl,'https://www.openstreetmap.org/node/34');
});
test('supports way/relation center coordinates and existing contact tags',()=>{
  const c=clinicFromElement({type:'way',id:42,center:{lat:14.3,lon:120.9},tags:{'contact:phone':'12345','addr:city':'Example City','opening_hours':'Mo-Fr 09:00-17:00'}},14.3,120.9);
  assert.equal(c.phone,'12345'); assert.equal(c.address,'Example City'); assert.equal(c.openingHours,'Mo-Fr 09:00-17:00');
});
test('ignores objects with invalid ID or location',()=>{
  assert.equal(clinicFromElement({type:'node',id:-1,lat:14,lon:121},14,121),null);
  assert.equal(clinicFromElement({type:'way',id:1},14,121),null);
});
test('query limits returned results and tags to veterinary facilities',()=>{
  const q = overpassQuery(14.3,120.9,5000);
  assert.match(q,/\["amenity"="veterinary"\]/);
  assert.match(q,/out center 100;/);
  assert.doesNotMatch(q,/pet_shop/);
});
