import { useEffect, useState } from 'react';
import { getHealthRecords, deleteHealthRecord } from '../services/healthRecordApi';
import PdfDownloadButton from '../components/PdfDownloadButton';

function ReportList({ title, items }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return <div className="mt-4"><h4 className="font-semibold text-green-900">{title}</h4><ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700">{items.map((text, i) => <li key={i} className="break-words">{text}</li>)}</ul></div>;
}
export default function HealthHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [petFilter, setPetFilter] = useState('all');
  const [expandedId, setExpandedId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    getHealthRecords(controller.signal)
      .then(items => { if (!controller.signal.aborted) { setRecords(Array.isArray(items) ? items : []); setError(''); } })
      .catch(err => { if (!controller.signal.aborted && err.name !== 'AbortError') setError(err.message || 'Could not load health history.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);
  const pets = [...new Map(records.filter(r => r.pet?._id).map(r => [r.pet._id, r.pet])).values()];
  const filtered = records.filter(r => petFilter === 'all' || r.pet?._id === petFilter);
  async function remove(id) {
    if (!window.confirm('Delete this observation permanently?')) return;
    setDeletingId(id); setError('');
    try {
      await deleteHealthRecord(id);
      setRecords(prev => prev.filter(r => r._id !== id));
    } catch (err) { setError(err.message || 'Could not delete the record.'); }
    finally { setDeletingId(''); }
  }
  return <main className="mx-auto max-w-5xl px-5 py-10">
    <h1 className="text-4xl font-bold text-green-900">Pet Health History</h1>
    <p className="mt-3 text-gray-600">Review owner-reported observations and previously saved AI educational guidance. These are not veterinarian-confirmed medical records.</p>
    <div className="mt-6 flex flex-wrap items-end justify-between gap-3 rounded-2xl bg-white p-5 shadow-sm">
      <div><label htmlFor="history-pet" className="block font-semibold text-green-900">Select a pet</label><select id="history-pet" value={petFilter} onChange={e => setPetFilter(e.target.value)} className="mt-2 min-w-48 rounded-lg border border-gray-300 p-3"><option value="all">All registered pets</option>{pets.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}</select></div>
      <button type="button" onClick={() => setRefresh(n => n + 1)} disabled={loading} className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white disabled:opacity-50">Refresh Records</button>
    </div>
    {loading && <p role="status" className="mt-6 text-gray-600">Loading health records...</p>}
    {error && <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    {!loading && filtered.length === 0 && <p className="mt-6 rounded-xl bg-white p-6 text-gray-600">No observations saved for this selection yet.</p>}
    <div className="mt-6 space-y-5">{filtered.map(record => {
      const report = record.aiReport;
      const expanded = expandedId === record._id;
      return <article key={record._id} className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-xl font-bold text-green-900">🐾 {record.petSnapshot?.name || record.pet?.name || 'Registered Pet'}</h2><p className="mt-1 text-sm text-gray-500">{record.createdAt ? new Date(record.createdAt).toLocaleString() : 'Date unavailable'}</p><p className="mt-2 text-gray-700">{record.symptoms?.join(', ') || 'No listed symptoms'}</p></div>
          <span className={`rounded-full px-3 py-1 text-sm font-bold ${record.emergencyFlag || report?.urgency === 'High' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>{report ? `AI urgency: ${report.urgency}` : record.emergencyFlag ? 'Emergency sign' : 'Observation only'}</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <PdfDownloadButton recordId={record._id} petName={record.petSnapshot?.name || record.pet?.name || 'pet'} /><button type="button" onClick={() => setExpandedId(expanded ? '' : record._id)} className="rounded-lg border border-green-600 px-4 py-2 font-semibold text-green-900">{expanded ? 'Hide Details' : 'View Details'}</button><button type="button" disabled={deletingId === record._id} onClick={() => remove(record._id)} className="rounded-lg border border-red-300 px-4 py-2 font-semibold text-red-700 disabled:opacity-50">{deletingId === record._id ? 'Deleting...' : 'Delete'}</button></div>
        {expanded && <div className="mt-5 border-t border-gray-100 pt-5">
          <p><strong>Duration:</strong> {record.duration}</p>
          {record.petSnapshot && <p className="mt-2"><strong>Pet at assessment:</strong> {record.petSnapshot.species} · {record.petSnapshot.breed || 'Unknown breed'} · {record.petSnapshot.age} years · {record.petSnapshot.sex}</p>}
          {record.symptomDetails?.length > 0 && <div className="mt-3"><strong>Severity (owner-reported):</strong><ul className="mt-2 list-inside list-disc">{record.symptomDetails.map((s, i) => <li key={i}>{s.name}: {s.severity}</li>)}</ul></div>}
          {record.notes && <p className="mt-3 whitespace-pre-wrap break-words"><strong>Owner notes:</strong> {record.notes}</p>}
          {report ? <section className="mt-5 rounded-xl bg-green-50 p-5"><h3 className="text-lg font-bold text-green-900">AI Educational Guidance · {report.urgency} urgency</h3><p className="mt-1 text-sm text-gray-600">Not a diagnosis. Generated using {record.aiModel || 'Gemini'}.</p><ReportList title="Possible concerns" items={report.possibleConcerns} /><ReportList title="Explanations" items={report.explanations} /><ReportList title="Next steps" items={report.nextSteps} /><ReportList title="Warning signs" items={report.warningSigns} /><ReportList title="Questions for the veterinarian" items={report.questionsForVet} /><p className="mt-5 text-xs text-green-950">{report.disclaimer || 'Educational guidance only, not professional veterinary advice.'}</p></section> : <p className="mt-4 text-sm text-gray-500">This is an observation-only record. No AI report was generated.</p>}
        </div>}
      </article>;
    })}</div>
  </main>;
}
