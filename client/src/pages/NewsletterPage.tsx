import { useState } from 'react';
import { trackCommunityEvent } from '../utils/analytics-simple';

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
      setMessage("You're subscribed! Check your inbox for a welcome email (it may go to your spam folder - mark us 'not spam' to ensure delivery).");
      setEmail('');
      
      // Track successful newsletter subscription
      trackCommunityEvent('newsletter-subscription', 'success');
    } catch (e: any) {
      setStatus('error');
      setMessage(e?.message || 'Something went wrong. Try again.');
      
      // Track failed newsletter subscription attempt
      trackCommunityEvent('newsletter-subscription', 'error');
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <header className="rounded-2xl border border-vanillaCustard/10 bg-gradient-to-br from-pitchBlack/60 via-pitchBlack/40 to-pitchBlack/30 backdrop-blur-sm p-8 shadow-soft">
        <div className="grid gap-3">
          <h1 className="text-4xl font-extrabold text-vanillaCustard">Newsletter</h1>
          <p className="text-lg text-vanillaCustard/90">
            Stay up to date with new resources, events, and community news for the LGBTQIA+ Community in Fort Bend and Surrounding Counties.
          </p>
        </div>
      </header>

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

        <div className="text-sm text-vanillaCustard/70">
          <p>You can unsubscribe at any time - every email includes an unsubscribe link.</p>
        </div>
      </section>
    </main>
  );
}
