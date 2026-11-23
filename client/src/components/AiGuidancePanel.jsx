import { useState } from 'react';
import { getAiGuidance } from '../services/aiApi';

export default function AiGuidancePanel({ observation }) {
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  async function generate() {
    setBusy(true); setData(null); setError('');
    try { setData(await getAiGuidance(observation)); }
    catch (err) { setError(err.message || 'AI service unavailable.'); }
    finally { setBusy(false); }
  }

  if (observation.emergency) return (
    <section className="mt-7 rounded-xl border-2 border-red-300 bg-red-50 p-5 text-red-900" role="alert">
      <h3 className="font-bold">Emergency warning sign selected</h3>
      <p className="mt-2">Do not wait for AI guidance. Seek emergency veterinary care now.</p>
    </section>
  );

  return (
    <section className="mt-7 rounded-2xl border border-green-200 bg-green-50 p-6">
      <h3 className="text-xl font-bold text-green-900">✨ Educational AI Symptom Guidance</h3>
      <p className="mt-2 text-sm text-gray-700">
        Optional AI-generated information, not a diagnosis or medical prescription. The model can be inaccurate.
      </p>
      <label className="mt-5 flex items-start gap-3 text-sm text-gray-800">
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1" />
        I understand that pet species, age, symptoms, duration, and notes will be sent to the configured external AI provider.
        Names, email, and database record IDs will not be sent.
      </label>
      <button type="button" disabled={!consent || busy} onClick={generate}
        className="mt-5 rounded-xl bg-green-700 px-6 py-3 font-bold text-white disabled:opacity-50">
        {busy ? 'Generating guidance…' : 'Generate AI Guidance'}
      </button>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-red-800">{error} Seek veterinary advice if concerned.</p>}
      {data && <div className={`mt-5 space-y-4 rounded-xl p-5 ${data.urgentWarning ? 'bg-red-50' : 'bg-white'}`}>
        <p className="text-xs font-semibold text-green-800">{data.generatedByAI ? 'AI-GENERATED EDUCATIONAL GUIDANCE' : 'PREDEFINED EMERGENCY SAFETY MESSAGE'}</p>
        <p className="text-lg font-bold text-gray-900">{data.urgency}</p>
        <p className="text-gray-800">{data.summary}</p>
        {[
          ['Possible concerns (not diagnoses)', data.possibleConcerns],
          ['Suggested next steps', data.nextSteps],
          ['Questions to ask your veterinarian', data.questionsForVet],
        ].map(([title, items]) => items?.length > 0 && (
          <div key={title}><h4 className="font-semibold text-green-900">{title}</h4>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-gray-800">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div>
        ))}
        <p className="border-t pt-4 text-xs text-gray-600">{data.disclaimer}</p>
      </div>}
    </section>
  );
}
