import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { marked } from 'marked';

// Configure marked for better markdown rendering
marked.setOptions({
  breaks: true,
  gfm: true
});

interface BlogPost {
  _id: string;
  title: string;
  content: string;
  authorName: string;
  authorEmail: string;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  categories: string[];
  tags: string[];
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  metaDescription?: string;
  submissionConsent: boolean;
  privacyConsent: boolean;
  createdAt: string;
  publishedAt?: string;
  reviewedByUserId?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  viewCount?: number;
  likeCount?: number;
}

export default function AdminBlogPostEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    authorName: '',
    authorEmail: '',
    status: 'pending' as BlogPost['status'],
    categories: '',
    tags: '',
    slug: '',
    excerpt: '',
    featuredImage: '',
    metaDescription: '',
    reviewNotes: ''
  });

  const isNewPost = id === 'new';

  useEffect(() => {
    if (id && id !== 'new') {
      fetchPost(id);
    } else if (id === 'new') {
      // For new posts, set default values and skip loading
      setFormData({
        title: '',
        content: '',
        authorName: 'Admin',
        authorEmail: '',
        status: 'pending',
        categories: '',
        tags: '',
        slug: '',
        excerpt: '',
        featuredImage: '',
        metaDescription: '',
        reviewNotes: ''
      });
      setLoading(false);
    }
  }, [id]);

  async function fetchPost(postId: string) {
    try {
      const res = await fetch(`/api/admin/blog-posts/${postId}`);
      if (!res.ok) throw new Error('Failed to fetch post');
      const data = await res.json();
      setPost(data.post);
      
      // Populate form data
      setFormData({
        title: data.post.title || '',
        content: data.post.content || '',
        authorName: data.post.authorName || '',
        authorEmail: data.post.authorEmail || '',
        status: data.post.status || 'pending',
        categories: (data.post.categories || []).join(', '),
        tags: (data.post.tags || []).join(', '),
        slug: data.post.slug || '',
        excerpt: data.post.excerpt || '',
        featuredImage: data.post.featuredImage || '',
        metaDescription: data.post.metaDescription || '',
        reviewNotes: data.post.reviewNotes || ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('Starting image upload for file:', file.name, 'Size:', file.size);
    
    // First test if the route is accessible
    try {
      const testRes = await fetch('/api/admin/upload-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('Test route response:', testRes.status, testRes.ok);
      if (testRes.ok) {
        const testData = await testRes.json();
        console.log('Test route response data:', testData);
      }
    } catch (testErr) {
      console.error('Test route failed:', testErr);
    }

    setUploadingImage(true);
    setUploadSuccess(false);
    setError(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      console.log('Sending upload request to /api/admin/upload-image');

      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: uploadFormData
      });

      console.log('Upload response status:', res.status);
      console.log('Upload response ok:', res.ok);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Upload failed with response:', errorText);
        throw new Error(`Failed to upload image: ${res.status} ${errorText}`);
      }

      const data = await res.json();
      console.log('Upload successful, received URL:', data.url);
      
      if (data.url) {
        setFormData(prev => ({ ...prev, featuredImage: data.url }));
        setUploadSuccess(true);
        // Clear success message after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        throw new Error('Upload succeeded but no URL was returned');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isNewPost && !post) return;
    
    setSaving(true);
    setError(null);

    try {
      const payload = {
        title: (formData.title || '').trim(),
        content: (formData.content || '').trim(),
        authorName: (formData.authorName || '').trim() || 'Admin',
        authorEmail: (formData.authorEmail || '').trim() || '',
        status: formData.status,
        categories: (formData.categories || '').split(',').map(c => c.trim()).filter(c => c.length > 0),
        tags: (formData.tags || '').split(',').map(t => t.trim()).filter(t => t.length > 0),
        excerpt: (formData.excerpt || '').trim(),
        featuredImage: (formData.featuredImage || '').trim(),
        metaDescription: (formData.metaDescription || '').trim(),
        ...(isNewPost ? {} : { 
          slug: (formData.slug || '').trim(),
          reviewNotes: (formData.reviewNotes || '').trim()
        })
      };

      const url = isNewPost ? '/api/admin/blog-posts' : `/api/admin/blog-posts/${post!._id}`;
      const method = isNewPost ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to ${isNewPost ? 'create' : 'update'} post`);
      }

      navigate('/admin/blog-posts');
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isNewPost ? 'create' : 'update'} post`);
    } finally {
      setSaving(false);
    }
  }

  const previewHtml = marked(formData.content);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-vanillaCustard/90">Loading blog post...</div>
      </div>
    );
  }

  if (error && !post && !isNewPost) {
    return (
      <div className="rounded-2xl bg-red-900/20 border border-red-500/30 p-4 text-red-200">
        <p>Error: {error}</p>
        <button 
          onClick={() => navigate('/admin/blog-posts')}
          className="mt-2 rounded-xl bg-red-800 px-3 py-1 text-sm hover:bg-red-700 transition"
        >
          Back to Blog Posts
        </button>
      </div>
    );
  }

  if (!post && !isNewPost) {
    return (
      <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-8 text-center">
        <div className="text-vanillaCustard/90">Blog post not found.</div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto space-y-8 p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-vanillaCustard">{isNewPost ? 'Create New Blog Post' : 'Edit Blog Post'}</h2>
        <button
          onClick={() => navigate('/admin/blog-posts')}
          className="rounded-xl bg-pitchBlack border border-vanillaCustard/20 px-4 py-2 text-vanillaCustard hover:bg-pitchBlack/80 transition"
        >
          Back to Blog Posts
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-900/20 border border-red-500/30 p-4 text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid xl:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="xl:col-span-2 space-y-6">
            {/* Title Section */}
            <section className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">
              <label htmlFor="title" className="grid gap-2">
                <span className="text-lg font-bold text-vanillaCustard">Title *</span>
                <input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  maxLength={200}
                  className="w-full rounded-xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard focus:border-powderBlush focus:outline-none focus:ring-2 focus:ring-powderBlush/20 transition-colors"
                  placeholder="Enter blog post title"
                  aria-describedby="title-help"
                />
                <span id="title-help" className="text-sm text-vanillaCustard/60">
                  {formData.title.length}/200 characters
                </span>
              </label>
            </section>

            {/* Slug Section */}
            <section className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">
              <label htmlFor="slug" className="grid gap-2">
                <span className="text-lg font-bold text-vanillaCustard">URL Slug *</span>
                <div className="text-sm text-vanillaCustard/70 mb-2" id="slug-help">
                  The URL-friendly version of the title (e.g., "my-blog-post-title"). Used in: /blog-posts/[slug]
                </div>
                <input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  required
                  className="w-full rounded-xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard focus:border-powderBlush focus:outline-none focus:ring-2 focus:ring-powderBlush/20 transition-colors"
                  placeholder="my-blog-post-title"
                  aria-describedby="slug-help"
                />
              </label>
            </section>

            {/* Content Section */}
            <section className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">
              <label htmlFor="content" className="grid gap-3">
                <span className="text-lg font-bold text-vanillaCustard">Content *</span>
                <div className="text-sm text-vanillaCustard/80" id="content-help">
                  <strong>Quick Markdown Guide:</strong> <code className="rounded border border-vanillaCustard/20 bg-graphite px-2 py-1 text-xs"># Header</code> | <code className="rounded border border-vanillaCustard/20 bg-graphite px-2 py-1 text-xs">**bold**</code> | <code className="rounded border border-vanillaCustard/20 bg-graphite px-2 py-1 text-xs">*italic*</code> | <code className="rounded border border-vanillaCustard/20 bg-graphite px-2 py-1 text-xs">[link](url)</code> | <code className="rounded border border-vanillaCustard/20 bg-graphite px-2 py-1 text-xs">![alt](image-url)</code>
                </div>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  required
                  rows={16}
                  maxLength={10000}
                  className="w-full rounded-xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-mono text-vanillaCustard focus:border-powderBlush focus:outline-none focus:ring-2 focus:ring-powderBlush/20 transition-colors resize-y"
                  placeholder="Write your blog post content here..."
                  aria-describedby="content-help content-char-count"
                />
                <div className="flex justify-between items-center text-sm text-vanillaCustard/60">
                  <span id="content-char-count">{formData.content.length}/10,000 characters</span>
                  <a
                    href="https://www.markdownguide.org/basic-syntax/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-paleAmber underline underline-offset-2 hover:no-underline"
                  >
                    Markdown Guide →
                  </a>
                </div>
              </label>
            </section>

            {/* SEO & Social */}
            <section className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6 space-y-4">
              <h2 className="text-lg font-bold text-vanillaCustard border-b border-vanillaCustard/20 pb-2">SEO & Social</h2>
              
              <label htmlFor="excerpt" className="grid gap-1">
                <span className="text-sm font-semibold text-vanillaCustard">Excerpt</span>
                <textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-vanillaCustard focus:border-powderBlush focus:outline-none focus:ring-2 focus:ring-powderBlush/20 transition-colors resize-y"
                  placeholder="Brief description for social media and previews"
                />
                <span className="text-xs text-vanillaCustard/60">{formData.excerpt.length}/500 characters</span>
              </label>

              <label htmlFor="metaDescription" className="grid gap-1">
                <span className="text-sm font-semibold text-vanillaCustard">Meta Description</span>
                <textarea
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                  maxLength={160}
                  rows={2}
                  className="w-full rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-vanillaCustard focus:border-powderBlush focus:outline-none focus:ring-2 focus:ring-powderBlush/20 transition-colors resize-y"
                  placeholder="SEO meta description (160 chars max)"
                />
                <span className="text-xs text-vanillaCustard/60">{formData.metaDescription.length}/160 characters</span>
              </label>
            </section>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Author & Status */}
            <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6 space-y-4">
              <h2 className="text-lg font-bold text-vanillaCustard border-b border-vanillaCustard/20 pb-2">Author & Status</h2>
              
              <label htmlFor="authorName" className="grid gap-1">
                <span className="text-sm font-semibold text-vanillaCustard">Author Name</span>
                <input
                  id="authorName"
                  value={formData.authorName}
                  onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                  maxLength={100}
                  className="w-full rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-vanillaCustard focus:border-powderBlush focus:outline-none focus:ring-2 focus:ring-powderBlush/20 transition-colors"
                  placeholder="Author name"
                />
              </label>

              <label htmlFor="authorEmail" className="grid gap-1">
                <span className="text-sm font-semibold text-vanillaCustard">Author Email</span>
                <input
                  id="authorEmail"
                  type="email"
                  value={formData.authorEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, authorEmail: e.target.value }))}
                  maxLength={255}
                  className="w-full rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-vanillaCustard focus:border-powderBlush focus:outline-none focus:ring-2 focus:ring-powderBlush/20 transition-colors"
                  placeholder="author@example.com"
                />
              </label>

              <label htmlFor="status" className="grid gap-1">
                <span className="text-sm font-semibold text-vanillaCustard">Status</span>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as BlogPost['status'] }))}
                  className="w-full rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-vanillaCustard focus:border-powderBlush focus:outline-none focus:ring-2 focus:ring-powderBlush/20 transition-colors"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="published">Published</option>
                </select>
              </label>
            </div>

            {/* Metadata */}
            <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6 space-y-4">
              <h2 className="text-lg font-bold text-vanillaCustard border-b border-vanillaCustard/20 pb-2">Metadata</h2>
              
              <label htmlFor="categories" className="grid gap-1">
                <span className="text-sm font-semibold text-vanillaCustard">Categories</span>
                <input
                  id="categories"
                  value={formData.categories}
                  onChange={(e) => setFormData(prev => ({ ...prev, categories: e.target.value }))}
                  className="w-full rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-vanillaCustard focus:border-powderBlush focus:outline-none focus:ring-2 focus:ring-powderBlush/20 transition-colors"
                  placeholder="Personal Story, Community News, Resources"
                />
                <span className="text-xs text-vanillaCustard/60">Comma separated</span>
              </label>

              <label htmlFor="tags" className="grid gap-1">
                <span className="text-sm font-semibold text-vanillaCustard">Tags</span>
                <input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-vanillaCustard focus:border-powderBlush focus:outline-none focus:ring-2 focus:ring-powderBlush/20 transition-colors"
                  placeholder="mental-health, youth, support, local"
                />
                <span className="text-xs text-vanillaCustard/60">Comma separated</span>
              </label>
            </div>

            {/* Featured Image */}
            <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6 space-y-4">
              <h2 className="text-lg font-bold text-vanillaCustard border-b border-vanillaCustard/20 pb-2">Featured Image</h2>
              
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
                    className="cursor-pointer rounded-xl bg-powderBlush px-4 py-2 text-base font-bold text-pitchBlack hover:brightness-95 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-powderBlush/50"
                  >
                    {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  </label>
                  {formData.featuredImage && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, featuredImage: '' }))}
                      className="rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                {uploadSuccess && (
                  <div className="rounded-xl bg-green-600/20 border border-green-500/30 p-3 text-green-200 text-sm" role="alert">
                    ✅ Image uploaded successfully!
                  </div>
                )}
                
                {formData.featuredImage && (
                  <div className="space-y-2">
                    <img
                      src={formData.featuredImage}
                      alt="Featured image preview"
                      className="w-full h-32 object-cover rounded-lg border border-vanillaCustard/20"
                    />
                  </div>
                )}
                
                <label htmlFor="imageUrl" className="grid gap-1">
                  <span className="text-sm font-semibold text-vanillaCustard">Or enter image URL</span>
                  <input
                    id="imageUrl"
                    value={formData.featuredImage || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, featuredImage: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    className="w-full rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-vanillaCustard focus:border-powderBlush focus:outline-none focus:ring-2 focus:ring-powderBlush/20 transition-colors"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Blog Post Preview */}
        <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">
          <h3 className="text-lg font-bold text-vanillaCustard mb-4">Blog Post Preview</h3>
          <div className="border border-vanillaCustard/10 rounded-xl p-6 bg-pitchBlack/50">
            {/* Featured Image */}
            {formData.featuredImage && (
              <div className="mb-6">
                <img
                  src={formData.featuredImage}
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
            <h2 className="text-3xl font-bold text-vanillaCustard mb-4">
              {formData.title || 'Blog Post Title'}
            </h2>
            
            {/* Meta Information */}
            <div className="text-sm text-vanillaCustard/70 mb-6">
              <p>By {formData.authorName || 'Anonymous'} {formData.authorEmail && `(${formData.authorEmail})`}</p>
              <p>{new Date().toLocaleDateString()}</p>
            </div>
            
            {/* Excerpt */}
            {formData.excerpt && (
              <div className="text-vanillaCustard/90 mb-6 italic border-l-4 border-powderBlush pl-4">
                {formData.excerpt}
              </div>
            )}
            
            {/* Categories and Tags */}
            {(formData.categories || formData.tags) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {formData.categories.split(',').map((cat, i) => cat.trim() && (
                  <span key={i} className="rounded-lg bg-powderBlush/20 text-paleAmber px-2 py-1 text-xs">
                    {cat.trim()}
                  </span>
                ))}
                {formData.tags.split(',').map((tag, i) => tag.trim() && (
                  <span key={i} className="rounded-lg bg-graphite border border-vanillaCustard/20 text-vanillaCustard/70 px-2 py-1 text-xs">
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            )}
            
            {/* Content */}
            <div 
              className="prose prose-invert max-w-none text-vanillaCustard/90 [&_p]:leading-relaxed [&_p]:whitespace-pre-wrap [&_li]:whitespace-pre-wrap [&_*]:break-words [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold [&_h1]:text-vanillaCustard [&_h2]:text-vanillaCustard [&_h3]:text-vanillaCustard [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-6 [&_blockquote]:border-l-4 [&_blockquote]:border-powderBlush [&_blockquote]:pl-6 [&_blockquote]:italic [&_a]:text-paleAmber [&_a]:underline [&_code]:bg-graphite [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:text-sm [&_pre]:bg-graphite [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: previewHtml || '<p class="text-vanillaCustard/50">Start typing to see your content preview here...</p>' }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-6 bg-pitchBlack/50 rounded-2xl border border-vanillaCustard/10">
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-powderBlush px-6 py-3 text-lg font-extrabold text-pitchBlack shadow-soft transition hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-powderBlush/50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/admin/blog-posts')}
              className="rounded-xl bg-pitchBlack border border-vanillaCustard/20 px-6 py-3 text-lg font-extrabold text-vanillaCustard shadow-soft transition hover:bg-pitchBlack/80 focus:outline-none focus:ring-2 focus:ring-vanillaCustard/50"
            >
              Cancel
            </button>
          </div>
          
          {post && (
            <div className="text-sm text-vanillaCustard/60">
              Created: {new Date(post.createdAt).toLocaleString()}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
