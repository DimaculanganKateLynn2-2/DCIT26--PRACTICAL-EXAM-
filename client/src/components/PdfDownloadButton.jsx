import { useState } from 'react';
import { getHealthRecordPdf } from '../services/pdfApi';

function safeName(name) {
  const cleaned = String(name || 'pet').trim().replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 40);
  return cleaned || 'pet';
}

export default function PdfDownloadButton({ recordId, petName = 'pet' }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  async function download() {
    if (!recordId || downloading) return;
    setDownloading(true);
    setError('');
    try {
      const blob = await getHealthRecordPdf(recordId);
      if (!blob || !blob.size || !blob.type.includes('pdf')) {
        throw new Error('The server did not return a valid PDF.');
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VetCare-${safeName(petName)}-Visit-Summary.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 3000);
    } catch (err) {
      setError(err.message || 'Could not download PDF.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={!recordId || downloading}
        onClick={download}
        className="rounded-lg border border-green-600 px-4 py-2 font-semibold text-green-800 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {downloading ? 'Preparing PDF...' : '📄 Download Vet Summary PDF'}
      </button>
      {error && <span role="alert" className="max-w-72 text-sm text-red-700">{error}</span>}
    </span>
  );
}
