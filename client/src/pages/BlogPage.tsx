import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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

  const postsPerPage = 12;

  useEffect(() => {
    // Only fetch posts if not the initial load
    if (posts.length > 0) {
      const scrollY = window.scrollY;
      fetchPosts().then(() => {
        // Restore scroll position after data loads
        setTimeout(() => {
          window.scrollTo(0, scrollY);
        }, 100);
      });
    } else {
      fetchPosts();
    }
    // Load liked posts from localStorage
    const savedLikedPosts = localStorage.getItem('likedBlogPosts');
    if (savedLikedPosts) {
      setLikedPosts(new Set(JSON.parse(savedLikedPosts)));
    }
  }, [currentPage, selectedCategory, selectedTag, searchQuery, sortBy]);

  async function handlePageChange(newPage: number) {
    setCurrentPage(newPage);
  }

  async function fetchPosts() {
    try {
      setLoading(true);
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

      const response = await fetch(`/api/public/blog-posts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch blog posts');
      
      const data: BlogListResponse = await response.json();
      setPosts(data.posts);
      setTotalPages(data.pagination.pages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load blog posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleLike(postId: string) {
    try {
      const isLiked = likedPosts.has(postId);
      const action = isLiked ? 'unlike' : 'like';
      
      const res = await fetch(`/api/public/blog-posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      if (!res.ok) throw new Error('Failed to like post');
      
      const data = await res.json();
      
      // Update local state
      setPosts(prev => prev.map(post => 
        post._id === postId ? { ...post, likeCount: data.likeCount } : post
      ));
      
      // Update liked posts
      const newLikedPosts = new Set(likedPosts);
      if (isLiked) {
        newLikedPosts.delete(postId);
      } else {
        newLikedPosts.add(postId);
      }
      setLikedPosts(newLikedPosts);
      localStorage.setItem('likedBlogPosts', JSON.stringify(Array.from(newLikedPosts)));
      
    } catch (err) {
      console.error('Like error:', err);
    }
  }

  function getAllCategories() {
    const categories = new Set<string>();
    posts.forEach(post => {
      post.categories.forEach(cat => categories.add(cat));
    });
    return Array.from(categories).sort();
  }

  function getAllTags() {
    const tags = new Set<string>();
    posts.forEach(post => {
      post.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

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
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-vanillaCustard mb-4">
            Community Blog
          </h1>
          <p className="text-lg text-vanillaCustard/80 max-w-2xl mx-auto">
            Stories, insights, and experiences from the Fort Bend LGBTQIA+ community
          </p>
        </header>

        {/* Featured Content Section */}
        <div className="mb-12">
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
                      <img
                        src={posts[0].featuredImage}
                        alt={posts[0].title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="h-12 w-12 text-vanillaCustard/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col justify-center">
                    <Link to={`/blog/${posts[0].slug}`} className="group">
                      <h2 className="text-2xl font-bold text-vanillaCustard mb-3 group-hover:text-paleAmber transition-colors">
                        {posts[0].title}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-vanillaCustard/60 mb-4">
                        <span className="px-2 py-1 rounded-lg bg-powderBlush/10 text-powderBlush font-medium border border-powderBlush/20">By {posts[0].authorName}</span>
                        <span>{formatDate(posts[0].publishedAt || posts[0].createdAt)}</span>
                        <span>{getReadingTime(posts[0].content)} min read</span>
                        {posts[0].likeCount !== undefined && (
                          <span className="flex items-center gap-1 text-paleAmber">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {posts[0].likeCount}
                          </span>
                        )}
                      </div>
                      {posts[0].excerpt && (
                        <p className="text-vanillaCustard/80 mb-4 line-clamp-2">
                          {truncateExcerpt(posts[0].excerpt, 200)}
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
        <div className="sticky top-16 z-30 bg-pitchBlack/95 backdrop-blur-sm border-b border-vanillaCustard/10">
          <div className="py-2">
            {/* Search - Always Visible */}
            <div className="relative mb-2">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-vanillaCustard/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search blog posts..."
                className="w-full rounded-xl border border-vanillaCustard/20 bg-graphite pl-10 pr-4 py-2 text-sm text-vanillaCustard placeholder-vanillaCustard/50 focus:border-paleAmber focus:outline-none focus:ring-1 focus:ring-paleAmber/50 transition-all"
              />
            </div>

            {/* Filters - Ultra Compact Single Row */}
            <div className="flex items-center gap-1 text-xs">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as 'recent' | 'popular' | 'trending');
                  setCurrentPage(1);
                }}
                className="rounded-md border border-vanillaCustard/20 bg-graphite px-2 py-1 text-vanillaCustard focus:border-paleAmber focus:outline-none focus:ring-1 focus:ring-paleAmber/50 transition-all"
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
                className="rounded-md border border-vanillaCustard/20 bg-graphite px-2 py-1 text-vanillaCustard focus:border-paleAmber focus:outline-none focus:ring-1 focus:ring-paleAmber/50 transition-all"
              >
                <option value="">Categories</option>
                {getAllCategories().map(category => (
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
                className="rounded-md border border-vanillaCustard/20 bg-graphite px-2 py-1 text-vanillaCustard focus:border-paleAmber focus:outline-none focus:ring-1 focus:ring-paleAmber/50 transition-all"
              >
                <option value="">All Tags</option>
                {getAllTags().map(tag => (
                  <option key={tag} value={tag}>
                    #{tag.length > 8 ? tag.substring(0, 8) + '...' : tag}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-8">

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-vanillaCustard/90">Loading blog posts...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="rounded-2xl border border-red-500/30 bg-red-900/20 p-8 max-w-md mx-auto">
              <div className="text-red-200 mb-4">⚠️</div>
              <div className="text-red-200">{error}</div>
            </div>
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
                  Showing {posts.length} of {totalPages * postsPerPage} blog posts
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {posts.map((post) => (
                    <article
                      key={post._id}
                      className="group rounded-2xl border border-vanillaCustard/15 bg-pitchBlack overflow-hidden transition-all duration-300 hover:border-vanillaCustard/25 hover:shadow-lg hover:shadow-powderBlush/10"
                    >
                      {/* Featured Image */}
                      {post.featuredImage && (
                        <Link
                          to={`/blog/${post.slug}`}
                          className="block aspect-video overflow-hidden bg-graphite"
                        >
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </Link>
                      )}

                      <div className="p-6">
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
                          {post.likeCount !== undefined && (
                            <span className="flex items-center gap-1">
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              {post.likeCount}
                            </span>
                          )}
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
