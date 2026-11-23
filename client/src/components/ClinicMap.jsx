import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const pin = (emoji) => L.divIcon({
  className: 'vetcare-map-pin',
  html: `<span style="display:grid;place-items:center;background:#fff;border:2px solid #166534;border-radius:50%;width:36px;height:36px;box-shadow:0 2px 6px #0003;font-size:19px">${emoji}</span>`,
  iconSize: [36,36], iconAnchor: [18,32], popupAnchor: [0,-26],
});

export default function ClinicMap({ origin, clinics, selectedClinicId, onSelectClinic }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const callbackRef = useRef(onSelectClinic);
  useEffect(() => { callbackRef.current = onSelectClinic; }, [onSelectClinic]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([12.8797,121.7740], 5);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
      maxZoom: 19,
    }).addTo(map);
    const layer = L.layerGroup().addTo(map);
    mapRef.current = map; layerRef.current = layer;
    return () => { layer.clearLayers(); map.remove(); mapRef.current = null; layerRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current, layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    if (origin) {
      L.marker([origin.lat,origin.lon], { icon: pin('📍') }).addTo(layer)
        .bindTooltip('Your selected search point');
      map.setView([origin.lat,origin.lon], 12);
    }
    for (const clinic of clinics) {
      const marker = L.marker([clinic.lat,clinic.lon], {icon:pin(clinic.id===selectedClinicId?'💚':'🏥')}).addTo(layer);
      const popup = document.createElement('div');
      const heading = document.createElement('strong'); heading.textContent = clinic.name;
      const description = document.createElement('p'); description.textContent = `${clinic.distanceKm} km away (straight-line distance)`;
      popup.append(heading, description);
      marker.bindPopup(popup);
      marker.on('click', () => callbackRef.current?.(clinic.id));
      if (selectedClinicId === clinic.id) {
        marker.openPopup(); map.panTo([clinic.lat,clinic.lon]);
      }
    }
  }, [origin, clinics, selectedClinicId]);

  return <div ref={containerRef} className="h-[420px] w-full rounded-2xl border border-green-100" role="region" aria-label="Interactive map showing veterinary facilities" />;
}
