import { useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { NewsletterCampaign, NewsletterSubscriber } from '../types';
import { api } from '../admin/api';

type CampaignDraft = {
  subject: string;
  htmlContent: string;
  textContent: string;
};

// Sanitization configuration for newsletter content
const newsletterSanitizeConfig = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'strong', 'em', 'u', 's', 'del', 'ins',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'img',
    'div', 'span',
    'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'alt', 'class', 'id', 'src', 'width', 'height',
    'target', 'rel', 'style'
  ],
  ALLOWED_URI_REGEXP: /^https:\/\/(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?::\d{1,5})?(?:\/[a-zA-Z0-9\-._~!$&'()*+,;=:@%\/?]*)?(?:\?[a-zA-Z0-9\-._~!$&'()*+,;=:@%\/?]*)?(?:#[a-zA-Z0-9\-._~!$&'()*+,;=:@%\/?]*)?$|^\/(?:[a-zA-Z0-9\-._~!$&'()*+,;=:@%\/?]*|\.\/[a-zA-Z0-9\-._~!$&'()*+,;=:@%\/?]*)*$/,
  FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'button', 'style', 'link', 'meta', 'svg', 'math', 'video', 'audio', 'canvas'],
  FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur', 'onsubmit', 'onchange', 'data-', 'xlink:href', 'xmlns', 'javascript:', 'vbscript:', 'data:text/html'],
  SANITIZE_DOM: true,
  KEEP_CONTENT: true,
  FORBID_SCRIPT: true,
  SANITIZE_NAMED_PROPS: true,
  SANITIZE_NAMED_PROPS_WITH_PREFIX: ['data'],
  WHOLE_DOCUMENT: false,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  ADD_ATTR: ['target'],
  ADD_URI_SAFE_ATTR: ['href', 'src'],
  CUSTOM_ELEMENT_HANDLING: {
    tagNameCheck: null,
    attributeNameCheck: null,
    allowCustomizedBuiltInElements: false
  }
};

// Sanitize HTML content for safe rendering
function sanitizeNewsletterHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  try {
    // Additional security checks
    if (html.includes('<script') || 
        html.includes('javascript:') || 
        html.includes('vbscript:') || 
        html.includes('data:text/html') ||
        html.includes('onerror=') ||
        html.includes('onload=')) {
      console.warn('Potentially dangerous content detected in newsletter HTML');
      return DOMPurify.sanitize('<p>Content contains potentially unsafe elements</p>', newsletterSanitizeConfig);
    }
    
    return DOMPurify.sanitize(html, newsletterSanitizeConfig);
  } catch (error) {
    console.error('Error sanitizing newsletter HTML:', error);
    return '<p>Error processing content</p>';
  }
}

