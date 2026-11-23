import { useEffect, useState } from 'react';
import VetCareIcon from '../components/VetCareIcon';
import { getPets } from '../services/petApi';
import { getHealthRecords } from '../services/healthRecordApi';

const actions = [
  { icon: 'map', title: 'Find Veterinary Clinics', page: 'Nearby Veterinary Clinics', caption: 'Search clinics on a map' },
  { icon: 'paw', title: 'Register a Pet', page: 'My Pets', caption: 'Manage your dogs and cats' },
  { icon: 'stethoscope', title: 'Assess Symptoms', page: 'Symptom Assessment', caption: 'Record a pet health observation' },
  { icon: 'bot', title: 'Ask AI Pet Assistant', page: 'AI Pet Assistant', caption: 'General dog and cat care questions' },
  { icon: 'clipboard', title: 'View Health History', page: 'Health History', caption: 'See previous observations' },
  { icon: 'shield', title: 'Safety & Toxins', page: 'Safety & Toxins', caption: 'Explore safety information' },
];

export default function Dashboard({ user, onNavigate }) {
  const [pets, setPets] = useState([]);
  const [records, setRecords] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [petList, history] = await Promise.all([
          getPets(controller.signal), getHealthRecords(controller.signal),
        ]);
        if (!controller.signal.aborted) {
          setPets(petList);
          setRecords(history);
          setError('');
        }
      } catch (err) {
        if (!controller.signal.aborted && err.name !== 'AbortError') {
          setError('Could not load dashboard statistics. Check your backend.');
        }
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <section className="rounded-3xl bg-gradient-to-br from-green-800 to-emerald-700 p-8 text-white">
        <p className="flex items-center gap-2 font-semibold text-green-100"><VetCareIcon name="paw" size={18} /> PET OWNER DASHBOARD</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Welcome, {user.name}!</h1>
        <p className="mt-3 max-w-2xl text-green-100">Manage your pets and keep their owner-reported health observations organized.</p>
      </section>
      {error && <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-gray-500">Registered Pets</p><p className="mt-2 text-4xl font-bold text-green-900">{busy ? '…' : pets.length}</p></div>
        <div className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-gray-500">Recent Saved Observations</p><p className="mt-2 text-4xl font-bold text-green-900">{busy ? '…' : records.length}</p><p className="mt-2 text-xs text-gray-500">Shows the latest 100 records at most.</p></div>
      </div>
      {!busy && pets.length === 0 && !error && <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5 text-green-900">You haven't registered a pet yet. Add your first pet in My Pets.</div>}
      <h2 className="mt-10 text-2xl font-bold text-green-900">Quick Actions</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map(action => (
          <button key={action.title} onClick={() => onNavigate(action.page)} className="rounded-2xl bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="vetcare-feature-icon"><VetCareIcon name={action.icon} size={24} /></span>
            <h3 className="mt-3 font-bold text-green-900">{action.title}</h3>
            <p className="mt-1 text-sm text-gray-600">{action.caption}</p>
          </button>
        ))}
      </div>
      <h2 className="mt-10 text-2xl font-bold text-green-900">Recent Observations</h2>
      <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
        {!busy && records.length === 0 && <p className="text-gray-500">No saved observations yet.</p>}
        {records.slice(0, 3).map(record => (
          <div key={record._id} className="border-b border-gray-100 py-3 last:border-b-0">
            <p className="font-semibold text-green-900">{record.pet?.name || 'Pet'} · {record.symptoms?.join(', ')}</p>
            <p className="mt-1 text-xs text-gray-500">{new Date(record.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-gray-500">AI guidance and AI Pet Assistant use Google's Gemini free tier when configured. Clinic locator and veterinary PDF reports are now available.</p>
    </main>
  );
}
