import { useState, useEffect, useRef, lazy, Suspense, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { marked } from '../utils/markedConfig';
import { safeSetItem, safeGetItem, safeRemoveItem } from '../utils/storageUtils';
import { sanitizeInput, validateEmail, validateUrl } from '../utils/validationUtils';
import DOMPurify from 'dompurify';

const MarkdownProcessor = lazy(() => import('../components/MarkdownProcessor'));

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return ((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      func(...args);
      timeoutRef.current = null;
    }, wait);
  }) as T;
}


export default function SubmitBlogPostPage() {

  const [title, setTitle] = useState('');

  const [content, setContent] = useState('');

  const [authorName, setAuthorName] = useState('');

  const [authorEmail, setAuthorEmail] = useState('');

  const [categories, setCategories] = useState('');

  const [tags, setTags] = useState('');

  const [excerpt, setExcerpt] = useState('');

  const [featuredImage, setFeaturedImage] = useState('');

  const [featuredImageAlt, setFeaturedImageAlt] = useState('');

  const [uploadingImage, setUploadingImage] = useState(false);

  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [imageRightsConfirmation, setImageRightsConfirmation] = useState(false);

  const [submissionConsent, setSubmissionConsent] = useState(false);

  const [privacyConsent, setPrivacyConsent] = useState(false);

  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [showDraftRestored, setShowDraftRestored] = useState(false);

  const [submittedPostData, setSubmittedPostData] = useState<{

    title: string;

    authorEmail: string;

    slug?: string;

  } | null>(null);

  const [showMarkdownGuide, setShowMarkdownGuide] = useState(false);

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [history, setHistory] = useState<string[]>(['']);

  const [historyIndex, setHistoryIndex] = useState(0);

  // Remove custom preview processing - use MarkdownProcessor component instead for consistency



  // Enhanced validation utilities using the centralized validation system
  function validateCategory(category: string): { isValid: boolean; error?: string; sanitized?: string } {
    const validation = sanitizeInput(category, 'category');
    return {
      isValid: validation.isValid,
      error: validation.error,
      sanitized: validation.sanitizedValue
    };
  }

  function validateTag(tag: string): { isValid: boolean; error?: string; sanitized?: string } {
    const validation = sanitizeInput(tag, 'tag');
    return {
      isValid: validation.isValid,
      error: validation.error,
      sanitized: validation.sanitizedValue
    };
  }

  function validateTitle(title: string): boolean {
    if (!title || typeof title !== 'string') return false;
    
    const trimmed = title.trim();
    
    // Length validation
    if (trimmed.length === 0 || trimmed.length > 200) {
      return false;
    }
    
    // Use DOMPurify for comprehensive XSS prevention with stricter configuration
    const sanitized = DOMPurify.sanitize(trimmed, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'form', 'input', 'button', 'textarea'],
      FORBID_ATTR: ['on*', 'style', 'href', 'src', 'data-*', 'action', 'method', 'type', 'value', 'name', 'id', 'class'],
      SANITIZE_NAMED_PROPS: true,
      WHOLE_DOCUMENT: false,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      SAFE_FOR_TEMPLATES: true
    });
    
    // CRITICAL FIX: Check if sanitization removed meaningful content (indicates potential XSS)
    // Normalize both strings for fair comparison to account for legitimate whitespace changes
    const normalizedOriginal = trimmed.replace(/\s+/g, ' ').trim();
    const normalizedSanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    // Also check if any dangerous characters were completely removed
    const dangerousCharsRemoved = trimmed.length > sanitized.length + 10; // Allow for reasonable whitespace normalization
    
    if (normalizedOriginal !== normalizedSanitized || dangerousCharsRemoved) {
      return false;
    }
    
    // Additional checks for encoded content that DOMPurify might miss
    if (/(%25[0-9a-f]{2})+/i.test(trimmed)) {
      // Double-encoded URL patterns
      return false;
    }
    
    // Check for other potential XSS vectors
    const dangerousPatterns = [
      /&#\d+;/gi,                    // HTML entities
      /&[a-zA-Z]+;/gi,                // Named entities
      /\\u[0-9a-fA-F]{4}/gi,        // Unicode escapes
      /expression\s*\(/gi,           // CSS expressions
      /@import/gi,                    // CSS imports
      /javascript:/gi,                // JavaScript protocol
      /data:text\/html/gi,           // Data protocol
      /vbscript:/gi,                  // VBScript protocol
      /on\w+\s*=/gi,                 // Event handlers
    ];
    
    if (dangerousPatterns.some(pattern => pattern.test(trimmed))) {
      return false;
    }
    
    return true;
  }

  function validateContent(content: string): boolean {
    if (!content || typeof content !== 'string') return false;
    
    const trimmed = content.trim();
    
    // Length validation
    if (trimmed.length < 50 || trimmed.length > 50000) {
      return false;
    }
    
    // Check for excessive repetition (potential DoS)
    if (/(.)\1{100,}/.test(trimmed)) {
      return false;
    }
    
    // Check for null bytes and invalid control characters
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(trimmed)) {
      return false;
    }
    
    // Prevent script injection in content
    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /(javascript|data:text|vbscript):/gi,
      /on\w+\s*=/gi,
      /expression\s*\(/gi,
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(trimmed));
  }

  function sanitizeCategories(categories: string): string[] {
    return categories
      .split(',')
      .map(c => c.trim())
      .filter(c => validateCategory(c))
      .map(c => c.replace(/\s+/g, ' ')) // Normalize whitespace
      .slice(0, 10); // Limit to 10 categories max
  }

  function sanitizeTags(tags: string): string[] {
    const tagValidationCache = new Map<string, { isValid: boolean; sanitized?: string }>();
    
    return tags
      .split(',')
      .map(t => t.trim())
      .filter(t => {
        // Use cache to avoid duplicate validation
        if (!tagValidationCache.has(t)) {
          const validation = validateTag(t);
          tagValidationCache.set(t, validation);
        }
        return tagValidationCache.get(t)!.isValid;
      })
      .map(t => {
        const validation = tagValidationCache.get(t)!;
        return validation.sanitized || t;
      })
      .slice(0, 20); // Limit to 20 tags max
  }

  function getWordCount(text: string) {

    return text.trim().split(/\s+/).filter(word => word.length > 0).length;

  }



  function getCharacterCount(text: string) {

    return text.length;

  }



  function getReadingTime(text: string) {

    const wordsPerMinute = 200;

    const words = getWordCount(text);

    

    // For very short content, show "less than 1 min read"

    if (words < 50) {

      return '< 1';

    }

    

    // For normal content, round up to nearest minute

    return Math.ceil(words / wordsPerMinute);

  }



  // Auto-save functionality
  const saveDraft = useCallback(async () => {
    try {
      const draft = {
        title,
        content,
        authorName,
        authorEmail,
        categories,
        tags,
        excerpt,
        featuredImage,
        featuredImageAlt,
        imageRightsConfirmation,
        submissionConsent,
        privacyConsent,
        savedAt: new Date().toISOString()
      };
      
      // Use safe storage utility
      const success = await safeSetItem('blogPostDraft', draft);
      if (success) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, [title, content, authorName, authorEmail, categories, tags, excerpt, featuredImage, featuredImageAlt, imageRightsConfirmation, submissionConsent, privacyConsent]);

  async function loadDraft() {
    try {
      const savedDraft = await safeGetItem<any>('blogPostDraft', null);
      
      if (savedDraft) {
        const savedTime = new Date(savedDraft.savedAt);
        const hoursAgo = (Date.now() - savedTime.getTime()) / (1000 * 60 * 60);
        
        // Only restore if draft is less than 24 hours old
        if (hoursAgo < 24) {
          setTitle(savedDraft.title || '');
          setContent(savedDraft.content || '');
          setAuthorName(savedDraft.authorName || '');
          setAuthorEmail(savedDraft.authorEmail || '');
          setCategories(savedDraft.categories || '');
          setTags(savedDraft.tags || '');
          setExcerpt(savedDraft.excerpt || '');
          setFeaturedImage(savedDraft.featuredImage || '');
          setFeaturedImageAlt(savedDraft.featuredImageAlt || '');
          setImageRightsConfirmation(savedDraft.imageRightsConfirmation || false);
          setSubmissionConsent(savedDraft.submissionConsent || false);
          setPrivacyConsent(savedDraft.privacyConsent || false);
          setLastSaved(savedTime);
          setShowDraftRestored(true);
          setTimeout(() => setShowDraftRestored(false), 5000);
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  }

  async function clearDraft() {
    try {
      await safeRemoveItem('blogPostDraft');
      setLastSaved(null);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }



  // Undo/Redo functionality with optimized circular buffer to prevent memory leaks
  const MAX_HISTORY_ENTRIES = 50;
  const historyBuffer = useRef<string[]>(new Array(MAX_HISTORY_ENTRIES).fill(''));
  const historyHead = useRef(0);
  const historySize = useRef(0);
  
  // Memory management: Track cleanup intervals
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityTime = useRef<number>(Date.now());

  function addToHistory(newContent: string) {
    // Update activity timestamp for cleanup
    lastActivityTime.current = Date.now();
    
    // Only add if content is different from current
    const currentIndex = (historyHead.current - historySize.current + MAX_HISTORY_ENTRIES) % MAX_HISTORY_ENTRIES;
    if (historyBuffer.current[currentIndex] === newContent) {
      return;
    }
    
    // Add new entry to circular buffer
    historyHead.current = (historyHead.current + 1) % MAX_HISTORY_ENTRIES;
    historyBuffer.current[historyHead.current] = newContent;
    
    // Update size (capped at MAX_HISTORY_ENTRIES)
    if (historySize.current < MAX_HISTORY_ENTRIES) {
      historySize.current++;
    }
    
    // Optimize state update - only update if this would change the visible history
    const newHistorySize = Math.min(historySize.current, MAX_HISTORY_ENTRIES);
    const currentHistorySize = history.length;
    
    if (newHistorySize !== currentHistorySize) {
      // Size changed, rebuild array efficiently
      const newHistory: string[] = [];
      const startIndex = (historyHead.current - historySize.current + MAX_HISTORY_ENTRIES) % MAX_HISTORY_ENTRIES;
      
      for (let i = 0; i < historySize.current; i++) {
        const index = (startIndex + i) % MAX_HISTORY_ENTRIES;
        newHistory.push(historyBuffer.current[index]);
      }
      
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    } else {
      // Same size, just update index
      setHistoryIndex(newHistorySize - 1);
    }
    
    // Trigger cleanup if needed
    scheduleCleanup();
  }
  
  // Memory cleanup function
  function scheduleCleanup() {
    // Clear existing cleanup timeout
    if (cleanupIntervalRef.current) {
      clearTimeout(cleanupIntervalRef.current);
    }
    
    // Schedule cleanup after 5 minutes of inactivity
    cleanupIntervalRef.current = setTimeout(() => {
      const timeSinceLastActivity = Date.now() - lastActivityTime.current;
      if (timeSinceLastActivity > 5 * 60 * 1000) { // 5 minutes
        // Clear history buffer to free memory
        historyBuffer.current = new Array(MAX_HISTORY_ENTRIES).fill('');
        historyHead.current = 0;
        historySize.current = 0;
        setHistory(['']);
        setHistoryIndex(0);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }



  function undo() {
    // Update activity timestamp
    lastActivityTime.current = Date.now();

    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setContent(history[newIndex]);

      // Restore cursor position
      setTimeout(() => {
        const textarea = contentTextareaRef.current;
        if (textarea) {
          textarea.focus();
          const textLength = history[newIndex].length;
          textarea.setSelectionRange(textLength, textLength);
        }
      }, 0);
    }
  }



  function redo() {
    // Update activity timestamp
    lastActivityTime.current = Date.now();

    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setContent(history[newIndex]);

      // Restore cursor position
      setTimeout(() => {
        const textarea = contentTextareaRef.current;
        if (textarea) {
          textarea.focus();
          const textLength = history[newIndex].length;
          textarea.setSelectionRange(textLength, textLength);
        }
      }, 0);
    }
  }



  const setContentWithHistory = (newContent: string) => {
    setContent(newContent);
    addToHistory(newContent);
  };



  // Keyboard shortcuts functionality

  function insertMarkdown(before: string, after: string = '') {

    const textarea = contentTextareaRef.current;

    if (!textarea) return;



    const start = textarea.selectionStart;

    const end = textarea.selectionEnd;

    const selectedText = content.substring(start, end);

    const newText = before + selectedText + after;

    

    // Update content

    const newContent = content.substring(0, start) + newText + content.substring(end);

    setContentWithHistory(newContent);

    

    // Restore cursor position

    setTimeout(() => {

      textarea.focus();

      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);

    }, 0);

  }



  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {

    if (e.ctrlKey || e.metaKey) {

      switch (e.key) {

        case 'z':

          e.preventDefault();

          undo();

          break;

        case 'y':

          e.preventDefault();

          redo();

          break;

        case 'b':

          e.preventDefault();

          insertMarkdown('**', '**');

          break;

        case 'i':

          e.preventDefault();

          insertMarkdown('*', '*');

          break;

        case 'k':

          e.preventDefault();

          const url = prompt('Enter URL:');

          if (url) {

            insertMarkdown('[', `](${url})`);

          }

          break;

        case 's':

          e.preventDefault();

          saveDraft();

          break;

      }

    }

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

    // Validate file before upload
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Invalid file');
      return;
    }

    setUploadingImage(true);
    setUploadSuccess(false);
    setErrorMessage(null);

    // Create abort controller for this upload
    const uploadController = new AbortController();
    const uploadTimeout = setTimeout(() => {
      uploadController.abort();
    }, 30000); // 30 second timeout

    const uploadFormData = new FormData();
    uploadFormData.append('image', file);

    try {
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: uploadFormData,
        signal: uploadController.signal
      });

      clearTimeout(uploadTimeout);

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
    } catch (err: any) {
      clearTimeout(uploadTimeout);
      
      if (err.name === 'AbortError') {
        setErrorMessage('Upload timed out. Please try again.');
      } else {
        console.error('Upload error:', err);
        setErrorMessage(err instanceof Error ? err.message : 'Failed to upload image');
      }
    } finally {
      setUploadingImage(false);
      // Clean up FormData
      uploadFormData.delete('image');
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
      categories: sanitizeCategories(categories),
      tags: sanitizeTags(tags),
      excerpt: excerpt.trim(),
      featuredImage: featuredImage.trim(),
      featuredImageAlt: featuredImageAlt.trim(),
      submissionConsent,
      privacyConsent
    };

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

      

      // Store submitted data for preview link before resetting form

      const slug = title

        .toLowerCase()

        .replace(/[^a-z0-9\s-]/g, '')

        .replace(/\s+/g, '-')

        .replace(/-+/g, '-')

        .trim('-') + `-${Number(Date.now()).toString(36)}`;

      

      setSubmittedPostData({

        title,

        authorEmail,

        slug

      });

      

      // Reset form

      setTitle('');

      setContent('');

      setAuthorName('');

      setAuthorEmail('');

      setCategories('');

      setTags('');

      setExcerpt('');

      setFeaturedImage('');

      setFeaturedImageAlt('');

      setImageRightsConfirmation(false);

      setSubmissionConsent(false);

      setPrivacyConsent(false);

    } catch (error) {

      setErrorMessage('Sorry—your submission could not be sent right now. Please try again later.');

      setStatus('error');

    }

  }



  // Load draft on component mount

  useEffect(() => {

    loadDraft();

  }, []);



  // Auto-save functionality with debouncing
  const debouncedSaveDraft = useMemo(
    () => debounce(saveDraft, 2000),
    [] // Dependencies - saveDraft is stable due to useCallback
  );

  const saveDraftIfNeeded = useCallback(() => {
    // Only save if there's meaningful content and document is visible
    const hasContent = title.trim() || content.trim() || authorName.trim() || 
                     authorEmail.trim() || categories.trim() || tags.trim() || 
                     excerpt.trim() || featuredImage.trim() || featuredImageAlt.trim();
    
    if (hasContent && document.visibilityState === 'visible') {
      debouncedSaveDraft();
    }
  }, [title, content, authorName, authorEmail, categories, tags, excerpt, featuredImage, featuredImageAlt, debouncedSaveDraft]);

  // Auto-save every 10 seconds with proper cleanup and debouncing
  useEffect(() => {
    const interval = setInterval(() => {
      saveDraftIfNeeded();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [saveDraftIfNeeded]);

  // Also save on field changes with debouncing
  useEffect(() => {
    saveDraftIfNeeded();
  }, [saveDraftIfNeeded]);


  // Clear draft on successful submission

  useEffect(() => {

    if (status === 'sent') {

      clearDraft();

    }

  }, [status]);

  // Memory cleanup effect
  useEffect(() => {
    return () => {
      // Clear cleanup timeout on unmount
      if (cleanupIntervalRef.current) {
        clearTimeout(cleanupIntervalRef.current);
      }
      
      // Clear history buffer to free memory
      historyBuffer.current = new Array(MAX_HISTORY_ENTRIES).fill('');
      historyHead.current = 0;
      historySize.current = 0;
    };
  }, []);



  if (status === 'sent') {

    return (

      <div className="max-w-4xl mx-auto p-6">

        <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-8 text-center">

          <div className="text-4xl mb-4">🎉</div>

          <h1 className="text-2xl font-bold text-vanillaCustard mb-4">Thank You!</h1>

          <p className="text-vanillaCustard/90 mb-4">

            Your blog post has been submitted for review. We'll review it and let you know if it's approved for publication.

          </p>

          

          {submittedPostData && (

            <div className="mb-6 rounded-2xl border border-paleAmber/30 bg-paleAmber/10 p-4">

              <div className="flex items-center gap-3 mb-3">

                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-paleAmber/20">

                  <svg className="h-4 w-4 text-paleAmber" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />

                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />

                  </svg>

                </div>

                <div>

                  <h3 className="font-semibold text-paleAmber">Preview Your Post</h3>

                  <p className="text-sm text-vanillaCustard/80">

                    You can preview your submitted post while it's pending review.

                  </p>

                </div>

              </div>

              <a

                href={`/blog/${submittedPostData.slug}?preview`}

                target="_blank"

                rel="noopener noreferrer"

                className="inline-flex items-center gap-2 rounded-lg bg-paleAmber/20 px-4 py-2 text-paleAmber hover:bg-paleAmber/30 transition"

              >

                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />

                </svg>

                Open Preview

              </a>

            </div>

          )}

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

        <div className="flex items-start justify-between gap-4">

          <div className="grid gap-3 flex-1">

            <h1 className="text-3xl font-extrabold text-vanillaCustard">Submit a Blog Post</h1>

            <p className="text-base text-vanillaCustard/90">

              We invite you to share your story, insights, and experiences with our LGBTQIA+ community. 

              While we're proudly rooted in Fort Bend, Texas, we welcome voices from across our community.

              Every submission is thoughtfully reviewed to ensure it aligns with our mission of support and inclusion.

            </p>

          </div>

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

                  placeholder="Personal Story, Community News, Resources"

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

                  placeholder="mental-health, youth, pride"

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

                  Share your own photos or use free images from Unsplash, Pexels, or Pixabay

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

                  {/* Alt Text Input */}
                  {featuredImage && (
                    <div className="space-y-2">
                      <label htmlFor="alt-text" className="block text-sm font-medium text-vanillaCustard/90">
                        Image Alt Text <span className="text-vanillaCustard/60">(Accessibility)</span>
                      </label>
                      <input
                        id="alt-text"
                        value={featuredImageAlt}
                        onChange={(e) => setFeaturedImageAlt(e.target.value)}
                        placeholder="Describe the image for visually impaired readers (e.g., 'Rainbow flag waving at pride parade')"
                        className="w-full rounded-2xl border border-vanillaCustard/20 bg-graphite px-4 py-3 text-lg font-semibold text-vanillaCustard placeholder-vanillaCustard/50"
                        maxLength={200}
                      />
                      <p className="text-xs text-vanillaCustard/60">
                        Help make your content accessible to everyone. Describe what's happening in the image.
                      </p>
                    </div>
                  )}
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

                      I confirm this is my own photo or a royalty-free image that I have permission to use.

                    </p>

                  </div>

                </label>

              </label>

            </div>

          </div>



          {/* Content & Preview Column */}

          <div className="space-y-4">

            {showDraftRestored && (

              <div className="rounded-xl bg-green-600/20 border border-green-500/30 p-4 text-green-200 text-sm font-medium">

                ✅ Draft restored from previous session - Your work has been recovered!

              </div>

            )}

            

            <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6">

              <label className="grid gap-2">

                <div className="flex items-center justify-between">

                  <span className="text-base font-bold text-vanillaCustard">Content *</span>

                  {lastSaved && (

                    <div className="text-sm text-green-400 flex items-center gap-2 font-medium">

                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">

                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>

                      </svg>

                      Draft saved {lastSaved.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}

                    </div>

                  )}

                </div>

                <div className="text-sm text-vanillaCustard/85">

                  <button

                    type="button"

                    onClick={() => setShowMarkdownGuide(!showMarkdownGuide)}

                    className="inline-flex items-center gap-2 text-paleAmber hover:text-paleAmber/80 transition-colors"

                  >

                    <svg 

                      className={`h-4 w-4 transition-transform ${showMarkdownGuide ? 'rotate-90' : ''}`} 

                      fill="none" 

                      stroke="currentColor" 

                      viewBox="0 0 24 24"

                    >

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />

                    </svg>

                    <strong>Markdown Guide & Shortcuts</strong>

                  </button>

                  

                  {showMarkdownGuide && (

                    <div className="mt-4 p-4 rounded-xl bg-graphite border border-vanillaCustard/15 space-y-4">

                      {/* Markdown Syntax Section */}

                      <div>

                        <h4 className="text-sm font-semibold text-vanillaCustard mb-3 flex items-center gap-2">

                          <svg className="h-4 w-4 text-paleAmber" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />

                          </svg>

                          Markdown Syntax

                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">

                          <div className="flex items-center gap-2">

                            <code className="rounded bg-pitchBlack border border-vanillaCustard/20 px-2 py-1 font-mono"># Header</code>

                            <span className="text-vanillaCustard/60">→ Heading</span>

                          </div>

                          <div className="flex items-center gap-2">

                            <code className="rounded bg-pitchBlack border border-vanillaCustard/20 px-2 py-1 font-mono">**bold**</code>

                            <span className="text-vanillaCustard/60">→ <strong>bold</strong></span>

                          </div>

                          <div className="flex items-center gap-2">

                            <code className="rounded bg-pitchBlack border border-vanillaCustard/20 px-2 py-1 font-mono">*italic*</code>

                            <span className="text-vanillaCustard/60">→ <em>italic</em></span>

                          </div>

                          <div className="flex items-center gap-2">

                            <code className="rounded bg-pitchBlack border border-vanillaCustard/20 px-2 py-1 font-mono">[text](url)</code>

                            <span className="text-vanillaCustard/60">→ link</span>

                          </div>

                          <div className="flex items-center gap-2">

                            <code className="rounded bg-pitchBlack border border-vanillaCustard/20 px-2 py-1 font-mono">- item</code>

                            <span className="text-vanillaCustard/60">→ bullet</span>

                          </div>

                          <div className="flex items-center gap-2">

                            <code className="rounded bg-pitchBlack border border-vanillaCustard/20 px-2 py-1 font-mono">![alt](url)</code>

                            <span className="text-vanillaCustard/60">→ image</span>

                          </div>

                        </div>

                      </div>



                      {/* Extended Features Section */}

                      <div>

                        <h4 className="text-sm font-semibold text-vanillaCustard mb-3 flex items-center gap-2">

                          <svg className="h-4 w-4 text-paleAmber" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />

                          </svg>

                          Extended Features 🎯

                        </h4>

                        <div className="space-y-3">

                          <div className="rounded-lg bg-pitchBlack/50 p-3 border border-vanillaCustard/10">

                            <div className="text-xs font-semibold text-paleAmber mb-2">📢 Alert Blocks</div>

                            <div className="text-xs text-vanillaCustard/80 space-y-1">

                              <div><code className="rounded bg-pitchBlack border border-vanillaCustard/20 px-1 py-0.5 font-mono">!!! info</code> - Informational alerts</div>

                              <div><code className="rounded bg-pitchBlack border border-vanillaCustard/20 px-1 py-0.5 font-mono">!!! warning</code> - Warning messages</div>

                              <div><code className="rounded bg-pitchBlack border border-vanillaCustard/20 px-1 py-0.5 font-mono">!!! success</code> - Success messages</div>

                              <div><code className="rounded bg-pitchBlack border border-vanillaCustard/20 px-1 py-0.5 font-mono">!!! error</code> - Error messages</div>

                              <div><code className="rounded bg-pitchBlack border border-vanillaCustard/20 px-1 py-0.5 font-mono">!!! tip</code> - Tips and advice</div>

                            </div>

                            <div className="mt-2 text-xs text-vanillaCustard/60">

                              Example: <code className="rounded bg-pitchBlack border border-vanillaCustard/20 px-1 py-0.5 font-mono">!!! info&#10;This is important information</code>

                            </div>

                          </div>

                        </div>

                      </div>



                      {/* Keyboard Shortcuts Section */}

                      <div>

                        <h4 className="text-sm font-semibold text-vanillaCustard mb-3 flex items-center gap-2">

                          <svg className="h-4 w-4 text-paleAmber" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />

                          </svg>

                          Keyboard Shortcuts

                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">

                          <div className="flex items-center gap-2">

                            <kbd className="rounded bg-pitchBlack border border-vanillaCustard/30 px-2 py-1 font-mono text-paleAmber">Ctrl+Z</kbd>

                            <span className="text-vanillaCustard/80">Undo</span>

                          </div>

                          <div className="flex items-center gap-2">

                            <kbd className="rounded bg-pitchBlack border border-vanillaCustard/30 px-2 py-1 font-mono text-paleAmber">Ctrl+Y</kbd>

                            <span className="text-vanillaCustard/80">Redo</span>

                          </div>

                          <div className="flex items-center gap-2">

                            <kbd className="rounded bg-pitchBlack border border-vanillaCustard/30 px-2 py-1 font-mono text-paleAmber">Ctrl+B</kbd>

                            <span className="text-vanillaCustard/80">Bold text</span>

                          </div>

                          <div className="flex items-center gap-2">

                            <kbd className="rounded bg-pitchBlack border border-vanillaCustard/30 px-2 py-1 font-mono text-paleAmber">Ctrl+I</kbd>

                            <span className="text-vanillaCustard/80">Italic text</span>

                          </div>

                          <div className="flex items-center gap-2">

                            <kbd className="rounded bg-pitchBlack border border-vanillaCustard/30 px-2 py-1 font-mono text-paleAmber">Ctrl+K</kbd>

                            <span className="text-vanillaCustard/80">Add link</span>

                          </div>

                          <div className="flex items-center gap-2">

                            <kbd className="rounded bg-pitchBlack border border-vanillaCustard/30 px-2 py-1 font-mono text-paleAmber">Ctrl+S</kbd>

                            <span className="text-vanillaCustard/80">Save draft</span>

                          </div>

                        </div>

                      </div>



                      {/* Tips Section */}

                      <div className="pt-2 border-t border-vanillaCustard/10">

                        <div className="flex items-start gap-2 text-xs text-vanillaCustard/60">

                          <svg className="h-4 w-4 text-paleAmber mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />

                          </svg>

                          <span>

                            <strong>Pro tip:</strong> Keyboard shortcuts work even when the guide is collapsed!

                          </span>

                        </div>

                      </div>

                    </div>

                  )}

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

                  ref={contentTextareaRef}

                  id="content"

                  value={content}

                  onChange={(e) => setContentWithHistory(e.target.value)}

                  onKeyDown={handleKeyDown}

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

                

                {/* Word Counter */}

                <div className="mt-2 flex items-center justify-between text-xs text-vanillaCustard/70">

                  <div className="flex items-center gap-4">

                    <span className={getWordCount(content) < 300 ? 'text-red-400' : getWordCount(content) >= 300 && getWordCount(content) <= 2500 ? 'text-green-400' : 'text-yellow-400'}>

                      {getWordCount(content)} words

                    </span>

                    <span>{getCharacterCount(content)}/10,000 characters</span>

                    <span>{getReadingTime(content)} min read</span>

                  </div>

                  {getWordCount(content) < 300 && (

                    <span className="text-red-400">Minimum 300 words recommended for better SEO</span>

                  )}

                  {getWordCount(content) >= 300 && getWordCount(content) <= 2500 && (

                    <span className="text-green-400">✓ Optimal length for SEO</span>

                  )}

                </div>

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

                    <Suspense fallback={<div className="text-vanillaCustard/60">Loading preview...</div>}>

                      <div 
                        id="article-content"
                        className="max-w-none"
                        style={{ color: '#D1DA9C' }}
                      >

                        <MarkdownProcessor content={content} />

                      </div>

                    </Suspense>

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