export default function AdminNewsletterPage() {
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [draft, setDraft] = useState<CampaignDraft>({ subject: '', htmlContent: '', textContent: '' });
  const [markdown, setMarkdown] = useState('');
  const [useMarkdown, setUseMarkdown] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [message, setMessage] = useState('');
  const [previewHtml, setPreviewHtml] = useState(false);

  // Sync markdown to htmlContent when toggled
  useEffect(() => {
    if (useMarkdown) {
      const processMarkdown = async () => {
        const html = await marked(markdown);
        setDraft(prev => ({ ...prev, htmlContent: html }));
      };
      processMarkdown();
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
        ? { ...draft, htmlContent: await marked(markdown) }
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

  const [currentHtml, setCurrentHtml] = useState<string>('');

  // Update currentHtml when markdown or draft changes
  useEffect(() => {
    const updateHtml = async () => {
      if (useMarkdown) {
        const html = await marked(markdown);
        setCurrentHtml(html);
      } else {
        setCurrentHtml(draft.htmlContent);
      }
    };
    updateHtml();
  }, [markdown, draft.htmlContent, useMarkdown]);

  function insertImage() {
    if (!imageUrl) return;
    const imageMd = `![${imageAlt || 'image'}](${imageUrl})`;
    const newMarkdown = markdown ? `${markdown}\n\n${imageMd}\n\n` : `${imageMd}\n\n`;
    setMarkdown(newMarkdown);
    setImageUrl('');
    setImageAlt('');
  }

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-12">
      <header className="rounded-2xl border border-vanillaCustard/10 bg-gradient-to-br from-pitchBlack/60 via-pitchBlack/40 to-pitchBlack/30 backdrop-blur-sm p-8 shadow-soft">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-3">
            <h1 className="text-3xl font-extrabold text-vanillaCustard">Newsletter</h1>
            <p className="text-base text-vanillaCustard/90">Compose and send newsletters to subscribers.</p>
          </div>
          <div className="text-sm text-vanillaCustard/80">
            {subscribers.length} active subscriber{subscribers.length !== 1 ? 's' : ''}
          </div>
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
            <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-4 shadow-soft">
              <div className="mb-3 text-sm text-vanillaCustard/85">
                <strong>Quick Markdown Guide:</strong> <code className="rounded border border-vanillaCustard/20 bg-graphite px-1 py-0.5 text-xs"># Header</code> | <code className="rounded border border-vanillaCustard/20 bg-graphite px-1 py-0.5 text-xs">## Header</code> | <code className="rounded border border-vanillaCustard/20 bg-graphite px-1 py-0.5 text-xs">**<strong>bold</strong>**</code> | <code className="rounded border border-vanillaCustard/20 bg-graphite px-1 py-0.5 text-xs">*<em>italic</em>*</code> | <code className="rounded border border-vanillaCustard/20 bg-graphite px-1 py-0.5 text-xs">[<a href="#" className="text-paleAmber underline">link text</a>](https://example.com)</code> | <code className="rounded border border-vanillaCustard/20 bg-graphite px-1 py-0.5 text-xs">![<em>alt</em>](image-url)</code>
              </div>
              <div className="mb-3 text-sm">
                <a
                  href="https://www.markdownguide.org/basic-syntax/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-paleAmber underline underline-offset-2 hover:no-underline"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Markdown Guide
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-4 shadow-soft">
              <div className="mb-3 text-sm text-vanillaCustard/85">
                <strong>Basic HTML Tags:</strong> <code className="rounded border border-vanillaCustard/20 bg-graphite px-1 py-0.5 text-xs">&lt;h1&gt;Title&lt;/h1&gt;</code> | <code className="rounded border border-vanillaCustard/20 bg-graphite px-1 py-0.5 text-xs">&lt;p&gt;Paragraph&lt;/p&gt;</code> | <code className="rounded border border-vanillaCustard/20 bg-graphite px-1 py-0.5 text-xs">&lt;strong&gt;<strong>Bold</strong>&lt;/strong&gt;</code> | <code className="rounded border border-vanillaCustard/20 bg-graphite px-1 py-0.5 text-xs">&lt;em&gt;<em>Italic</em>&lt;/em&gt;</code> | <code className="rounded border border-vanillaCustard/20 bg-graphite px-1 py-0.5 text-xs">&lt;a href="url"&gt;<a href="#" className="text-paleAmber underline">Link</a>&lt;/a&gt;</code> | <code className="rounded border border-vanillaCustard/20 bg-graphite px-1 py-0.5 text-xs">&lt;img src="url" alt="text"&gt;</code>
              </div>
              <div className="mb-3 text-sm">
                <a
                  href="https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-paleAmber underline underline-offset-2 hover:no-underline"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  HTML Basics
                </a>
              </div>
            </div>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid gap-2">
              <span className="text-sm font-semibold text-vanillaCustard/85">
                {useMarkdown ? 'Markdown' : 'HTML'}
              </span>
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
            <div className="grid gap-2">
              <span className="text-sm font-semibold text-vanillaCustard/85">Live Preview</span>
              <div className="rounded-2xl border border-vanillaCustard/15 bg-graphite p-4 prose prose-invert max-w-none min-h-[12rem]">
                {currentHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: sanitizeNewsletterHtml(currentHtml) }} />
                ) : (
                  <div className="text-vanillaCustard/50 italic">Preview will appear here...</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {useMarkdown && (
          <div className="grid gap-3 rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-4 shadow-soft">
            <div className="text-base font-bold text-vanillaCustard">Insert Image</div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Image URL (https://...)"
                className="w-full rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-base text-vanillaCustard placeholder:text-vanillaCustard/50"
              />
              <input
                type="text"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Alt text (optional)"
                className="w-full rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-base text-vanillaCustard placeholder:text-vanillaCustard/50 sm:w-auto"
              />
              <button
                type="button"
                disabled={!imageUrl}
                onClick={insertImage}
                className="rounded-xl bg-powderBlush px-4 py-2 text-base font-extrabold text-pitchBlack shadow-soft transition hover:brightness-95 disabled:opacity-60"
              >
                Insert
              </button>
            </div>
          </div>
        )}

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
                  <div className="rounded-2xl border border-vanillaCustard/15 bg-white p-4">
                    <div className="mb-2 text-sm font-bold text-gray-600">HTML Preview (Gmail-style):</div>
                    <div
                      className="text-black"
                      dangerouslySetInnerHTML={{ __html: sanitizeNewsletterHtml(c.htmlContent) }}
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
