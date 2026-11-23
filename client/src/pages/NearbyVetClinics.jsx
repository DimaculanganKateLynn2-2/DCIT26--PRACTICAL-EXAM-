import { useEffect, useRef, useState } from 'react';
import ClinicMap from '../components/ClinicMap';
import { searchClinicPlace } from '../services/clinicApi';

// Google Maps URLs do not need a Google Maps API key or billing account.
// Clinic listings and directions are displayed by Google Maps, not by VetCare Meadow.
function googleClinicSearchUrl({ place, origin }) {
  let location = place.trim();

  if (origin?.source === 'device' || origin?.source === 'coordinates') {
    location = `${origin.lat.toFixed(6)},${origin.lon.toFixed(6)}`;
  } else if (!location && origin?.label) {
    location = origin.label;
  }

  if (!location) return '';
  const query = `veterinary clinics near ${location}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function validateManualCoordinates(latitudeInput, longitudeInput) {
  const latitude = Number(latitudeInput);
  const longitude = Number(longitudeInput);
  if (
    !latitudeInput.trim() ||
    !longitudeInput.trim() ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180
  ) {
    throw new Error('Enter valid latitude (-90 to 90) and longitude (-180 to 180).');
  }
  return {
    lat: latitude,
    lon: longitude,
    label: `Selected coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    source: 'coordinates',
  };
}

