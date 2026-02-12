import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MarkdownProcessor from '../components/MarkdownProcessor';
import { safeSetItem, safeGetItem, safeRemoveItem, tryToFreeStorageSpace } from '../utils/storageUtils';
import { sanitizeInput } from '../utils/validationUtils';



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
  featuredImageAlt?: string;
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
  // Add missing properties
  updatedAt?: string;
  featured?: boolean;
  seoTitle?: string;
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

  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [showDraftRestored, setShowDraftRestored] = useState(false);

  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

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

    featuredImageAlt: '',

    metaDescription: '',

    reviewNotes: ''

  });



  const isNewPost = id === 'new';

  // Memoize individual form fields to prevent excessive re-renders
  const titleValue = useMemo(() => formData.title, [formData.title]);
  const contentValue = useMemo(() => formData.content, [formData.content]);
  const authorNameValue = useMemo(() => formData.authorName, [formData.authorName]);
  const authorEmailValue = useMemo(() => formData.authorEmail, [formData.authorEmail]);
  const statusValue = useMemo(() => formData.status, [formData.status]);
  const categoriesValue = useMemo(() => formData.categories, [formData.categories]);
  const tagsValue = useMemo(() => formData.tags, [formData.tags]);
  const slugValue = useMemo(() => formData.slug, [formData.slug]);
  const excerptValue = useMemo(() => formData.excerpt, [formData.excerpt]);
  const featuredImageValue = useMemo(() => formData.featuredImage, [formData.featuredImage]);
  const featuredImageAltValue = useMemo(() => formData.featuredImageAlt, [formData.featuredImageAlt]);
  const metaDescriptionValue = useMemo(() => formData.metaDescription, [formData.metaDescription]);
  const reviewNotesValue = useMemo(() => formData.reviewNotes, [formData.reviewNotes]);
  
  // Memoize form data string for auto-save (more focused dependencies)
  const formDataString = useMemo(() => {
    return JSON.stringify({
      title: titleValue,
      content: contentValue,
      authorName: authorNameValue,
      authorEmail: authorEmailValue,
      status: statusValue,
      categories: categoriesValue,
      tags: tagsValue,
      slug: slugValue,
      excerpt: excerptValue,
      featuredImage: featuredImageValue,
      featuredImageAlt: featuredImageAltValue,
      metaDescription: metaDescriptionValue,
      reviewNotes: reviewNotesValue
    });
  }, [
    titleValue,
    contentValue,
    authorNameValue,
    authorEmailValue,
    statusValue,
    categoriesValue,
    tagsValue,
    slugValue,
    excerptValue,
    featuredImageValue,
    featuredImageAltValue,
    metaDescriptionValue,
    reviewNotesValue
  ]);



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

        featuredImageAlt: '',

        metaDescription: '',

        reviewNotes: ''

      });

      setLoading(false);

    }

  }, [id]);



  // Load draft on component mount

  useEffect(() => {

    loadDraft();

  }, [id]);



  // Auto-save every 10 seconds with proper cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      const hasContent = formData.title || formData.content || formData.authorName || formData.authorEmail || formData.categories || formData.tags || formData.excerpt || formData.featuredImage || formData.featuredImageAlt || formData.metaDescription || formData.reviewNotes;
      
      if (hasContent && !isSavingDraft && document.visibilityState === 'visible') {
        saveDraft();
      }
    }, 10000); // 10 seconds

    // Clear interval on unmount and when dependencies change
    return () => {
      clearInterval(interval);
    };
  }, [formDataString, id, isSavingDraft, saveDraft]);



  // Clear draft on successful save

  useEffect(() => {

    if (saving === false && error === null && post) {

      clearDraft();

    }

  }, [saving, error, post]);



  // Keyboard shortcut for saving draft

  function handleKeyDown(e: React.KeyboardEvent) {

    if ((e.ctrlKey || e.metaKey) && e.key === 's') {

      e.preventDefault();

      saveDraft();

    }

  }



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

        featuredImageAlt: data.post.featuredImageAlt || '',

        metaDescription: data.post.metaDescription || '',

        reviewNotes: data.post.reviewNotes || ''

      });

    } catch (err) {

      setError(err instanceof Error ? err.message : 'An error occurred');

    } finally {

      setLoading(false);

    }

  }



  // Auto-save functionality
  async function saveDraft() {
    if (isSavingDraft) return;
    
    setIsSavingDraft(true);
    
    try {
      const draft = {
        title: formData.title,
        content: formData.content,
        authorName: formData.authorName,
        authorEmail: formData.authorEmail,
        status: formData.status,
        categories: formData.categories,
        tags: formData.tags,
        slug: formData.slug,
        excerpt: formData.excerpt,
        featuredImage: formData.featuredImage,
        featuredImageAlt: formData.featuredImageAlt,
        metaDescription: formData.metaDescription,
        reviewNotes: formData.reviewNotes,
        postId: id,
        savedAt: new Date().toISOString()
      };

      // Check draft size before saving to prevent memory issues
      const MAX_DRAFT_SIZE = 1024 * 1024; // 1MB limit
      const draftString = JSON.stringify(draft);
      if (draftString.length > MAX_DRAFT_SIZE) {
        console.warn('Draft too large, skipping save to prevent memory issues');
        return;
      }

      try {
        // Try to save the draft safely
        const success = await safeSetItem(`adminBlogPostDraft_${id}`, draft);
        if (success) {
          setLastSaved(new Date());
        } else {
          console.warn('Failed to save draft, trying to clear space');
          
          // Try to free space and retry
          const spaceFreed = await tryToFreeStorageSpace();
          
          if (spaceFreed) {
            const retrySuccess = await safeSetItem(`adminBlogPostDraft_${id}`, draft);
            if (retrySuccess) {
              setLastSaved(new Date());
            }
          }
        }
      } catch (storageError: any) {
        console.error('Error saving draft:', storageError);
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
      // Don't show error to user for draft failures to avoid interruption
    } finally {
      setIsSavingDraft(false);
    }
  }



  async function loadDraft() {
    try {
      const savedDraft = await safeGetItem<any>(`adminBlogPostDraft_${id}`, null);
      
      if (savedDraft) {
        const savedTime = new Date(savedDraft.savedAt);
        const hoursAgo = (Date.now() - savedTime.getTime()) / (1000 * 60 * 60);
        
        // Only restore if draft is less than 24 hours old AND belongs to current post
        if (hoursAgo < 24 && (!savedDraft.postId || savedDraft.postId === id)) {
          // Comprehensive draft validation before restoring
          if (validateDraftStructure(savedDraft)) {
            setFormData({
              title: sanitizeDraftField(savedDraft.title, 'text') || '',
              content: sanitizeDraftField(savedDraft.content, 'text') || '',
              authorName: sanitizeDraftField(savedDraft.authorName, 'text') || '',
              authorEmail: sanitizeDraftField(savedDraft.authorEmail, 'email') || '',
              status: validateDraftStatus(savedDraft.status) || 'pending',
              categories: sanitizeDraftField(savedDraft.categories, 'text') || '',
              tags: sanitizeDraftField(savedDraft.tags, 'text') || '',
              slug: sanitizeDraftField(savedDraft.slug, 'text') || '',
              excerpt: sanitizeDraftField(savedDraft.excerpt, 'text') || '',
              featuredImage: sanitizeDraftField(savedDraft.featuredImage, 'url') || '',
              featuredImageAlt: sanitizeDraftField(savedDraft.featuredImageAlt, 'text') || '',
              metaDescription: sanitizeDraftField(savedDraft.metaDescription, 'text') || '',
              reviewNotes: sanitizeDraftField(savedDraft.reviewNotes, 'text') || ''
            });

            setLastSaved(savedTime);
            setShowDraftRestored(true);
            setTimeout(() => setShowDraftRestored(false), 5000);
          } else {
            console.warn('Invalid draft data structure, clearing corrupted draft');
            await safeRemoveItem(`adminBlogPostDraft_${id}`);
          }
        } else if (savedDraft.postId !== id) {
          // Clear draft if it belongs to a different post
          await safeRemoveItem(`adminBlogPostDraft_${id}`);
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
      // Clear corrupted draft
      await safeRemoveItem(`adminBlogPostDraft_${id}`);
    }
  }

  // Draft validation helper functions
  function validateDraftStructure(draft: any): boolean {
    if (!draft || typeof draft !== 'object') return false;
    
    // Check for required fields with proper types
    const requiredFields = ['title', 'content', 'authorName', 'status'];
    for (const field of requiredFields) {
      if (!(field in draft) || typeof draft[field] !== 'string') {
        return false;
      }
    }
    
    // Validate status enum
    const validStatuses = ['pending', 'approved', 'rejected', 'published'];
    if (!validStatuses.includes(draft.status)) {
      return false;
    }
    
    // Check for suspicious or corrupted data
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:text\/html/i,
      /on\w+\s*=/i,
      /expression\s*\(/i
    ];
    
    // Check all string fields for suspicious patterns
    for (const [key, value] of Object.entries(draft)) {
      if (typeof value === 'string' && suspiciousPatterns.some(pattern => pattern.test(value))) {
        console.warn(`Suspicious content detected in draft field: ${key}`);
        return false;
      }
    }
    
    return true;
  }

  function sanitizeDraftField(value: any, type: 'text' | 'email' | 'url'): string {
    if (value === null || value === undefined) return '';
    if (typeof value !== 'string') return String(value);
    
    // Basic sanitization
    let sanitized = value.trim();
    
    // Remove potentially dangerous characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Type-specific validation
    switch (type) {
      case 'email':
        // Basic email format validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(sanitized)) return '';
        break;
      case 'url':
        // Basic URL validation - allow relative and absolute URLs
        if (sanitized && !sanitized.startsWith('/') && !sanitized.startsWith('http')) {
          return '';
        }
        break;
    }
    
    // Length limits
    const maxLengths = {
      title: 200,
      content: 10000,
      authorName: 100,
      authorEmail: 255,
      categories: 500,
      tags: 500,
      slug: 200,
      excerpt: 500,
      featuredImage: 500,
      featuredImageAlt: 200,
      metaDescription: 160,
      reviewNotes: 1000
    };
    
    const fieldName = Object.keys(maxLengths).find(key => sanitized.includes(value));
    if (fieldName && sanitized.length > maxLengths[fieldName as keyof typeof maxLengths]) {
      return sanitized.substring(0, maxLengths[fieldName as keyof typeof maxLengths]);
    }
    
    return sanitized;
  }

  function validateDraftStatus(status: any): 'pending' | 'approved' | 'rejected' | 'published' | null {
    const validStatuses = ['pending', 'approved', 'rejected', 'published'];
    return validStatuses.includes(status) ? status as any : null;
  }



  async function clearDraft() {
    await safeRemoveItem(`adminBlogPostDraft_${id}`);
    setLastSaved(null);
  }



  // File validation utility
  function validateImageFile(file: File): { isValid: boolean; error?: string } {
    // Check file size (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return { isValid: false, error: 'File size must be less than 5MB' };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Only JPEG, PNG, GIF, and WebP images are allowed' };
    }

    // Check file extension matches MIME type
    const extension = file.name.toLowerCase().split('.').pop();
    const mimeToExtension: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg', 
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp'
    };
    
    if (extension !== mimeToExtension[file.type]) {
      return { isValid: false, error: 'File extension does not match file type' };
    }

    return { isValid: true };
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {

    const file = e.target.files?.[0];

    if (!file) return;

    console.log('Starting image upload for file:', file.name, 'Size:', file.size);

    // Validate file before upload
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

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



  // Remove marked usage - use MarkdownProcessor component instead



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



      {showDraftRestored && (

        <div className="rounded-xl bg-green-600/20 border border-green-500/30 p-4 text-green-200 text-sm font-medium">

          ✅ Draft restored from previous session - Your work has been recovered!

        </div>

      )}

      

      {lastSaved && (

        <div className="text-sm text-green-400 flex items-center gap-2 font-medium">

          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">

            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>

          </svg>

          Draft saved {lastSaved.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}

        </div>

      )}



      {error && (

        <div className="rounded-2xl bg-red-900/20 border border-red-500/30 p-4 text-red-200">

          {error}

        </div>

      )}



      <form onSubmit={handleSubmit} className="space-y-8" onKeyDown={handleKeyDown}>

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

                <div className="text-sm text-vanillaCustard/60">

                  <span className="text-xs">💾 Auto-saves every 10 seconds • Press Ctrl+S to save manually</span>

                </div>

                <div className="text-sm text-vanillaCustard/80" id="content-help">

                  <strong>Quick Markdown Guide:</strong> <code className="rounded border border-vanillaCustard/20 bg-graphite px-2 py-1 text-xs"># Header</code> | <code className="rounded border border-vanillaCustard/20 bg-graphite px-2 py-1 text-xs">**bold**</code> | <code className="rounded border border-vanillaCustard/20 bg-graphite px-2 py-1 text-xs">*italic*</code> | <code className="rounded border border-vanillaCustard/20 bg-graphite px-2 py-1 text-xs">[link](url)</code> | <code className="rounded border border-vanillaCustard/20 bg-graphite px-2 py-1 text-xs">![alt](image-url)</code>

                </div>

                <textarea

                  ref={contentTextareaRef}

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

                {/* Alt Text Input */}

                {formData.featuredImage && (

                  <div className="grid gap-1 mt-3">

                    <label htmlFor="featuredImageAlt" className="text-sm font-semibold text-vanillaCustard">

                      Image Alt Text <span className="text-vanillaCustard/60">(Accessibility)</span>

                    </label>

                    <input

                      id="featuredImageAlt"

                      value={formData.featuredImageAlt || ''}

                      onChange={(e) => setFormData(prev => ({ ...prev, featuredImageAlt: e.target.value }))}

                      placeholder="Describe the image for visually impaired readers"

                      className="w-full rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-vanillaCustard focus:border-powderBlush focus:outline-none focus:ring-2 focus:ring-powderBlush/20 transition-colors"

                      maxLength={200}

                    />

                    <p className="text-xs text-vanillaCustard/60">

                      Help make your content accessible to everyone. Describe what's happening in the image.

                    </p>

                  </div>

                )}

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
              id="article-content"
              className="max-w-none"
              style={{ color: '#D1DA9C' }}
            >

              {formData.content ? (
                <MarkdownProcessor content={formData.content} />
              ) : (
                <p className="text-vanillaCustard/50">Start typing to see your content preview here...</p>
              )}

            </div>

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

