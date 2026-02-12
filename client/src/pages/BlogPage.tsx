import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { updateMetaTag, updateCanonicalUrl, updateDocumentTitle, updateMetaDescription, cleanupMetaTags, getSiteUrl } from '../utils/seoUtils';
import { safeGetItem, safeSetItem } from '../utils/storageUtils';
import { trackCommunityEvent } from '../utils/analytics-simple';

// SEO Meta Tags Component with proper cleanup tracking
function BlogPageSEO() {
  const createdMetaTags = useRef<Set<HTMLMetaElement>>(new Set());
  
  useEffect(() => {
    const siteUrl = getSiteUrl();
    
    // Helper function to create or update meta tag safely
    const createOrUpdateMetaTag = (property: string, content: string): HTMLMetaElement => {
      let tag: HTMLMetaElement | null = null;
      
      // Safely get document head with validation
      if (!document || !document.head) {
        console.error('Document head not available');
        return null as any;
      }
      
      const head = document.head;
      
      // Find existing tag using safe DOM methods
      try {
        const metaTags = head.getElementsByTagName('meta');
        for (let i = 0; i < metaTags.length; i++) {
          const meta = metaTags[i];
          
          // Comprehensive validation to prevent DOM clobbering
          if (!meta || 
              meta.nodeType !== Node.ELEMENT_NODE || 
              meta.tagName?.toLowerCase() !== 'meta' ||
              typeof meta.getAttribute !== 'function' || 
              typeof meta.setAttribute !== 'function') {
            continue;
          }
          
          const metaElement = meta as HTMLMetaElement;
          
          // Check for matching attribute
          if (property.startsWith('twitter:')) {
            const nameAttr = metaElement.getAttribute('name');
            if (typeof nameAttr === 'string' && nameAttr === property) {
              tag = metaElement;
              break;
            }
          } else if (property.startsWith('og:')) {
            const propertyAttr = metaElement.getAttribute('property');
            if (typeof propertyAttr === 'string' && propertyAttr === property) {
              tag = metaElement;
              break;
            }
          } else {
            const nameAttr = metaElement.getAttribute('name');
            if (typeof nameAttr === 'string' && nameAttr === property) {
              tag = metaElement;
              break;
            }
          }
        }
        
        // Create new tag if not found
        if (!tag) {
          tag = document.createElement('meta') as HTMLMetaElement;
          
          if (property.startsWith('twitter:')) {
            tag.setAttribute('name', property);
          } else if (property.startsWith('og:')) {
            tag.setAttribute('property', property);
          } else {
            tag.setAttribute('name', property);
          }
          
          head.appendChild(tag);
          createdMetaTags.current.add(tag);
        }
        
        // Set content
        tag.setAttribute('content', content);
        
        return tag;
      } catch (error) {
        console.error('Error creating meta tag:', error);
        return null as any;
      }
    };
    
    // Update document title
    updateDocumentTitle('Community Blog | Fort Bend County LGBTQIA+ Community');
    
    // Update meta description
    updateMetaDescription('Read stories, insights, and experiences from the Fort Bend LGBTQIA+ community. Personal narratives, community news, and resources shared by local voices.');
    
    // Update Open Graph tags
    createOrUpdateMetaTag('og:title', 'Community Blog | Fort Bend County LGBTQIA+ Resources & Support');
    createOrUpdateMetaTag('og:description', 'Read stories, insights, and experiences from the Fort Bend LGBTQIA+ community. Personal narratives, mental health support, and community resources shared by local voices.');
    createOrUpdateMetaTag('og:url', `${siteUrl}/blog`);
    createOrUpdateMetaTag('og:type', 'website');
    
    // Update Twitter Card tags
    createOrUpdateMetaTag('twitter:title', 'Community Blog | Fort Bend County LGBTQIA+ Resources & Support');
    createOrUpdateMetaTag('twitter:description', 'Read stories, insights, and experiences from the Fort Bend LGBTQIA+ community. Personal narratives, mental health support, and community resources.');
    
    // Update canonical URL
    updateCanonicalUrl(`${siteUrl}/blog`);
    
    return () => {
      // Cleanup only the meta tags created by this component
      createdMetaTags.current.forEach(tag => {
        try {
          if (tag.parentNode) {
            tag.parentNode.removeChild(tag);
          }
        } catch (error) {
          console.error('Error removing meta tag:', error);
        }
      });
      createdMetaTags.current.clear();
      
      // Call general cleanup for other meta operations
      cleanupMetaTags();
    };
  }, []);
  
  return null;
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
  featuredImageAlt?: string;
  metaDescription?: string;
  createdAt: string;
  publishedAt?: string;
  viewCount?: number;
  likeCount?: number;
}

