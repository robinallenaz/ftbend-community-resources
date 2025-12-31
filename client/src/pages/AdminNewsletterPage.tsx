import { useState, useEffect } from 'react';
import { marked } from 'marked';
import type { NewsletterCampaign, NewsletterSubscriber } from '../types';
import { api } from '../admin/api';

type CampaignDraft = {
  subject: string;
  htmlContent: string;
  textContent: string;
};

export default function AdminNewsletterPage() {
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [draft, setDraft] = useState<CampaignDraft>({ subject: '', htmlContent: '', textContent: '' });
  const [markdown, setMarkdown] = useState('');
  const [useMarkdown, setUseMarkdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [message, setMessage] = useState('');
  const [previewHtml, setPreviewHtml] = useState(false);

  // Sync markdown to htmlContent when toggled
  useEffect(() => {
    if (useMarkdown) {
      const html = marked(markdown);
      setDraft(prev => ({ ...prev, htmlContent: html }));
    }
  }, [markdown, useMarkdown]);

  // Sync htmlContent back to markdown when switching from HTML to markdown
  useEffect(() => {
    if (!useMarkdown && draft.htmlContent) {
      // Basic reverse conversion (not perfect but functional)
      const md = draft.htmlContent
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1')
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1')
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
        .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
        .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, '');
      setMarkdown(md.trim());
    }
  }, [draft.htmlContent, useMarkdown]);

  async function load() {
    const [cRes, sRes] = await Promise.all([
      api.get<{ items: NewsletterCampaign[] }>('/api/admin/newsletter/campaigns'),
      api.get<{ items: NewsletterSubscriber[] }>('/api/admin/newsletter/subscribers')
    ]);
    setCampaigns(cRes.items);
    setSubscribers(sRes.items);
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    setSaving(true);
    setMessage('');
    try {
      const finalDraft = useMarkdown
        ? { ...draft, htmlContent: marked(markdown) }
        : draft;
      const res = await api.post<{ campaign: NewsletterCampaign }>('/api/admin/newsletter/campaigns', finalDraft);
      setCampaigns([res.campaign, ...campaigns]);
      setDraft({ subject: '', htmlContent: '', textContent: '' });
      setMarkdown('');
      setMessage('Campaign saved as draft.');
    } catch (e: any) {
      setMessage(e?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(id: string) {
    if (!testEmail) return setMessage('Enter a test email address.');
    setTesting(true);
    setMessage('');
    try {
      await api.post(`/api/admin/newsletter/campaigns/${id}/test`, { to: testEmail });
      setMessage(`Test sent to ${testEmail}`);
    } catch (e: any) {
      setMessage(e?.message || 'Test send failed.');
    } finally {
      setTesting(false);
    }
  }

  async function handleSend(id: string) {
    if (!confirm('Send this campaign to all subscribers? This cannot be undone.')) return;
    setSending(true);
    setMessage('');
    try {
      const res = await api.post<{ status: string; sentCount: number }>(`/api/admin/newsletter/campaigns/${id}/send`);
      setMessage(`Sent to ${res.sentCount} subscribers.`);
      await load();
    } catch (e: any) {
      setMessage(e?.message || 'Send failed.');
    } finally {
      setSending(false);
    }
  }

  const currentHtml = useMarkdown ? marked(markdown) : draft.htmlContent;

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="text-3xl font-extrabold text-vanillaCustard">Newsletter</h1>
          <p className="text-base text-vanillaCustard/85">Compose and send newsletters to subscribers.</p>
        </div>
        <div className="text-sm text-vanillaCustard/70">
          {subscribers.length} active subscriber{subscribers.length !== 1 ? 's' : ''}
        </div>
      </header>

      {message && (
        <div className="rounded-2xl bg-graphite/70 p-4 text-base text-vanillaCustard">{message}</div>
      )}

      <section className="grid gap-6 rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6 shadow-soft">
        <h2 className="text-xl font-extrabold text-vanillaCustard">New Campaign</h2>

        <label className="grid gap-2">
          <span className="text-base font-bold text-vanillaCustard">Subject</span>
          <input
            value={draft.subject}
            onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
            placeholder="Newsletter subject"
            className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
          />
        </label>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-vanillaCustard">Content</span>
            <button
              type="button"
              onClick={() => setUseMarkdown(!useMarkdown)}
              className="rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-sm font-extrabold text-vanillaCustard shadow-soft transition hover:brightness-95"
            >
              {useMarkdown ? 'Switch to HTML' : 'Switch to Markdown'}
            </button>
          </div>
          {useMarkdown ? (
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Write your newsletter in Markdown..."
              rows={12}
              className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-base font-mono text-vanillaCustard"
            />
          ) : (
            <textarea
              value={draft.htmlContent}
              onChange={(e) => setDraft({ ...draft, htmlContent: e.target.value })}
              placeholder="HTML content (you can use basic HTML tags)"
              rows={12}
              className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-base font-mono text-vanillaCustard"
            />
          )}
        </div>

        <label className="grid gap-2">
          <span className="text-base font-bold text-vanillaCustard">Plain Text Content</span>
          <textarea
            value={draft.textContent}
            onChange={(e) => setDraft({ ...draft, textContent: e.target.value })}
            placeholder="Plain text fallback"
            rows={4}
            className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-base font-mono text-vanillaCustard"
          />
        </label>

        {currentHtml && (
          <details className="grid gap-2">
            <summary className="cursor-pointer text-base font-bold text-vanillaCustard hover:text-vanillaCustard/85">
              Live Preview
            </summary>
            <div className="rounded-2xl border border-vanillaCustard/15 bg-graphite p-4 prose prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: currentHtml }} />
            </div>
          </details>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving || !draft.subject || !currentHtml || !draft.textContent}
            onClick={handleSave}
            className="rounded-xl bg-powderBlush px-4 py-3 text-base font-extrabold text-pitchBlack shadow-soft transition hover:brightness-95 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save as Draft'}
          </button>
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-extrabold text-vanillaCustard">Campaigns</h2>
        {campaigns.length === 0 ? (
          <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6 text-vanillaCustard/70">No campaigns yet.</div>
        ) : (
          <div className="grid gap-4">
            {campaigns.map((c) => (
              <div key={c._id} className="grid gap-3 rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="grid gap-1">
                    <h3 className="text-lg font-extrabold text-vanillaCustard">{c.subject}</h3>
                    <p className="text-sm text-vanillaCustard/70">
                      Status: {c.status} | Created: {new Date(c.createdAt).toLocaleDateString()}
                      {c.status === 'sent' && ` | Sent: ${c.sentCount}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.status === 'draft' && (
                      <>
                        <button
                          type="button"
                          disabled={testing}
                          onClick={() => {
                            const email = window.prompt('Send test to:');
                            if (email) {
                              setTestEmail(email);
                              handleTest(c._id);
                            }
                          }}
                          className="rounded-xl bg-graphite px-3 py-2 text-sm font-extrabold text-vanillaCustard shadow-soft transition hover:brightness-95 disabled:opacity-60"
                        >
                          {testing ? 'Sending…' : 'Test'}
                        </button>
                        <button
                          type="button"
                          disabled={sending}
                          onClick={() => handleSend(c._id)}
                          className="rounded-xl bg-powderBlush px-3 py-2 text-sm font-extrabold text-pitchBlack shadow-soft transition hover:brightness-95 disabled:opacity-60"
                        >
                          {sending ? 'Sending…' : 'Send'}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setPreviewHtml(!previewHtml)}
                      className="rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-sm font-extrabold text-vanillaCustard shadow-soft transition hover:brightness-95"
                    >
                      {previewHtml ? 'Hide' : 'Preview'}
                    </button>
                  </div>
                </div>
                {previewHtml && (
                  <div className="rounded-2xl border border-vanillaCustard/15 bg-graphite p-4 prose prose-invert max-w-none">
                    <div className="mb-2 text-sm font-bold text-vanillaCustard/70">HTML Preview:</div>
                    <div
                      className="text-vanillaCustard"
                      dangerouslySetInnerHTML={{ __html: c.htmlContent }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
