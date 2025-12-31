import { useState } from 'react';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');

    try {
      const res = await fetch('/api/public/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      setStatus('success');
      setMessage("You're subscribed!");
      setEmail('');
    } catch (e: any) {
      setStatus('error');
      setMessage(e?.message || 'Something went wrong.');
    }
  }

  return (
    <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6 shadow-soft">
      <div className="mb-4">
        <h3 className="text-lg font-extrabold text-vanillaCustard">Stay in the loop</h3>
        <p className="text-sm text-vanillaCustard/85">
          Get updates on new resources, events, and community news for the LGBTQIA+ Community in Fort Bend and Surrounding Counties.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
        <div className="flex-1">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address for newsletter
          </label>
          <input
            id="newsletter-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-describedby="newsletter-status"
            aria-invalid={status === 'error'}
            className="w-full rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-base font-semibold text-vanillaCustard placeholder:text-vanillaCustard/50 focus:outline-none focus:ring-2 focus:ring-paleAmber focus:ring-offset-2 focus:ring-offset-pitchBlack"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="rounded-xl bg-powderBlush px-4 py-2 text-base font-extrabold text-pitchBlack shadow-soft transition hover:brightness-95 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-paleAmber focus:ring-offset-2 focus:ring-offset-pitchBlack"
        >
          {status === 'submitting' ? 'Subscribing…' : 'Subscribe'}
        </button>
      </form>
      {message && (
        <div 
          id="newsletter-status"
          className={`mt-3 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-paleAmber focus:ring-offset-2 focus:ring-offset-pitchBlack ${
            status === 'success' ? 'bg-graphite/70 text-vanillaCustard' : 'bg-graphite/70 text-vanillaCustard'
          }`}
          role="alert"
          aria-live="polite"
        >
          {message}
        </div>
      )}
    </div>
  );
}