interface BlogListResponse {
  posts: BlogPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function BlogPage() {
  const location = useLocation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isMounted, setIsMounted] = useState(true);
  const [likingPostId, setLikingPostId] = useState<string | null>(null);
  
  // Preload critical resources for LCP
  useEffect(() => {
    if (isInitialLoad) {
      // Preload critical CSS
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = '/blog-critical.css';
      document.head.appendChild(link);
      
      // Preload font for blog titles
      const fontLink = document.createElement('link');
      fontLink.rel = 'preload';
      fontLink.as = 'font';
      fontLink.type = 'font/woff2';
      fontLink.crossOrigin = 'anonymous';
      document.head.appendChild(fontLink);
    }
  }, [isInitialLoad]);
  
  // Single abort controller for the component lifecycle
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentRequestIdRef = useRef<number>(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const imageTimeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Race condition prevention: Track ongoing requests to prevent duplicates
  const ongoingRequestRef = useRef<string | null>(null);
  const requestDeduplicationMap = useRef<Map<string, Promise<any>>>(new Map());

  const postsPerPage = 12;

  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null;
    const shouldScrollToSearch = location.hash === '#search' || state?.scrollTo === 'search';
    if (!shouldScrollToSearch) return;

    const timer = setTimeout(() => {
      const searchInput = document.getElementById('search') as HTMLInputElement | null;
      if (!searchInput) return;
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      searchInput.focus();
    }, 150);

    return () => clearTimeout(timer);
  }, [location.hash, location.state]);

  useEffect(() => {
    const loadData = async () => {
      // Save scroll position for non-initial loads
      if (!isInitialLoad) {
        setScrollPosition(window.scrollY);
      }
      
      // Always fetch posts
      await fetchPosts();
      
      // Track analytics for blog searches and filters
      const hasSearchQuery = searchQuery.trim().length > 0;
      const hasFilters = selectedCategory.length > 0 || selectedTag.length > 0;
      
      if (hasSearchQuery || hasFilters) {
        trackCommunityEvent('blog-search', hasSearchQuery ? 'text-search' : 'filter-search');
      }
      
      // Restore scroll position after data loads for non-initial loads
      if (!isInitialLoad && isMounted && scrollPosition > 0) {
        scrollTimeoutRef.current = setTimeout(() => {
          if (isMounted) {
            window.scrollTo(0, scrollPosition);
          }
        }, 100);
      }
      
      // Load liked posts from localStorage safely (only on initial load)
      if (isInitialLoad) {
        safeGetItem('likedBlogPosts', [])
          .then(savedLikedPosts => {
            if (Array.isArray(savedLikedPosts)) {
              setLikedPosts(new Set(savedLikedPosts));
            }
          })
          .catch(error => {
            console.error('Failed to load liked posts:', error);
          })
          .finally(() => {
            setIsInitialLoad(false);
          });
      }
    };
    
    loadData();
  }, [currentPage, selectedCategory, selectedTag, searchQuery, sortBy]);

  async function handlePageChange(newPage: number) {
    setCurrentPage(newPage);
  }

  async function fetchPosts() {
    // Create request key for deduplication
    const requestKey = `${currentPage}-${selectedCategory}-${selectedTag}-${searchQuery}-${sortBy}`;
    
    // Check if identical request is already in progress
    if (ongoingRequestRef.current === requestKey) {
      return; // Skip duplicate request
    }
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Check if we have a cached promise for this request
    const cachedPromise = requestDeduplicationMap.current.get(requestKey);
    if (cachedPromise) {
      try {
        const data = await cachedPromise;
        if (isMounted) {
          setPosts(data.posts);
          setTotalPages(data.pagination.pages);
          setError(null);
          setLoading(false);
        }
        return;
      } catch (error) {
        // Remove failed cached request
        requestDeduplicationMap.current.delete(requestKey);
      }
    }
    
    // Create new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++currentRequestIdRef.current;
    ongoingRequestRef.current = requestKey;
    
    // Create the request promise
    const requestPromise = (async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: postsPerPage.toString(),
        sort: sortBy,
        search: searchQuery
      });

      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      if (selectedTag) {
        params.append('tag', selectedTag);
      }
      if (searchQuery.trim()) {
        params.append('q', searchQuery.trim());
      }

      const response = await fetch(`/api/public/blog-posts?${params}`, {
        signal: controller.signal
      });
      
      // Check if request was aborted or component unmounted
      if (controller.signal.aborted || !isMounted || requestId !== currentRequestIdRef.current) {
        throw new Error('Request aborted');
      }
      
      if (!response.ok) throw new Error('Failed to fetch blog posts');
      
      const data: BlogListResponse = await response.json();
      
      // Only update state if this is still the current request and component is mounted
      if (!controller.signal.aborted && isMounted && requestId === currentRequestIdRef.current) {
        setPosts(data.posts);
        setTotalPages(data.pagination.pages);
        setError(null);
      }
      
      return data;
    })();
    
    // Cache the promise
    requestDeduplicationMap.current.set(requestKey, requestPromise);
    
    try {
      setLoading(true);
      await requestPromise;
    } catch (err: any) {
      // Don't update state if request was aborted or component unmounted
      if (err.name === 'AbortError' || !isMounted || requestId !== currentRequestIdRef.current) {
        return;
      }
      
      if (isMounted) {
        setError(err instanceof Error ? err.message : 'Failed to load blog posts');
        setPosts([]);
      }
    } finally {
      // Only clear loading and request tracking if this is still the current request
      if (!controller.signal.aborted && isMounted && requestId === currentRequestIdRef.current) {
        setLoading(false);
        abortControllerRef.current = null;
        ongoingRequestRef.current = null;
      }
      
      // Clean up cached promise after a delay to allow for immediate retries
      setTimeout(() => {
        requestDeduplicationMap.current.delete(requestKey);
      }, 1000);
    }
  }

  // Cleanup function for component unmount
  useEffect(() => {
    return () => {
      setIsMounted(false);
      // Abort any ongoing request when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Clear scroll timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      // Clear all image upgrade timeouts
      imageTimeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      imageTimeoutRefs.current.clear();
      // Clear request deduplication cache
      requestDeduplicationMap.current.clear();
      ongoingRequestRef.current = null;
    };
  }, []);

  async function handleLike(postId: string) {
    if (likingPostId) return; // Prevent concurrent likes
    
    // Store original state for rollback outside try block
    const originalLikedPosts = likedPosts;
    const originalPost = posts.find(p => p._id === postId);
    const originalLikeCount = originalPost?.likeCount || 0;
    
    try {
      setLikingPostId(postId);
      const isLiked = likedPosts.has(postId);
      const action = isLiked ? 'unlike' : 'like';
      
      // Optimistic UI update
      const newLikedPosts = new Set(likedPosts);
      if (isLiked) {
        newLikedPosts.delete(postId);
      } else {
        newLikedPosts.add(postId);
      }
      setLikedPosts(newLikedPosts);
      
      // Update post count optimistically
      setPosts(prev => prev.map(post => 
        post._id === postId ? { ...post, likeCount: isLiked ? Math.max(0, (post.likeCount || 0) - 1) : (post.likeCount || 0) + 1 } : post
      ));
      
      const res = await fetch(`/api/public/blog-posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      if (!res.ok) throw new Error('Failed to like post');
      
      const data = await res.json();
      
      // Update with server response to ensure consistency
      setPosts(prev => prev.map(post => 
        post._id === postId ? { ...post, likeCount: data.likeCount } : post
      ));
      
      // Track analytics for blog post interaction
      trackCommunityEvent('blog-post-like', action);
      
      // Save to localStorage safely
      safeSetItem('likedBlogPosts', Array.from(newLikedPosts))
        .catch(error => {
          console.error('Failed to save liked posts:', error);
        });
      
    } catch (err) {
      console.error('Like error:', err);
      
      // Rollback on failure
      setLikedPosts(originalLikedPosts);
      setPosts(prev => prev.map(post => 
        post._id === postId ? { ...post, likeCount: originalLikeCount } : post
      ));
    } finally {
      setLikingPostId(null);
    }
  }

  const getAllCategories = useMemo(() => {
    const categories = new Set<string>();
    posts.forEach(post => {
      post.categories.forEach(cat => categories.add(cat));
    });
    return Array.from(categories).sort();
  }, [posts]);

  const getAllTags = useMemo(() => {
    const tags = new Set<string>();
    posts.forEach(post => {
      post.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [posts]);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function getReadingTime(content: string) {
    if (!content) return 1; // Default to 1 minute if no content
    const wordsPerMinute = 200;
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  }

  function truncateExcerpt(excerpt: string, maxLength: number = 150) {
    if (excerpt.length <= maxLength) return excerpt;
    return excerpt.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
  }

  function getShareUrls(post: BlogPost) {
    const url = encodeURIComponent(window.location.origin + `/blog/${post.slug}`);
    const title = encodeURIComponent(post.title);
    const excerpt = encodeURIComponent(post.excerpt || post.title);

    return {
      twitter: `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      reddit: `https://reddit.com/submit?url=${url}&title=${title}`,
      email: `mailto:?subject=${title}&body=${excerpt}%0A%0A${url}`
    };
  }

  // Sanitize Cloudinary image filename to prevent path traversal
  function sanitizeImageFilename(filename: string): string {
    if (!filename) return '';
    
    // Extract filename from URL path
    const extractedFilename = filename.split('/').pop() || filename;
    
    // Remove any path traversal attempts and allow only safe characters
    const sanitized = extractedFilename
      .replace(/\.\./g, '') // Remove path traversal
      .replace(/[\/\\]/g, '') // Remove directory separators
      .replace(/[^a-zA-Z0-9._-]/g, ''); // Allow only alphanumeric, dots, hyphens, underscores
    
    return sanitized.substring(0, 100); // Limit length
  }

  function getPopularPosts() {
    return posts
      .filter(post => post.likeCount && post.likeCount > 0)
      .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
      .slice(0, 3);
  }

  function getRecentPosts() {
    return posts
      .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime())
      .slice(0, 3);
  }

  return (
    <div className="min-h-screen bg-pitchBlack">
      <BlogPageSEO />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <header className="text-center mb-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-vanillaCustard mb-4">
            Community Blog
          </h1>
          <p className="text-lg text-vanillaCustard/80 max-w-2xl mx-auto">
            Stories, insights, and experiences from the Fort Bend LGBTQIA+ community
          </p>
        </header>

        {/* Featured Content Section */}
        <div className="mb-12">
          {/* Featured Post Skeleton */}
          {loading && (
            <div className="rounded-2xl border border-vanillaCustard/20 bg-pitchBlack overflow-hidden shadow-lg">
              <div className="p-4 border-b border-vanillaCustard/10 bg-pitchBlack relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-paleAmber/30 rounded"></div>
                  <div className="w-24 h-4 bg-paleAmber/30 rounded"></div>
                </div>
              </div>
              <div className="p-6 relative z-10">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Featured Image Skeleton - Fixed aspect ratio */}
                  <div className="aspect-video overflow-hidden rounded-xl bg-graphite border border-vanillaCustard/15">
                    <div className="w-full h-full bg-gradient-to-br from-graphite to-pitchBlack animate-pulse"></div>
                  </div>
                  {/* Content Skeleton */}
                  <div className="flex flex-col justify-center min-w-0 space-y-3">
                    <div className="h-8 bg-vanillaCustard/20 rounded w-3/4"></div>
                    <div className="h-4 bg-vanillaCustard/10 rounded w-1/2"></div>
                    <div className="h-4 bg-vanillaCustard/10 rounded w-1/3"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-vanillaCustard/10 rounded"></div>
                      <div className="h-4 bg-vanillaCustard/10 rounded w-5/6"></div>
                    </div>
                    <div className="h-6 bg-paleAmber/20 rounded w-32"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Featured Post */}
          {!loading && !error && posts.length > 0 && (
            <div className="rounded-2xl border border-vanillaCustard/20 bg-pitchBlack overflow-hidden shadow-lg">
              <div className="p-4 border-b border-vanillaCustard/10 bg-pitchBlack relative z-10">
                <div className="flex items-center gap-2 text-paleAmber">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="font-bold">Featured Story</span>
                </div>
              </div>
              <div className="p-6 relative z-10">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Featured Image */}
                  <div className="aspect-video overflow-hidden rounded-xl bg-graphite border border-vanillaCustard/15">
                    {posts[0].featuredImage ? (
                      <picture>
                        <source 
                          type="image/webp" 
                          srcSet={`
                            https://res.cloudinary.com/dpus8jzix/image/upload/q_auto:low,w_400,h_225,c_fill/ftbend-community-gallery/${sanitizeImageFilename(posts[0].featuredImage)} 400w,
                            https://res.cloudinary.com/dpus8jzix/image/upload/q_auto:low,w_800,h_450,c_fill/ftbend-community-gallery/${sanitizeImageFilename(posts[0].featuredImage)} 800w
                          `}
                          sizes="(max-width: 767px) 400px, 800px"
                        />
                        <source 
                          type="image/jpeg" 
                          srcSet={`
                            https://res.cloudinary.com/dpus8jzix/image/upload/q_auto:low,w_400,h_225,c_fill/ftbend-community-gallery/${sanitizeImageFilename(posts[0].featuredImage)} 400w,
                            https://res.cloudinary.com/dpus8jzix/image/upload/q_auto:low,w_800,h_450,c_fill/ftbend-community-gallery/${sanitizeImageFilename(posts[0].featuredImage)} 800w
                          `}
                          sizes="(max-width: 767px) 400px, 800px"
                        />
                        <img
                          src={`https://res.cloudinary.com/dpus8jzix/image/upload/q_auto:low,w_400,h_225,c_fill/ftbend-community-gallery/${sanitizeImageFilename(posts[0].featuredImage)}`}
                          alt={posts[0].featuredImageAlt || posts[0].title}
                          width={400}
                          height={225}
                          className="w-full h-full object-cover transition-opacity duration-300"
                          fetchPriority="high"
                          loading="eager"
                          decoding="async"
                          sizes="(max-width: 767px) 400px, 800px"
                          style={{
                            contentVisibility: 'auto',
                            contain: 'layout'
                          }}
                          onLoad={(e) => {
                            // Upgrade to higher quality after initial load
                            const img = e.target as HTMLImageElement;
                            const featuredImage = posts[0].featuredImage;
                            if (featuredImage && isMounted) {
                              const timeoutId = setTimeout(() => {
                                if (isMounted) {
                                  img.src = `https://res.cloudinary.com/dpus8jzix/image/upload/q_auto,f_auto,w_800,h_450,c_fill/ftbend-community-gallery/${sanitizeImageFilename(featuredImage)}`;
                                }
                              }, 100);
                              imageTimeoutRefs.current.set(`featured-${posts[0]._id}`, timeoutId);
                            }
                          }}
                          onError={(e) => {
                            // Fallback to original URL if Cloudinary fails
                            if (posts[0].featuredImage) {
                              (e.target as HTMLImageElement).src = posts[0].featuredImage;
                            }
                          }}
                        />
                      </picture>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-vanillaCustard/50">
                        <div className="text-center">
                          <div className="text-4xl mb-2">📝</div>
                          <div className="text-sm">No featured image</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col justify-center min-w-0">
                    <Link to={`/blog/${posts[0].slug}`} className="group">
                      <h2 className="text-2xl font-bold text-vanillaCustard mb-3 group-hover:text-paleAmber transition-colors break-words">
                        {posts[0].title}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-vanillaCustard/60 mb-4">
                        <span className="px-2 py-1 rounded-lg bg-powderBlush/10 text-powderBlush font-medium border border-powderBlush/20 whitespace-nowrap">By {posts[0].authorName}</span>
                        <span className="whitespace-nowrap">{formatDate(posts[0].publishedAt || posts[0].createdAt)}</span>
                        <span className="whitespace-nowrap">{getReadingTime(posts[0].content)} min read</span>
                        {posts[0].likeCount !== undefined && (
                          <span className="flex items-center gap-1 text-paleAmber whitespace-nowrap">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {posts[0].likeCount}
                          </span>
                        )}
                      </div>
                      {posts[0].excerpt && (
                        <p className="text-vanillaCustard/90 mb-4 line-clamp-3 break-words">
                          {truncateExcerpt(posts[0].excerpt)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-paleAmber hover:text-vanillaCustard transition-colors">
                        <span className="font-semibold">Read Featured Story</span>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
</div>
        </div>

        {/* Search and Filters Section */}
        <div className="bg-pitchBlack/95 backdrop-blur-sm border-b border-vanillaCustard/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="py-2">
            {/* Search - Always Visible */}
            <div className="relative mb-2">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-vanillaCustard/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search blog posts..."
                className="w-full rounded-xl border border-vanillaCustard/20 bg-graphite pl-10 pr-4 py-2 text-sm text-vanillaCustard placeholder-vanillaCustard/50 focus:border-paleAmber focus:outline-none focus:ring-1 focus:ring-paleAmber/50 transition-all"
              />
            </div>

            {/* Filters - Ultra Compact Single Row */}
            <div className="flex flex-wrap items-center gap-1 text-xs max-w-full overflow-hidden">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as 'recent' | 'popular' | 'trending');
                  setCurrentPage(1);
                }}
                className="rounded-md border border-vanillaCustard/20 bg-graphite px-2 py-1 text-vanillaCustard focus:border-paleAmber focus:outline-none focus:ring-1 focus:ring-paleAmber/50 transition-all flex-shrink-0"
              >
                <option value="recent">Recent</option>
                <option value="popular">Popular</option>
                <option value="trending">Trending</option>
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-md border border-vanillaCustard/20 bg-graphite px-2 py-1 text-vanillaCustard focus:border-paleAmber focus:outline-none focus:ring-1 focus:ring-paleAmber/50 transition-all flex-shrink-0"
              >
                <option value="">Categories</option>
                {getAllCategories.map((category: string) => (
                  <option key={category} value={category}>
                    {category.length > 10 ? category.substring(0, 10) + '...' : category}
                  </option>
                ))}
              </select>

              <select
                value={selectedTag}
                onChange={(e) => {
                  setSelectedTag(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-md border border-vanillaCustard/20 bg-graphite px-2 py-1 text-vanillaCustard focus:border-paleAmber focus:outline-none focus:ring-1 focus:ring-paleAmber/50 transition-all flex-shrink-0"
              >
                <option value="">All Tags</option>
                {getAllTags.map((tag: string) => (
                  <option key={tag} value={tag}>
                    #{tag.length > 8 ? tag.substring(0, 8) + '...' : tag}
                  </option>
                ))}
              </select>
            </div>
          </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-vanillaCustard/90">Loading blog posts...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="rounded-2xl border border-vanillaCustard/20 bg-pitchBlack/50 p-8 max-w-md mx-auto">
              <h3 className="text-vanillaCustard font-semibold mb-2">Unable to Load Blog Posts</h3>
              <p className="text-vanillaCustard/70 mb-4">
                We're having trouble loading our blog posts right now. 
                Please try refreshing the page or check back later.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-paleAmber text-pitchBlack rounded-lg hover:bg-vanillaCustard transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Blog Posts Grid Skeletons */}
        {loading && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={`skeleton-${index}`} className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack overflow-hidden">
                {/* Image Skeleton - Fixed aspect ratio */}
                <div className="aspect-video bg-graphite border-b border-vanillaCustard/15">
                  <div className="w-full h-full bg-gradient-to-br from-graphite to-pitchBlack animate-pulse"></div>
                </div>
                {/* Content Skeleton */}
                <div className="p-4 sm:p-6 space-y-3">
                  <div className="h-6 bg-vanillaCustard/20 rounded w-3/4"></div>
                  <div className="flex flex-wrap gap-2">
                    <div className="h-3 bg-vanillaCustard/10 rounded w-16"></div>
                    <div className="h-3 bg-vanillaCustard/10 rounded w-20"></div>
                    <div className="h-3 bg-vanillaCustard/10 rounded w-16"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-vanillaCustard/10 rounded"></div>
                    <div className="h-4 bg-vanillaCustard/10 rounded w-5/6"></div>
                    <div className="h-4 bg-vanillaCustard/10 rounded w-4/6"></div>
                  </div>
                  <div className="h-5 bg-paleAmber/20 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Blog Posts Grid */}
        {!loading && !error && (
          <>
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-vanillaCustard/90 mb-4">
                  <svg className="h-16 w-16 mx-auto mb-4 text-vanillaCustard/60" fill="none" viewBox="0 0 24 24">
                    <defs>
                      <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="20%" stopColor="#f59e0b" />
                        <stop offset="40%" stopColor="#eab308" />
                        <stop offset="60%" stopColor="#22c55e" />
                        <stop offset="80%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} stroke="url(#rainbow)" d="M3 12h18M7 8l4 4 4-4M7 16l4-4 4 4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-vanillaCustard mb-2">No blog posts yet</h3>
                <p className="text-vanillaCustard/70 mb-4">
                  Check back soon for community stories and insights!
                </p>
              </div>
            ) : (
              <>
                <div className="text-sm text-vanillaCustard/70 mb-6">
                  Showing {posts.length} blog posts
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {posts.map((post) => (
                    <article
                      key={post._id}
                      className="blog-post-card group rounded-2xl border border-vanillaCustard/15 bg-pitchBlack overflow-hidden transition-all duration-300 hover:border-vanillaCustard/25 hover:shadow-lg hover:shadow-powderBlush/10"
                    >
                      {/* Featured Image */}
                      {post.featuredImage && (
                        <Link
                          to={`/blog/${post.slug}`}
                          className="block aspect-video overflow-hidden bg-graphite"
                        >
                          <div className="skeleton-image w-full h-full absolute inset-0" />
                          <picture>
                            <source 
                              type="image/webp" 
                              srcSet={`https://res.cloudinary.com/dpus8jzix/image/upload/q_auto:low,w_300,h_169,c_fill/ftbend-community-gallery/${sanitizeImageFilename(post.featuredImage)} 300w`}
                              sizes="300px"
                            />
                            <source 
                              type="image/jpeg" 
                              srcSet={`https://res.cloudinary.com/dpus8jzix/image/upload/q_auto:low,w_300,h_169,c_fill/ftbend-community-gallery/${sanitizeImageFilename(post.featuredImage)} 300w`}
                              sizes="300px"
                            />
                            <img
                              src={`https://res.cloudinary.com/dpus8jzix/image/upload/q_auto:low,w_300,h_169,c_fill/ftbend-community-gallery/${sanitizeImageFilename(post.featuredImage)}`}
                              alt={post.featuredImageAlt || post.title}
                              width={300}
                              height={169}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 relative z-10"
                              loading="lazy"
                              decoding="async"
                              sizes="300px"
                              style={{
                                contentVisibility: 'auto',
                                contain: 'layout'
                              }}
                              onLoad={(e) => {
                                // Upgrade to higher quality after initial load
                                const img = e.target as HTMLImageElement;
                                if (post.featuredImage && isMounted) {
                                  const timeoutId = setTimeout(() => {
                                    if (isMounted) {
                                      img.src = `https://res.cloudinary.com/dpus8jzix/image/upload/q_auto,f_auto,w_400,h_225,c_fill/ftbend-community-gallery/${sanitizeImageFilename(post.featuredImage)}`;
                                    }
                                  }, 200);
                                  imageTimeoutRefs.current.set(`post-${post._id}`, timeoutId);
                                }
                              }}
                              onError={(e) => {
                                // Fallback to original URL if Cloudinary fails
                                if (post.featuredImage) {
                                  (e.target as HTMLImageElement).src = post.featuredImage;
                                }
                              }}
                            />
                          </picture>
                        </Link>
                      )}

                      <div className="p-4 sm:p-6">
                        {/* Title */}
                        <Link
                          to={`/blog/${post.slug}`}
                          className="block mb-3"
                        >
                          <h2 className="text-xl font-bold text-vanillaCustard group-hover:text-paleAmber transition-colors duration-300">
                            {post.title}
                          </h2>
                        </Link>

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-vanillaCustard/70 mb-4">
                          <span>By {post.authorName}</span>
                          <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                          <span>{getReadingTime(post.content)} min read</span>
                        {/* Like Button */}
                        <button
                          onClick={() => handleLike(post._id)}
                          disabled={likingPostId === post._id}
                          className={`flex items-center gap-1 text-sm transition-colors ${
                            likingPostId === post._id
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:text-paleAmber cursor-pointer'
                          } ${likedPosts.has(post._id) ? 'text-paleAmber' : 'text-vanillaCustard/70'}`}
                        >
                          <svg className="h-3 w-3" fill={likedPosts.has(post._id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {post.likeCount !== undefined ? post.likeCount : 0}
                        </button>
                        </div>

                        {/* Excerpt */}
                        {post.excerpt && (
                          <p className="text-vanillaCustard/90 mb-4 line-clamp-3">
                            {truncateExcerpt(post.excerpt)}
                          </p>
                        )}

                        {/* Read More Link */}
                        <Link
                          to={`/blog/${post.slug}`}
                          className="inline-flex items-center gap-2 text-paleAmber hover:text-vanillaCustard font-semibold transition-colors duration-300"
                        >
                          Read More
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-12">
                    <button
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="rounded-xl border border-vanillaCustard/20 bg-graphite px-4 py-2 text-vanillaCustard hover:border-paleAmber disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, index) => (
                        <button
                          key={index + 1}
                          onClick={() => handlePageChange(index + 1)}
                          className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                            currentPage === index + 1
                              ? 'bg-powderBlush text-pitchBlack'
                              : 'border border-vanillaCustard/20 text-vanillaCustard hover:border-paleAmber hover:text-vanillaCustard'
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-xl border border-vanillaCustard/20 bg-graphite px-4 py-2 text-vanillaCustard hover:border-paleAmber disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-8">
            <h2 className="text-2xl font-bold text-vanillaCustard mb-4">
              Have a Story to Share?
            </h2>
            <p className="text-vanillaCustard/80 mb-6 max-w-2xl mx-auto">
              Your experiences and insights can help others in our community. Share your story and contribute to our collective knowledge.
            </p>
            <Link
              to="/submit-blog-contribution"
              className="inline-flex items-center gap-2 rounded-xl bg-powderBlush px-6 py-3 text-base font-bold text-pitchBlack hover:brightness-95 transition-all"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Submit Your Story
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
