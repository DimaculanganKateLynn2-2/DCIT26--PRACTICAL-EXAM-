import { useState } from 'react';
import { downloadVisitSummary } from '../services/healthRecordApi';

export default function PdfDownloadButton({ recordId }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function download() {
    setBusy(true); setError('');
    try {
      const blob = await downloadVisitSummary(recordId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vetcare-visit-summary-${recordId}.pdf`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { setError(err.message || 'Could not download summary.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="mt-3">
      <button type="button" onClick={download} disabled={busy}
        className="w-full rounded-xl border border-green-300 bg-white px-5 py-3 font-semibold text-green-800 hover:bg-green-100 disabled:opacity-50">
        {busy ? 'Preparing PDF…' : '📄 Download Vet Visit Summary (PDF)'}
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
