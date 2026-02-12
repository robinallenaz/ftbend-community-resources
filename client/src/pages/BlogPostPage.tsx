import { useState, useEffect } from 'react';

import { useParams, Link, useNavigate } from 'react-router-dom';

import { updateMetaTag, updateCanonicalUrl, updateDocumentTitle, updateMetaDescription, cleanupMetaTags, getSiteUrl } from '../utils/seoUtils';
import { safeGetItem, safeSetItem } from '../utils/storageUtils';
import MarkdownProcessor from '../components/MarkdownProcessor';



// SEO Meta Tags Component

function BlogPostSEO({ post }: { post: BlogPost }) {

  useEffect(() => {
    const siteUrl = getSiteUrl();

    // Update document title
    updateDocumentTitle(`${post.title} | Fort Bend County LGBTQIA+ Community Blog`);
    
    // Update meta description
    updateMetaDescription(post.metaDescription || post.excerpt || `Read "${post.title}" - A story from the Fort Bend LGBTQIA+ community. ${post.excerpt || ''}`);
    
    // Update Open Graph tags
    updateMetaTag('og:title', post.title);
    updateMetaTag('og:description', post.metaDescription || post.excerpt || `Read "${post.title}" - A story from the Fort Bend LGBTQIA+ community.`);
    updateMetaTag('og:url', `${siteUrl}/blog/${post.slug}`);
    updateMetaTag('og:type', 'article');

    if (post.featuredImage) {

      updateMetaTag('og:image', post.featuredImage);

      updateMetaTag('og:image:alt', post.title);

    }

    

    // Update Twitter Card tags

    updateMetaTag('twitter:title', post.title);

    updateMetaTag('twitter:description', post.metaDescription || post.excerpt || `Read "${post.title}" - A story from the Fort Bend LGBTQIA+ community.`);

    if (post.featuredImage) {

      updateMetaTag('twitter:image', post.featuredImage);

    }

    

    // Update canonical URL
    updateCanonicalUrl(`${siteUrl}/blog/${post.slug}`);

    

    // Add structured data for blog post

    addStructuredData(post);

    

    return () => {
      // Cleanup function to remove all meta tags when component unmounts
      // Remove structured data script tags
      cleanupMetaTags(['script[type="application/ld+json"]']);
      
      // Also remove any remaining meta tags that might have been created
      // This ensures clean state when navigating between blog posts
      const metaSelectors = [
        'meta[name="description"]',
        'meta[property^="og:"]',
        'meta[property^="twitter:"]',
        'link[rel="canonical"]'
      ];
      
      metaSelectors.forEach(selector => {
        const elements = document.head.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });
    };

  }, [post]);

  

  return null;

}



function addStructuredData(post: BlogPost) {

  const structuredData = {

    "@context": "https://schema.org",

    "@type": "BlogPosting",

    "headline": post.title,

    "description": post.metaDescription || post.excerpt || '',

    "image": post.featuredImage ? [post.featuredImage] : [],

    "datePublished": post.publishedAt || post.createdAt,

    "dateModified": post.publishedAt || post.createdAt,

    "author": {

      "@type": "Person",

      "name": post.authorName

    },

    "publisher": {

      "@type": "Organization",

      "name": "Fort Bend County LGBTQIA+ Community",

      "logo": {

        "@type": "ImageObject",

        "url": "https://res.cloudinary.com/dpus8jzix/image/upload/q_auto,f_auto,w_1200/ftbend-lgbtqia-logo_erkzpu.jpg"

      }

    },

    "mainEntityOfPage": {

      "@type": "WebPage",

      "@id": `https://ftbend-lgbtqia-community.org/blog/${post.slug}`

    },

    "keywords": [...post.categories, ...post.tags].join(', '),

    "articleSection": post.categories.join(', ') || 'Community Stories',

    "inLanguage": "en-US"

  };

  

  const script = document.createElement('script');

  script.type = 'application/ld+json';

  script.textContent = JSON.stringify(structuredData);

  document.head.appendChild(script);

}



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

  createdAt: string;

  publishedAt?: string;

  viewCount?: number;

  likeCount?: number;

}



