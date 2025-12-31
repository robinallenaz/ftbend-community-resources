import { useState } from 'react';

export default function NewsletterPage() {
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
      setMessage("You're subscribed! Check your inbox for updates.");
      setEmail('');
    } catch (e: any) {
      setStatus('error');
      setMessage(e?.message || 'Something went wrong. Try again.');
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <section className="grid gap-4">
        <h1 className="text-4xl font-extrabold text-vanillaCustard">Newsletter</h1>
        <p className="text-lg text-vanillaCustard/85">
          Stay up to date with new resources, events, and community news for the LGBTQIA+ Community in Fort Bend and Surrounding Counties.
        </p>
      </section>

      <section className="grid gap-6 rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-8 shadow-soft">
        <h2 className="text-2xl font-extrabold text-vanillaCustard">Subscribe</h2>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-base font-bold text-vanillaCustard">Email address</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
            />
          </label>
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="rounded-xl bg-powderBlush px-6 py-3 text-base font-extrabold text-pitchBlack shadow-soft transition hover:brightness-95 disabled:opacity-60"
          >
            {status === 'submitting' ? 'Subscribing…' : 'Subscribe'}
          </button>
        </form>
        {message ? (
          <div className={`rounded-2xl p-4 text-base ${status === 'success' ? 'bg-graphite/70 text-vanillaCustard' : 'bg-graphite/70 text-vanillaCustard'}`}>
            {message}
          </div>
        ) : null}
      </section>
    </main>
  );
}
