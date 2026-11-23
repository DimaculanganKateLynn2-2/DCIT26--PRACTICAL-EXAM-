import { useState } from 'react';
import { sendPetAssistant } from '../services/aiApi';

const warningPattern = /\b(?:can't breathe|cannot breathe|not breathing|seizures?|collapsed|unresponsive|unconscious|bleeding heavily|cannot urinate|unable to urinate)\b/i;
export default function AIPetAssistant() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [serverWarning, setServerWarning] = useState(false);
  const isEmergencyQuestion = warningPattern.test(question);
  async function handleSubmit(event) {
    event.preventDefault();
    if (!question.trim() || !consent || busy) return;
    const next = [...messages, { role: 'user', text: question.trim() }].slice(-8);
    setMessages(next); setQuestion(''); setBusy(true); setError('');
    try {
      const data = await sendPetAssistant(next);
      setMessages(previous => [...previous, { role: 'assistant', text: data.reply }].slice(-12));
      setServerWarning(Boolean(data.emergencyFlag));
    } catch (err) { setError(err.message || 'Unable to contact Gemini.'); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-4xl px-5 py-10">
    <p className="font-semibold text-green-700">🐾 PET HEALTH & WELLNESS</p>
    <h1 className="mt-3 text-4xl font-bold text-green-900">AI Pet Assistant</h1>
    <p className="mt-3 text-gray-600">Ask general dog and cat care questions. This chat is not a symptom diagnosis tool and is not automatically saved to Health History.</p>
    <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">Educational responses only. The assistant cannot prescribe medicines or replace a veterinarian. Seek emergency veterinary care for serious signs.</div>
    <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
      <div className="min-h-72 space-y-4" aria-live="polite">
        {messages.length === 0 && <p className="text-gray-500">Try: “How can I maintain a dog's dental hygiene?” or “What questions should I ask a veterinarian?”</p>}
        {messages.map((m,i) => <div key={`${i}-${m.role}`} className={`rounded-2xl p-4 ${m.role === 'assistant' ? 'bg-green-50' : 'bg-gray-100'}`}><p className="text-xs font-bold uppercase tracking-wide text-gray-500">{m.role === 'user' ? 'You' : 'VetCare AI'}</p><p className="mt-2 whitespace-pre-wrap break-words text-gray-800">{m.text}</p></div>)}
        {busy && <p role="status" className="text-sm text-green-800">Gemini is responding...</p>}
      </div>
      {(isEmergencyQuestion || serverWarning) && <p role="alert" className="mt-4 rounded-xl border-2 border-red-300 bg-red-50 p-4 text-red-900">🚨 Possible emergency concern. Contact an emergency veterinarian now; do not wait for AI.</p>}
      <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
        <label htmlFor="assistant-question" className="font-semibold text-green-900">Your question</label>
        <textarea id="assistant-question" rows={3} maxLength={600} value={question} disabled={busy} onChange={e => { setQuestion(e.target.value); setServerWarning(false); }} placeholder="Ask about general pet care, habits, hygiene, or veterinary visit preparation..." className="w-full rounded-xl border border-gray-300 p-3" />
        <label className="flex items-start gap-3 text-sm text-gray-700"><input type="checkbox" className="mt-1" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>I consent to sending these demo messages to Google's Gemini API. Free-tier data may be used to improve Google's services. I will not submit private or sensitive personal information.</span></label>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={!question.trim() || !consent || busy} className="w-full rounded-xl bg-green-700 px-6 py-4 font-bold text-white hover:bg-green-800 disabled:opacity-50">{busy ? 'Thinking...' : 'Send Question'}</button>
      </form>
    </div>
    <p className="mt-4 text-xs text-gray-500">Only the latest messages are sent to Gemini for context. This demo chat is stored in browser component memory, not as a health record.</p>
  </main>;
}