// Helper functions for like persistence

const getLikedPosts = async () => {
  try {
    // Try safe localStorage first
    const localStorageLikes = await safeGetItem<string[]>('likedBlogPosts', []);
    if (localStorageLikes.length > 0) return localStorageLikes;
    
    // Fallback to session cookie
    const cookieLikes = document.cookie
      .split('; ')
      .find(row => row.startsWith('likedBlogPosts='))
      ?.split('=')[1];
    
    return cookieLikes ? JSON.parse(decodeURIComponent(cookieLikes)) : [];
  } catch {
    return [];
  }
};

const saveLikedPosts = async (likedPosts: string[]) => {
  try {
    // Save to localStorage using safe utility
    await safeSetItem('likedBlogPosts', likedPosts);
    
    // Also save as session cookie as backup
    const encoded = encodeURIComponent(JSON.stringify(likedPosts));
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `likedBlogPosts=${encoded}; expires=${expires.toUTCString()}; path=/; SameSite=Strict; Secure`;
  } catch (error) {
    console.error('Error saving liked posts:', error);
    // Silent fail

  }

};



export default function BlogPostPage() {

  const { slug } = useParams<{ slug: string }>();

  const navigate = useNavigate();

  const [post, setPost] = useState<BlogPost | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [liking, setLiking] = useState(false);

  const [isLiked, setIsLiked] = useState(false);

  const [copiedLink, setCopiedLink] = useState(false);



  useEffect(() => {

    if (slug) {

      fetchPost(slug);

    }

  }, [slug]);



  async function fetchPost(postSlug: string) {

    try {

      // Check if this is a preview request (from URL params)

      const urlParams = new URLSearchParams(window.location.search);

      const isPreview = urlParams.get('preview') !== null;

      

      let apiUrl = `/api/public/blog-posts/${postSlug}`;

      if (isPreview) {

        apiUrl += '/preview';

      }

      

      const res = await fetch(apiUrl);

      if (!res.ok) {

        if (res.status === 404) {

          setError('Blog post not found');

        } else {

          setError('Failed to load blog post');

        }

        return;

      }

      const data = await res.json();

      setPost(data.post);

      

      // Check if user has already liked this post (only for published posts)
      if (!data.isPreview) {
        const likedPosts = await getLikedPosts();
        setIsLiked(likedPosts.includes(data.post._id));
      }

    } catch (err) {

      setError(err instanceof Error ? err.message : 'An error occurred');

    } finally {

      setLoading(false);

    }

  }



  async function handleLike() {

    if (!post || liking) return;

    

    setLiking(true);

    try {

      const action = isLiked ? 'unlike' : 'like';

      

      const res = await fetch(`/api/public/blog-posts/${post._id}/like`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ action })

      });

      

      if (!res.ok) throw new Error('Failed to like post');

      

      const data = await res.json();

      

      // Update local state

      setPost(prev => prev ? { ...prev, likeCount: data.likeCount } : null);

      

      // Update liked status
      const likedPosts = await getLikedPosts();
      if (!isLiked) {
        likedPosts.push(post._id);
        setIsLiked(true);
      } else {
        const index = likedPosts.indexOf(post._id);
        if (index > -1) {
          likedPosts.splice(index, 1);
          setIsLiked(false);
        }
      }
      await saveLikedPosts(likedPosts);

      

    } catch (err) {

      console.error('Like error:', err);

    } finally {

      setLiking(false);

    }

  }



  async function handleCopyLink() {

    if (!post) return;

    

    try {

      const url = window.location.href;

      await navigator.clipboard.writeText(url);

      setCopiedLink(true);

      setTimeout(() => setCopiedLink(false), 2000);

    } catch (err) {

      console.error('Failed to copy link:', err);

    }

  }



  function getShareUrls() {

    if (!post) return {};



    const url = encodeURIComponent(window.location.href);

    const title = encodeURIComponent(post.title);

    const excerpt = encodeURIComponent(post.excerpt || post.title);



    return {

      twitter: `https://twitter.com/intent/tweet?text=${title}&url=${url}`,

      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,

      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,

      email: `mailto:?subject=${title}&body=${excerpt}%0A%0A${url}`

    };

  }



  const content = post ? post.content : '';



  // Get button label based on current page

  const getBackButtonLabel = () => {

    // For blog post pages, always return "Back to Search"

    return 'Back to Search';

  };



  // Scroll to search function

  function scrollToSearch() {

    navigate('/blog#search', { state: { scrollTo: 'search' } });

  }



  if (loading) {

    return (

      <div className="min-h-screen bg-pitchBlack flex items-center justify-center">

        <div className="text-vanillaCustard/90">Loading blog post...</div>

      </div>

    );

  }



  if (error || !post) {

    return (

      <div className="min-h-screen bg-pitchBlack flex items-center justify-center">

        <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-8 text-center max-w-md">

          <div className="text-vanillaCustard/90 mb-4">

            {error || 'Blog post not found'}

          </div>

          <Link

            to="/blog#search"

            className="inline-block rounded-xl bg-powderBlush px-4 py-2 text-base font-bold text-pitchBlack hover:brightness-95 transition"

          >

            {getBackButtonLabel()}

          </Link>

        </div>

      </div>

    );

  }



  return (

    <div className="min-h-screen bg-pitchBlack">

      <BlogPostSEO post={post} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">

        {/* Preview Banner */}

        {new URLSearchParams(window.location.search).get('preview') !== null && (

          <div className="mb-6 rounded-2xl border border-paleAmber/30 bg-paleAmber/10 p-4">

            <div className="flex items-center gap-3">

              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-paleAmber/20">

                <svg className="h-4 w-4 text-paleAmber" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />

                </svg>

              </div>

              <div>

                <h3 className="font-semibold text-paleAmber">Preview Mode</h3>

                <p className="text-sm text-vanillaCustard/80">

                  This is a preview of your blog post. It's currently pending review and not yet published.

                </p>

              </div>

            </div>

          </div>

        )}



        {/* Navigation */}

        <nav className="mb-8">

          <button

            onClick={scrollToSearch}

            className="inline-flex items-center gap-2 text-vanillaCustard/80 hover:text-vanillaCustard transition"

          >

            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />

            </svg>

            {getBackButtonLabel()}

          </button>

        </nav>



        {/* Article Header */}

        <article className="prose prose-invert max-w-none">

          <header className="mb-8">

            {/* Featured Image */}

            {post.featuredImage && (

              <div className="mb-8">

                <img

                  src={post.featuredImage}

                  alt={post.title}

                  className="w-full h-64 sm:h-96 object-cover rounded-2xl border border-vanillaCustard/20"

                  onError={(e) => {

                    e.currentTarget.src = '';

                    e.currentTarget.style.display = 'none';

                  }}

                />

              </div>

            )}



            <h1 className="text-4xl sm:text-5xl font-bold text-vanillaCustard mb-6">

              {post.title}

            </h1>



            {/* Meta Information */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-vanillaCustard/70 mb-6">

              <div>

                <p className="text-lg">

                  By <span className="text-vanillaCustard font-semibold">{post.authorName}</span>

                </p>

                <p className="text-sm">

                  {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', {

                    year: 'numeric',

                    month: 'long',

                    day: 'numeric'

                  })}

                </p>

              </div>

              <button

                onClick={handleLike}

                disabled={liking}

                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition ${

                  isLiked 

                    ? 'bg-powderBlush text-pitchBlack border-powderBlush' 

                    : 'border-vanillaCustard/20 text-vanillaCustard/80 hover:border-vanillaCustard/40 hover:text-vanillaCustard'

                } disabled:opacity-50 disabled:cursor-not-allowed`}

              >

                <svg 

                  className="h-4 w-4" 

                  fill={isLiked ? "currentColor" : "none"} 

                  stroke="currentColor" 

                  viewBox="0 0 24 24"

                >

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />

                </svg>

                <span>{post.likeCount || 0}</span>

                {liking && <span className="text-xs">...</span>}

              </button>

            </div>



            {/* Excerpt */}

            {post.excerpt && (

              <div className="text-xl text-vanillaCustard/90 italic border-l-4 border-powderBlush pl-6 mb-8">

                {post.excerpt}

              </div>

            )}



            {/* Categories and Tags */}

            {(post.categories.length > 0 || post.tags.length > 0) && (

              <div className="flex flex-wrap gap-2 mb-8">

                {post.categories.map((category) => (

                  <span

                    key={category}

                    className="rounded-lg bg-powderBlush/20 text-paleAmber px-3 py-1 text-sm font-medium"

                  >

                    {category}

                  </span>

                ))}

                {post.tags.map((tag) => (

                  <span

                    key={tag}

                    className="rounded-lg bg-graphite border border-vanillaCustard/20 text-vanillaCustard/70 px-3 py-1 text-sm"

                  >

                    #{tag}

                  </span>

                ))}

              </div>

            )}

          </header>



          {/* Article Content */}

          <div 

            id="article-content"

            className="max-w-none"

            style={{ color: '#D1DA9C' }}

          >

            <MarkdownProcessor content={content} />

          </div>



          {/* Share Section */}

          <div className="mt-12 pt-8 border-t border-vanillaCustard/10">

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

              <div>

                <h3 className="text-lg font-bold text-vanillaCustard mb-2">Share this post</h3>

                <p className="text-sm text-vanillaCustard/70">

                  Help spread the word by sharing this article with your community

                </p>

              </div>

              

              <div className="flex flex-wrap gap-3">

                {/* Copy Link */}

                <button

                  onClick={handleCopyLink}

                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-vanillaCustard/20 text-vanillaCustard/80 hover:border-vanillaCustard/40 hover:text-vanillaCustard transition"

                >

                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />

                  </svg>

                  <span className="text-sm">{copiedLink ? 'Copied!' : 'Copy Link'}</span>

                </button>



                {/* Twitter/X */}

                <a

                  href={getShareUrls().twitter}

                  target="_blank"

                  rel="noopener noreferrer"

                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-vanillaCustard/20 text-vanillaCustard/80 hover:border-vanillaCustard/40 hover:text-vanillaCustard transition !no-underline"

                >

                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">

                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>

                  </svg>

                  <span className="text-sm !no-underline">Post on X</span>

                </a>



                {/* Facebook */}

                <a

                  href={getShareUrls().facebook}

                  target="_blank"

                  rel="noopener noreferrer"

                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-vanillaCustard/20 text-vanillaCustard/80 hover:border-vanillaCustard/40 hover:text-vanillaCustard transition !no-underline"

                >

                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">

                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>

                  </svg>

                  <span className="text-sm !no-underline">Share on Facebook</span>

                </a>



                {/* LinkedIn */}

                <a

                  href={getShareUrls().linkedin}

                  target="_blank"

                  rel="noopener noreferrer"

                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-vanillaCustard/20 text-vanillaCustard/80 hover:border-vanillaCustard/40 hover:text-vanillaCustard transition !no-underline"

                >

                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">

                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>

                  </svg>

                  <span className="text-sm !no-underline">Share on LinkedIn</span>

                </a>



                {/* Email */}

                <a

                  href={getShareUrls().email}

                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-vanillaCustard/20 text-vanillaCustard/80 hover:border-vanillaCustard/40 hover:text-vanillaCustard transition !no-underline"

                >

                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />

                  </svg>

                  <span className="text-sm !no-underline">Email</span>

                </a>

              </div>

            </div>

          </div>

        </article>



        {/* Footer */}

        <footer className="mt-16 pt-8 border-t border-vanillaCustard/10">

          <div className="text-center text-vanillaCustard/60">

            <p className="mb-4">

              Published by Fort Bend LGBTQIA+ Community Resources

            </p>

            <Link

              to="/blog#search"

              className="inline-flex items-center gap-2 text-paleAmber hover:text-vanillaCustard transition"

            >

              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />

              </svg>

              {getBackButtonLabel()}

            </Link>

          </div>

        </footer>

      </div>

    </div>

  );

}