export default function NearbyVetClinics() {
  const [place, setPlace] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [origin, setOrigin] = useState(null);
  const [loadingPlace, setLoadingPlace] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const controllerRef = useRef(null);
  const geoSequenceRef = useRef(0);

  useEffect(() => () => {
    controllerRef.current?.abort();
    geoSequenceRef.current += 1;
  }, []);

  function handlePlaceChange(event) {
    geoSequenceRef.current += 1;
    controllerRef.current?.abort();
    setLoadingPlace(false);
    setPlace(event.target.value);
    setOrigin(null);
    setNotice('');
    setError('');
  }

  async function handlePlaceSearch(event) {
    event.preventDefault();
    const requestedPlace = place.trim();
    if (requestedPlace.length < 3) return;

    geoSequenceRef.current += 1;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoadingPlace(true);
    setNotice('');
    setError('');
    setOrigin(null);

    try {
      // Optional location preview only: Google Maps search works even if geocoding fails.
      const point = await searchClinicPlace(requestedPlace, controller.signal);
      if (!controller.signal.aborted) {
        setOrigin({ ...point, source: 'place' });
        setNotice('Location found. Open Google Maps below to see nearby veterinary clinics.');
      }
    } catch (err) {
      if (!controller.signal.aborted && err.name !== 'AbortError') {
        setNotice('Could not center the preview map. You can still search this place in Google Maps using the button below.');
      }
    } finally {
      if (!controller.signal.aborted) setLoadingPlace(false);
    }
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setError('Location access is unavailable in this browser. Please type a city or use coordinates.');
      return;
    }
    controllerRef.current?.abort();
    const sequence = ++geoSequenceRef.current;
    setLoadingPlace(true);
    setNotice('');
    setError('');

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (sequence !== geoSequenceRef.current) return;
        setPlace('');
        setOrigin({
          lat: coords.latitude,
          lon: coords.longitude,
          label: 'Current device location',
          source: 'device',
        });
        setLoadingPlace(false);
        setNotice('Location selected. Click Find Clinics in Google Maps to view clinic listings.');
      },
      (reason) => {
        if (sequence !== geoSequenceRef.current) return;
        setLoadingPlace(false);
        setError(reason.code === 1
          ? 'Location permission denied. Use the city search or coordinates instead.'
          : 'Could not determine your location. Please enter a city instead.');
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 },
    );
  }

  function handleManualCoordinates(event) {
    event.preventDefault();
    geoSequenceRef.current += 1;
    controllerRef.current?.abort();
    setLoadingPlace(false);
    setError('');
    setNotice('');
    try {
      const point = validateManualCoordinates(manualLat, manualLon);
      setPlace('');
      setOrigin(point);
      setNotice('Coordinates selected. Click Find Clinics in Google Maps below.');
    } catch (err) {
      setError(err.message);
    }
  }

  const googleMapsUrl = googleClinicSearchUrl({ place, origin });
  const searchDescription = origin?.label || place.trim();

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 text-gray-800">
      <p className="font-semibold text-green-700">🐾 VETCARE MEADOW · LOCATION SUPPORT</p>
      <h1 className="mt-2 text-3xl font-extrabold text-green-900 sm:text-4xl">Nearby Veterinary Clinics</h1>
      <p className="mt-3 max-w-3xl text-gray-600">
        Choose your location, preview it on the map, and search for veterinary clinics using Google Maps.
      </p>

      <aside className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950" role="note">
        <strong>Important:</strong> Clinic hours, phone numbers, availability and emergency services must be
        confirmed with the clinic. Google Maps results are provided by Google and are not verified by VetCare Meadow.
        For urgent pet health concerns, seek veterinary assistance promptly.
      </aside>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-green-900">1. Choose a location</h2>
        <p className="mt-2 text-sm text-gray-600">
          We request your current location only if you choose to share it. The preview map uses
          OpenStreetMap tiles. Clicking the Google Maps button sends your chosen place or coordinates
          to Google Maps; this search is not saved in your VetCare account.
        </p>

        <button
          type="button"
          disabled={loadingPlace}
          onClick={handleUseMyLocation}
          className="mt-5 rounded-xl bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900 disabled:opacity-50"
        >
          📍 Use My Current Location
        </button>

        <form onSubmit={handlePlaceSearch} className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label htmlFor="vet-place" className="font-semibold text-green-900">Or search by city, town, or province</label>
            <input
              id="vet-place"
              required
              minLength={3}
              maxLength={100}
              value={place}
              onChange={handlePlaceChange}
              placeholder="e.g. Trece Martires, Cavite, Philippines"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-green-700 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loadingPlace}
            className="rounded-xl border-2 border-green-700 px-5 py-3 font-bold text-green-800 hover:bg-green-50 disabled:opacity-50"
          >
            Preview Place
          </button>
        </form>

        <details className="mt-5 rounded-xl bg-green-50 p-4">
          <summary className="cursor-pointer font-semibold text-green-900">Manual latitude / longitude (optional)</summary>
          <form onSubmit={handleManualCoordinates} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="text-sm font-medium">
              Latitude
              <input
                inputMode="decimal"
                value={manualLat}
                onChange={(event) => setManualLat(event.target.value)}
                placeholder="14.300"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="text-sm font-medium">
              Longitude
              <input
                inputMode="decimal"
                value={manualLon}
                onChange={(event) => setManualLon(event.target.value)}
                placeholder="120.900"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <button disabled={loadingPlace} className="rounded-lg bg-green-700 px-4 py-2 font-semibold text-white disabled:opacity-50">
              Use Coordinates
            </button>
          </form>
        </details>

        {loadingPlace && <p role="status" className="mt-4 text-sm text-green-800">Finding location on preview map…</p>}
        {notice && <p role="status" className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-900">{notice}</p>}
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {searchDescription && <p className="mt-4 text-sm text-gray-600">Selected search area: <strong>{searchDescription}</strong></p>}
      </section>

      <section className="mt-7 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 px-2 text-xl font-bold text-green-900">2. Location preview map</h2>
          <ClinicMap origin={origin} clinics={[]} selectedClinicId={null} />
          <p className="mt-3 px-2 text-xs text-gray-500">
            Map © OpenStreetMap contributors. This map previews your selected location, not a list of nearby clinics.
          </p>
        </div>

        <div className="flex flex-col rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-green-900">3. Find veterinary clinics</h2>
          <p className="mt-3 text-sm text-gray-600">
            Open Google Maps to view nearby veterinary clinics, ratings, available contact information,
            and directions. Results open in a new tab, outside VetCare Meadow.
          </p>
          <div className="mt-6 rounded-xl border border-green-100 bg-green-50 p-5">
            <h3 className="font-semibold text-green-900">🔎 Search in Google Maps</h3>
            <p className="mt-2 text-sm text-gray-600">
              {googleMapsUrl
                ? `Ready to search near ${searchDescription}.`
                : 'Enter a city above or use your location to enable the search.'}
            </p>
            {googleMapsUrl ? (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-green-700 px-4 py-4 text-center font-bold text-white hover:bg-green-800"
              >
                🏥 Find Clinics in Google Maps ↗
              </a>
            ) : (
              <span className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl bg-gray-200 px-4 py-4 text-center font-bold text-gray-500">
                Find Clinics in Google Maps
              </span>
            )}
            <p className="mt-3 text-xs text-gray-600">
              No Google Maps API key or paid subscription is needed to open these search links.
            </p>
          </div>
          <p className="mt-5 text-sm text-gray-600">
            <strong>Note:</strong> Clinic listings are shown in Google Maps rather than loaded into this website.
            Search results are not guaranteed to be complete or ordered by distance.
          </p>
        </div>
      </section>
    </main>
  );
}
