import { useState } from 'react';

export default function SubmitResourcePage() {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'sent'>('idle');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setStatus('idle');

    const payload = { name, url, notes };

    try {
      await fetch('/api/public/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setStatus('sent');
    } catch {
      setStatus('sent');
    }

    setName('');
    setUrl('');
    setNotes('');
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-extrabold text-vanillaCustard">Submit a Resource</h1>
        <p className="text-base text-vanillaCustard/85">Share something helpful. We review submissions before posting.</p>
      </header>

      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6 shadow-soft">
        <label className="grid gap-2">
          <span className="text-base font-bold text-vanillaCustard">Resource name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-base font-bold text-vanillaCustard">Link (URL)</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            inputMode="url"
            className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-base font-bold text-vanillaCustard">Notes (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
          />
        </label>

        <button type="submit" className="rounded-xl bg-powderBlush px-4 py-3 text-lg font-extrabold text-pitchBlack shadow-soft transition hover:brightness-95">
          Submit
        </button>

        {status === 'sent' ? (
          <div className="rounded-2xl bg-graphite/70 p-4 text-base text-vanillaCustard">
            Thank you. We’ll review your submission.
          </div>
        ) : null}
      </form>
    </div>
  );
}
