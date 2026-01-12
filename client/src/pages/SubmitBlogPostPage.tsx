import { useState } from 'react';
import { marked } from 'marked';

// Configure marked for better markdown rendering
marked.setOptions({
  breaks: true,
  gfm: true
});

export default function SubmitBlogPostPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [categories, setCategories] = useState('');
  const [tags, setTags] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [imageRightsConfirmation, setImageRightsConfirmation] = useState(false);
  const [submissionConsent, setSubmissionConsent] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preview markdown
  const previewHtml = marked(content);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadSuccess(false);
    setErrorMessage(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: uploadFormData
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to upload image: ${res.status} ${errorText}`);
      }

      const data = await res.json();
      
      if (data.url) {
        setFeaturedImage(data.url);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        throw new Error('Upload succeeded but no URL was returned');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage(null);

    const payload = {
      title: title.trim(),
      content: content.trim(),
      authorName: authorName.trim() || 'Anonymous',
      authorEmail: authorEmail.trim() || '',
      categories: categories.split(',').map(c => c.trim()).filter(c => c.length > 0 && c.length <= 50),
      tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0 && t.length <= 30),
      excerpt: excerpt.trim(),
      featuredImage: featuredImage.trim(),
      submissionConsent,
      privacyConsent
    };
    console.log('Sending payload:', payload); // Debug log

    try {
      const res = await fetch('/api/public/blog-submissions', {
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
          const titleErrors = fieldErrors?.title?.filter(Boolean);
          const contentErrors = fieldErrors?.content?.filter(Boolean);
          const authorNameErrors = fieldErrors?.authorName?.filter(Boolean);
          const authorEmailErrors = fieldErrors?.authorEmail?.filter(Boolean);
          const categoriesErrors = fieldErrors?.categories?.filter(Boolean);
          const tagsErrors = fieldErrors?.tags?.filter(Boolean);
          const submissionConsentErrors = fieldErrors?.submissionConsent?.filter(Boolean);
          const privacyConsentErrors = fieldErrors?.privacyConsent?.filter(Boolean);
          const all = [...(titleErrors || []), ...(contentErrors || []), ...(authorNameErrors || []), ...(authorEmailErrors || []), ...(categoriesErrors || []), ...(tagsErrors || []), ...(submissionConsentErrors || []), ...(privacyConsentErrors || [])];
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
      // Reset form
      setTitle('');
      setContent('');
      setAuthorName('');
      setAuthorEmail('');
      setCategories('');
      setTags('');
      setExcerpt('');
      setFeaturedImage('');
      setImageRightsConfirmation(false);
      setSubmissionConsent(false);
      setPrivacyConsent(false);
    } catch {
      setErrorMessage('Sorry—your submission could not be sent right now. Please try again later.');
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-8 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-vanillaCustard mb-4">Thank You!</h1>
          <p className="text-vanillaCustard/90 mb-6">
            Your blog post has been submitted for review. We'll review it and let you know if it's approved for publication.
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="rounded-xl bg-powderBlush px-6 py-3 text-lg font-extrabold text-pitchBlack hover:brightness-95 transition"
          >
            Submit Another Post
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="rounded-2xl border border-vanillaCustard/10 bg-gradient-to-br from-pitchBlack/60 via-pitchBlack/40 to-pitchBlack/30 backdrop-blur-sm p-8 shadow-soft mb-6">
        <div className="grid gap-3">
          <h1 className="text-3xl font-extrabold text-vanillaCustard">Submit a Blog Post</h1>
          <p className="text-base text-vanillaCustard/90">
            We invite you to share your story, insights, and experiences with our LGBTQIA+ community. 
            While we're proudly rooted in Fort Bend, Texas, we welcome voices from across our community.
            Every submission is thoughtfully reviewed to ensure it aligns with our mission of support and inclusion.
          </p>
        </div>
      </header>

      <form onSubmit={onSubmit} className="grid gap-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Form Column */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">
              <label className="grid gap-2">
                <span className="text-base font-bold text-vanillaCustard">Title *</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={200}
                  className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
                  placeholder="Enter your blog post title"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">
              <label className="grid gap-2">
                <span className="text-base font-bold text-vanillaCustard">Author Name</span>
                <input
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  maxLength={100}
                  className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
                  placeholder="Your name (leave blank for anonymous)"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">
              <label className="grid gap-2">
                <span className="text-base font-bold text-vanillaCustard">Email (optional)</span>
                <input
                  type="email"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  maxLength={255}
                  className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
                  placeholder="your@email.com (only for follow-up questions)"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">
              <label className="grid gap-2">
                <span className="text-base font-bold text-vanillaCustard">Categories</span>
                <input
                  value={categories}
                  onChange={(e) => setCategories(e.target.value)}
                  className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
                  placeholder="Personal Story, Community News, Resources (comma separated)"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">
              <label className="grid gap-2">
                <span className="text-base font-bold text-vanillaCustard">Tags</span>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
                  placeholder="mental-health, youth, support, local (comma separated)"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">
              <label className="grid gap-2">
                <span className="text-base font-bold text-vanillaCustard">Excerpt</span>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
                  placeholder="Brief description for social media and previews"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">
              <label className="grid gap-2">
                <span className="text-base font-bold text-vanillaCustard">Featured Image</span>
                <p className="text-sm text-vanillaCustard/70">
                  📸 Share your own photos or use free images from Unsplash, Pexels, or Pixabay
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer rounded-xl bg-powderBlush px-4 py-2 text-base font-bold text-pitchBlack hover:brightness-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingImage ? 'Uploading...' : 'Upload Image'}
                    </label>
                    {featuredImage && (
                      <button
                        type="button"
                        onClick={() => setFeaturedImage('')}
                        className="rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700 transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  {uploadSuccess && (
                    <div className="rounded-xl bg-green-600/20 border border-green-500/30 p-3 text-green-200 text-sm">
                      ✅ Image uploaded successfully!
                    </div>
                  )}
                  
                  {featuredImage && (
                    <div className="space-y-2">
                      <img
                        src={featuredImage}
                        alt="Featured image preview"
                        className="max-w-full h-32 object-cover rounded-lg border border-vanillaCustard/20"
                      />
                    </div>
                  )}
                  
                  <input
                    value={featuredImage || ''}
                    onChange={(e) => setFeaturedImage(e.target.value)}
                    placeholder="Or enter image URL directly"
                    className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard"
                  />
                </div>
                
                {/* Image Guidelines */}
                <div className="rounded-xl bg-paleAmber/10 border border-paleAmber/20 p-4">
                  <h4 className="text-sm font-semibold text-paleAmber mb-2">📝 Image Guidelines:</h4>
                  <ul className="text-xs text-vanillaCustard/80 space-y-1">
                    <li>• Your own photos are preferred - community events, personal experiences</li>
                    <li>• Free stock photos: <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="text-paleAmber underline hover:text-vanillaCustard transition-colors">Unsplash.com</a>, <a href="https://pexels.com" target="_blank" rel="noopener noreferrer" className="text-paleAmber underline hover:text-vanillaCustard transition-colors">Pexels.com</a>, or <a href="https://pixabay.com" target="_blank" rel="noopener noreferrer" className="text-paleAmber underline hover:text-vanillaCustard transition-colors">Pixabay.com</a></li>
                    <li>• No watermarks, logos, or copyrighted material</li>
                    <li>• Family-friendly and relevant to LGBTQIA+ community</li>
                    <li>• Minimum 1200x800px for best quality</li>
                  </ul>
                </div>

                {/* Image Rights Confirmation */}
                <label className="flex items-start gap-3 p-3 rounded-lg bg-vanillaCustard/5 border border-vanillaCustard/10">
                  <input
                    type="checkbox"
                    checked={imageRightsConfirmation}
                    onChange={(e) => setImageRightsConfirmation(e.target.checked)}
                    className="mt-1 rounded border-vanillaCustard/20 bg-graphite text-paleAmber focus:ring-paleAmber/50"
                    required
                  />
                  <div className="text-sm text-vanillaCustard/80">
                    <span className="font-medium">Image Rights Confirmation</span>
                    <p className="text-xs mt-1">
                      I confirm this is my own photo or a royalty-free image that I have permission to use. I understand copyrighted images are not allowed.
                    </p>
                  </div>
                </label>
              </label>
            </div>
          </div>

          {/* Content & Preview Column */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">
              <label className="grid gap-2">
                <span className="text-base font-bold text-vanillaCustard">Content *</span>
                <div className="text-sm text-vanillaCustard/85">
                  <strong>Quick Markdown Guide:</strong> <code className="rounded border border-vanillaCustard/20 bg-graphite px-1 py-0.5 text-xs"># Header</code> | <code className="rounded border border-vanillaCustard/20 bg-graphite px-1 py-0.5 text-xs">## Header</code> | <code className="rounded border border-vanillaCustard/20 bg-graphite px-1 py-0.5 text-xs">**<strong>bold</strong>**</code> | <code className="rounded border border-vanillaCustard/20 bg-graphite px-1 py-0.5 text-xs">*<em>italic</em>*</code> | <code className="rounded border border-vanillaCustard/20 bg-graphite px-1 py-0.5 text-xs">[<a href="#" className="text-paleAmber underline">link text</a>](https://example.com)</code> | <code className="rounded border border-vanillaCustard/20 bg-graphite px-1 py-0.5 text-xs">![<em>alt</em>](image-url)</code>
                </div>
                <div className="text-sm">
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
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={12}
                  maxLength={10000}
                  className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-mono text-vanillaCustard"
                  placeholder="Write your blog post content here...

# This is a heading

This is a paragraph with **bold** and *italic* text.

- Bullet point 1
- Bullet point 2"
                />
              </label>
            </div>

            {/* Full Blog Post Preview */}
            {(title || content || featuredImage) && (
              <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">
                <h3 className="text-base font-bold text-vanillaCustard mb-4">Blog Post Preview</h3>
                <div className="border border-vanillaCustard/10 rounded-xl p-6 bg-pitchBlack/50">
                  {/* Featured Image */}
                  {featuredImage && (
                    <div className="mb-6">
                      <img
                        src={featuredImage}
                        alt="Featured image"
                        className="w-full h-64 object-cover rounded-lg border border-vanillaCustard/20"
                        onError={(e) => {
                          e.currentTarget.src = '';
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Title */}
                  <h1 className="text-3xl font-bold text-vanillaCustard mb-4">
                    {title || 'Blog Post Title'}
                  </h1>
                  
                  {/* Meta Information */}
                  <div className="text-sm text-vanillaCustard/70 mb-6">
                    <p>By {authorName || 'Anonymous'} {authorEmail && `(${authorEmail})`}</p>
                    <p>{new Date().toLocaleDateString()}</p>
                  </div>
                  
                  {/* Excerpt */}
                  {excerpt && (
                    <div className="text-vanillaCustard/90 mb-6 italic border-l-4 border-powderBlush pl-4">
                      {excerpt}
                    </div>
                  )}
                  
                  {/* Categories and Tags */}
                  {(categories || tags) && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {categories.split(',').map((cat, i) => cat.trim() && (
                        <span key={i} className="rounded-lg bg-powderBlush/20 text-paleAmber px-2 py-1 text-xs">
                          {cat.trim()}
                        </span>
                      ))}
                      {tags.split(',').map((tag, i) => tag.trim() && (
                        <span key={i} className="rounded-lg bg-graphite border border-vanillaCustard/20 text-vanillaCustard/70 px-2 py-1 text-xs">
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Content */}
                  {content && (
                    <div 
                      className="prose prose-invert max-w-none text-vanillaCustard/90 [&>*]:mb-4 [&>h1]:text-2xl [&>h2]:text-xl [&>h3]:text-lg [&>h1]:font-bold [&>h2]:font-bold [&>h3]:font-bold [&>h1]:text-vanillaCustard [&>h2]:text-vanillaCustard [&>h3]:text-vanillaCustard [&>ul]:list-disc [&>ol]:list-decimal [&>li]:ml-6"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Consent checkboxes */}
        <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={submissionConsent}
                onChange={(e) => setSubmissionConsent(e.target.checked)}
                required
                className="mt-1 rounded border-vanillaCustard/20 bg-graphite text-powderBlush focus:ring-powderBlush"
              />
              <span className="text-sm text-vanillaCustard/90">
                I consent to the publication of this content on the Fort Bend LGBTQIA+ Community Resources website. 
                I understand that my submission may be edited for clarity, length, and style while preserving the original meaning.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyConsent}
                onChange={(e) => setPrivacyConsent(e.target.checked)}
                required
                className="mt-1 rounded border-vanillaCustard/20 bg-graphite text-powderBlush focus:ring-powderBlush"
              />
              <span className="text-sm text-vanillaCustard/90">
                I have read and agree to the privacy policy. I understand that my personal information will never be used for monetization, profit, or shared with third parties, and that I can request removal of my content at any time.
              </span>
            </label>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={status === 'sending' || !submissionConsent || !privacyConsent}
          className="rounded-xl bg-powderBlush px-6 py-3 text-lg font-extrabold text-pitchBlack shadow-soft transition hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'sending' ? 'Submitting...' : 'Submit Blog Post'}
        </button>

        {/* Error message */}
        {status === 'error' && errorMessage ? (
          <div className="rounded-2xl bg-red-900/20 border border-red-500/30 p-4 text-base text-red-200">
            {errorMessage}
          </div>
        ) : null}
      </form>
    </div>
  );
}
