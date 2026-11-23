import { useEffect, useRef, useState } from 'react';
import { getPets } from '../services/petApi';
import { createHealthRecord } from '../services/healthRecordApi';
import { runAiAssessment, saveAiAssessment } from '../services/aiApi';

const symptomOptions = [
  { name: 'Loss of Appetite', category: 'General' },
  { name: 'Low Energy', category: 'General' },
  { name: 'Excessive Thirst', category: 'General' },
  { name: 'Unusual Behavior', category: 'General' },
  { name: 'Vomiting', category: 'Digestive' },
  { name: 'Diarrhea', category: 'Digestive' },
  { name: 'Constipation', category: 'Digestive' },
  { name: 'Scratching Skin', category: 'Skin & Ears' },
  { name: 'Ear Redness', category: 'Skin & Ears' },
  { name: 'Head Shaking', category: 'Skin & Ears' },
  { name: 'Coughing', category: 'Respiratory' },
  { name: 'Sneezing', category: 'Respiratory' },
  { name: 'Limping', category: 'Movement' },
  { name: 'Difficulty Breathing', category: 'Emergency Signs', emergency: true },
  { name: 'Seizures', category: 'Emergency Signs', emergency: true },
  { name: 'Collapse', category: 'Emergency Signs', emergency: true },
  { name: 'Heavy Bleeding', category: 'Emergency Signs', emergency: true },
  { name: 'Straining to Urinate With No Urine', category: 'Emergency Signs', emergency: true },
];
const categories = ['All', ...new Set(symptomOptions.map(s => s.category))];
const warningSet = new Set(symptomOptions.filter(s => s.emergency).map(s => s.name));
const localNotesWarning = /\b(?:can't breathe|cannot breathe|not breathing|seizures?|collapsed|unresponsive|unconscious|bleeding heavily|cannot urinate|unable to urinate)\b/i;

function ListSection({ title, items }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return <div className="mt-5"><h4 className="font-bold text-green-950">{title}</h4><ul className="mt-2 list-inside list-disc space-y-2 text-gray-700">{items.map((item, i) => <li key={`${i}-${item.slice(0, 12)}`} className="break-words">{item}</li>)}</ul></div>;
}

export default function SymptomChecker() {
  const [pets, setPets] = useState([]);
  const [petsError, setPetsError] = useState('');
  const [petsLoading, setPetsLoading] = useState(true);
  const [petId, setPetId] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [severityBySymptom, setSeverityBySymptom] = useState({});
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [review, setReview] = useState(null);
  const [consent, setConsent] = useState(false);
  const [aiDraft, setAiDraft] = useState(null);
  const [busyAi, setBusyAi] = useState(false);
  const [busySave, setBusySave] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const reviewRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    getPets(controller.signal)
      .then(data => { if (!controller.signal.aborted) setPets(Array.isArray(data) ? data : []); })
      .catch(err => { if (!controller.signal.aborted && err.name !== 'AbortError') setPetsError('Could not load pets. Check the backend.'); })
      .finally(() => { if (!controller.signal.aborted) setPetsLoading(false); });
    return () => controller.abort();
  }, []);
  const selectedPet = pets.find(p => p._id === petId);
  const hasEmergency = selectedSymptoms.some(s => warningSet.has(s)) || localNotesWarning.test(notes);
  const filtered = symptomOptions.filter(s => (category === 'All' || s.category === category) && s.name.toLowerCase().includes(search.trim().toLowerCase()));
  const formBusy = busyAi || busySave;

  function invalidate() {
    setReview(null); setAiDraft(null); setSaved(false); setError(''); setSuccess('');
  }
  function toggleSymptom(name) {
    setSelectedSymptoms(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]);
    setSeverityBySymptom(prev => ({ ...prev, [name]: prev[name] || 'Not Sure' }));
    invalidate();
  }
  function handleReview(event) {
    event.preventDefault();
    if (!selectedPet) return setError('Please select a registered pet.');
    if (selectedSymptoms.length === 0) return setError('Choose at least one symptom.');
    if (!duration) return setError('Please choose symptom duration.');
    setError(''); setSuccess(''); setAiDraft(null); setSaved(false);
    setReview({
      petId: selectedPet._id, pet: { name: selectedPet.name, species: selectedPet.species, age: selectedPet.age, breed: selectedPet.breed, sex: selectedPet.sex },
      symptoms: [...selectedSymptoms], severityBySymptom: Object.fromEntries(selectedSymptoms.map(s => [s, severityBySymptom[s] || 'Not Sure'])),
      duration, notes: notes.trim(), emergencyFlag: hasEmergency,
    });
    window.requestAnimationFrame(() => reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
  async function generateGuidance() {
    if (!review || !consent || formBusy) return;
    setBusyAi(true); setAiDraft(null); setError(''); setSuccess('');
    try {
      const data = await runAiAssessment({
        petId: review.petId, symptoms: review.symptoms, severityBySymptom: review.severityBySymptom,
        duration: review.duration, notes: review.notes,
      });
      setAiDraft(data);
    } catch (err) { setError(err.message || 'AI guidance unavailable. You may still save the observations.'); }
    finally { setBusyAi(false); }
  }
  async function saveRecord() {
    if (!review || saved || formBusy) return;
    setBusySave(true); setError(''); setSuccess('');
    try {
      if (aiDraft?.draftId) {
        await saveAiAssessment(aiDraft.draftId);
        setSuccess('AI assessment and owner-reported observations saved to Health History.');
      } else {
        await createHealthRecord({ petId: review.petId, symptoms: review.symptoms, duration: review.duration, notes: review.notes });
        setSuccess('Observations saved without AI guidance. You can review them in Health History.');
      }
      setSaved(true);
    } catch (err) { setError(err.message || 'Could not save the record.'); }
    finally { setBusySave(false); }
  }

  return <main className="mx-auto max-w-6xl px-5 py-10 text-gray-800">
    <p className="font-semibold text-green-700">🐾 PET HEALTH & WELLNESS</p>
    <h1 className="mt-3 text-4xl font-bold text-green-900">AI-Assisted Symptom Assessment</h1>
    <p className="mt-3 text-gray-600">Report observations about a registered dog or cat, review them, then request optional AI educational guidance.</p>
    <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
      <strong>Important:</strong> This is not a diagnosis, a substitute for a veterinarian, or a complete emergency screening tool. If your pet has severe or rapidly worsening signs, contact an emergency veterinarian immediately. Never delay care to use AI.
    </div>
    <form className="mt-8 space-y-7" onSubmit={handleReview}>
      <fieldset className="contents" disabled={formBusy}>
        <section className="rounded-3xl bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-bold text-green-900">1. Choose a Registered Pet</h2>
          <label className="mt-5 block font-semibold" htmlFor="pet-choice">Your pet</label>
          <select id="pet-choice" required value={petId} disabled={petsLoading} onChange={e => { setPetId(e.target.value); invalidate(); }} className="mt-2 w-full rounded-xl border border-green-300 p-4">
            <option value="">-- Select your pet --</option>
            {pets.map(p => <option key={p._id} value={p._id}>{p.name} ({p.species})</option>)}
          </select>
          {petsLoading && <p className="mt-2 text-sm text-gray-500">Loading your pets...</p>}
          {petsError && <p role="alert" className="mt-2 text-red-700">{petsError}</p>}
          {!petsLoading && pets.length === 0 && !petsError && <p className="mt-2 text-amber-800">No pets yet. Register a pet in My Pets first.</p>}
          {selectedPet && <div className="mt-5 rounded-2xl bg-green-50 p-5"><strong className="text-green-900">{selectedPet.species === 'Dog' ? '🐶' : '🐱'} {selectedPet.name}</strong><p className="mt-1 text-sm text-gray-700">{selectedPet.species} · {selectedPet.breed || 'Breed unspecified'} · {selectedPet.age} years old · {selectedPet.sex || 'Sex unspecified'}</p></div>}
        </section>
        <section className="rounded-3xl bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-bold text-green-900">2. Select Observed Symptoms</h2>
          <input aria-label="Search symptoms" type="search" placeholder="Search symptoms..." value={search} onChange={e => setSearch(e.target.value)} className="mt-5 w-full rounded-xl border border-gray-300 p-3" />
          <div className="mt-4 flex flex-wrap gap-2">{categories.map(c => <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} className={`rounded-full px-4 py-2 text-sm font-semibold ${category === c ? 'bg-green-700 text-white' : 'bg-green-50 text-green-900'}`}>{c}</button>)}</div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(s => <button type="button" aria-pressed={selectedSymptoms.includes(s.name)} key={s.name} onClick={() => toggleSymptom(s.name)} className={`rounded-xl border-2 p-4 text-left ${selectedSymptoms.includes(s.name) ? 'border-green-600 bg-green-100' : 'border-gray-200 hover:border-green-300'}`}>{selectedSymptoms.includes(s.name) ? '☑' : '☐'} {s.name}</button>)}</div>
          <h3 className="mt-7 font-bold text-green-900">Selected symptoms ({selectedSymptoms.length})</h3>
          {selectedSymptoms.length === 0 && <p className="mt-2 text-gray-500">Choose at least one symptom.</p>}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">{selectedSymptoms.map(name => <div key={name} className="rounded-xl bg-green-50 p-4"><div className="flex items-center justify-between gap-2"><span className="font-semibold">{name}</span><button type="button" aria-label={`Remove ${name}`} onClick={() => toggleSymptom(name)} className="text-red-700">Remove</button></div><label htmlFor={`severity-${name}`} className="mt-2 block text-sm">How severe does it appear?</label><select id={`severity-${name}`} value={severityBySymptom[name] || 'Not Sure'} onChange={e => { setSeverityBySymptom(prev => ({ ...prev, [name]: e.target.value })); invalidate(); }} className="mt-1 w-full rounded-lg border border-green-300 bg-white p-2">{['Not Sure', 'Mild', 'Moderate', 'Severe'].map(v => <option key={v}>{v}</option>)}</select></div>)}</div>
          {hasEmergency && <p role="alert" className="mt-5 rounded-xl border-2 border-red-300 bg-red-50 p-5 font-semibold text-red-900">🚨 Potential emergency warning sign reported. Seek immediate veterinary care; do not wait for an AI report.</p>}
        </section>
        <section className="rounded-3xl bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-bold text-green-900">3. Additional Observations</h2>
          <label htmlFor="duration" className="mt-5 block font-semibold">Symptom duration</label>
          <select id="duration" required value={duration} onChange={e => { setDuration(e.target.value); invalidate(); }} className="mt-2 w-full rounded-xl border border-gray-300 p-4"><option value="">Select duration</option>{['Just started', 'Less than 24 hours', '1-2 days', '3 days or longer', 'Not sure'].map(d => <option key={d}>{d}</option>)}</select>
          <label htmlFor="notes" className="mt-5 block font-semibold">Additional notes (optional)</label>
          <textarea id="notes" rows="4" maxLength={1500} value={notes} onChange={e => { setNotes(e.target.value); invalidate(); }} placeholder="What else have you observed? Avoid names, contact information, or other personal data." className="mt-2 w-full rounded-xl border border-gray-300 p-4" />
          {error && !review && <p role="alert" className="mt-4 text-red-700">{error}</p>}
          <button type="submit" className="mt-6 w-full rounded-xl bg-green-700 px-6 py-4 font-bold text-white hover:bg-green-800">Review Assessment →</button>
        </section>
      </fieldset>
    </form>
    {review && <section ref={reviewRef} className="mt-8 scroll-mt-6 rounded-3xl border border-green-200 bg-white p-7 shadow-sm">
      <h2 className="text-2xl font-bold text-green-900">4. Review Before AI Guidance</h2>
      <p className="mt-2 text-sm text-gray-500">Check your information. Go back and edit any incorrect entries before requesting AI.</p>
      <div className="mt-5 space-y-2"><p><strong>Pet:</strong> {review.pet.name} ({review.pet.species})</p><p><strong>Duration:</strong> {review.duration}</p><ul className="list-inside list-disc">{review.symptoms.map(s => <li key={s}>{s} — {review.severityBySymptom[s]}</li>)}</ul>{review.notes && <p className="whitespace-pre-wrap break-words"><strong>Notes:</strong> {review.notes}</p>}</div>
      {review.emergencyFlag && <div role="alert" className="mt-5 rounded-xl bg-red-50 p-4 font-semibold text-red-800">🚨 Emergency sign reported: seek immediate veterinary attention. AI is not needed first.</div>}
      <div className="mt-6 rounded-xl border border-gray-200 p-4">
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={consent} disabled={formBusy} onChange={e => setConsent(e.target.checked)} className="mt-1" /><span>I consent to sending this demo pet profile and symptom information to Google's Gemini API to generate educational guidance. I understand free-tier data may be used to improve Google's services. I will not include real personal or sensitive data.</span></label>
        <button type="button" disabled={!consent || formBusy || saved} onClick={generateGuidance} className="mt-4 w-full rounded-xl bg-green-700 px-5 py-4 font-bold text-white hover:bg-green-800 disabled:opacity-50">{busyAi ? 'Generating guidance...' : aiDraft ? 'Regenerate AI Guidance' : '✨ Generate AI Guidance'}</button>
        <p className="mt-2 text-xs text-gray-500">AI requests use the free-tier model set by your server administrator. Limited requests; no automatic paid fallback.</p>
      </div>
      {aiDraft && <div className="mt-6 rounded-xl border border-green-300 bg-green-50 p-5">
        <h3 className="text-xl font-bold text-green-900">AI Educational Guidance</h3>
        <p className="mt-2 font-bold text-green-900">Urgency: {aiDraft.report.urgency}</p>
        <p className="mt-2 text-sm text-gray-600">This urgency label cannot rule out emergencies or establish a diagnosis.</p>
        <ListSection title="Possible concerns (not diagnoses)" items={aiDraft.report.possibleConcerns} />
        <ListSection title="Explanations" items={aiDraft.report.explanations} />
        <ListSection title="Recommended next steps" items={aiDraft.report.nextSteps} />
        <ListSection title="Warning signs" items={aiDraft.report.warningSigns} />
        <ListSection title="Questions to ask a veterinarian" items={aiDraft.report.questionsForVet} />
        <p className="mt-5 text-sm text-green-950">{aiDraft.report.disclaimer}</p>
      </div>}
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      {success && <p role="status" className="mt-5 rounded-xl bg-green-50 p-4 font-semibold text-green-900">{success}</p>}
      <button type="button" onClick={saveRecord} disabled={formBusy || saved} className="mt-6 w-full rounded-xl border-2 border-green-700 bg-white px-6 py-4 font-bold text-green-900 hover:bg-green-50 disabled:opacity-50">{busySave ? 'Saving...' : saved ? '✓ Record Saved' : aiDraft ? '💾 Confirm and Save AI Assessment' : '💾 Save Observations Without AI'}</button>
      <p className="mt-2 text-sm text-gray-500">Saving is optional; records are associated only with your account and selected pet.</p>
    </section>}
  </main>;
}
