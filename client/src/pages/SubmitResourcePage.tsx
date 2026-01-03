import { useState } from 'react';

export default function SubmitResourcePage() {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function normalizeUrl(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setStatus('idle');
    setErrorMessage(null);

    const payload = {
      name: name.trim(),
      url: normalizeUrl(url),
      notes: notes.trim()
    };

    try {
      const res = await fetch('/api/public/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        let message = 'Sorry—your submission could not be sent right now. Please try again later.';
        try {
          const json: unknown = await res.json();
          const details = (json as { details?: any }).details;
          const fieldErrors = details?.fieldErrors as Record<string, string[] | undefined> | undefined;
          const urlErrors = fieldErrors?.url?.filter(Boolean);
          const nameErrors = fieldErrors?.name?.filter(Boolean);
          const notesErrors = fieldErrors?.notes?.filter(Boolean);
          const all = [...(nameErrors || []), ...(urlErrors || []), ...(notesErrors || [])];
          if (all.length) {
            message = all.join(' ');
          } else if (typeof (json as { error?: unknown }).error === 'string') {
            message = (json as { error: string }).error;
          }
        } catch {
          // ignore
        }
        setErrorMessage(message);
        setStatus('error');
        return;
      }
      setStatus('sent');
    } catch {
      setErrorMessage('Sorry—your submission could not be sent right now. Please try again later.');
      setStatus('error');
      return;
    }

    setName('');
    setUrl('');
    setNotes('');
  }

  return (
    <div className="grid gap-6">
      <header className="rounded-2xl border border-vanillaCustard/10 bg-gradient-to-br from-pitchBlack/60 via-pitchBlack/40 to-pitchBlack/30 backdrop-blur-sm p-8 shadow-soft">
        <div className="grid gap-3">
          <h1 className="text-3xl font-extrabold text-vanillaCustard">Submit a Resource</h1>
          <p className="text-base text-vanillaCustard/90">Share something helpful. We review submissions before posting.</p>
        </div>
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
            type="url"
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

        {status === 'error' ? (
          <div className="rounded-2xl bg-graphite/70 p-4 text-base text-vanillaCustard">
            {errorMessage || 'Sorry—your submission could not be sent right now. Please try again later, or message the admins on Facebook/Instagram.'}
          </div>
        ) : null}
      </form>
    </div>
  );
}
