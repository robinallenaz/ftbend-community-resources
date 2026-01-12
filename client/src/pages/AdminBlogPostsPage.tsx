import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface BlogPost {
  _id: string;
  title: string;
  authorName: string;
  authorEmail: string;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  categories: string[];
  tags: string[];
  createdAt: string;
  submissionConsent: boolean;
  privacyConsent: boolean;
  excerpt?: string;
  featuredImage?: string;
  slug: string;
  publishedAt?: string;
  viewCount?: number;
  likeCount?: number;
}

export default function AdminBlogPostsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const res = await fetch('/api/admin/blog-posts');
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function updatePostStatus(postId: string, status: string) {
    try {
      const res = await fetch(`/api/admin/blog-posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (!res.ok) throw new Error('Failed to update post status');
      
      // Refresh the posts list
      await fetchPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update post');
    }
  }

  async function deletePost(postId: string) {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    
    try {
      const res = await fetch(`/api/admin/blog-posts/${postId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Failed to delete post');
      
      // Refresh the posts list
      await fetchPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
    }
  }

  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true;
    return post.status === filter;
  });

  const statusColors = {
    pending: 'bg-yellow-900/20 text-yellow-200 border-yellow-500/30',
    approved: 'bg-blue-900/20 text-blue-200 border-blue-500/30',
    rejected: 'bg-red-900/20 text-red-200 border-red-500/30',
    published: 'bg-green-900/20 text-green-200 border-green-500/30'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-vanillaCustard/90">Loading blog posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-900/20 border border-red-500/30 p-4 text-red-200">
        <p>Error: {error}</p>
        <button 
          onClick={fetchPosts}
          className="mt-2 rounded-xl bg-red-800 px-3 py-1 text-sm hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-vanillaCustard">Blog Posts</h1>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-vanillaCustard/20 bg-graphite px-3 py-2 text-vanillaCustard"
          >
            <option value="all">All Posts</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="published">Published</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-8 text-center">
          <div className="text-vanillaCustard/90">
            {filter === 'all' ? 'No blog posts found.' : `No ${filter} blog posts found.`}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div
              key={post._id}
              className="rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-vanillaCustard">{post.title}</h3>
                    <span className={`rounded-lg border px-2 py-1 text-xs font-semibold ${statusColors[post.status]}`}>
                      {post.status}
                    </span>
                  </div>
                  
                  <div className="text-sm text-vanillaCustard/80">
                    <p>By: {post.authorName} {post.authorEmail && `(${post.authorEmail})`}</p>
                    <p>Submitted: {new Date(post.createdAt).toLocaleDateString()}</p>
                    {post.publishedAt && (
                      <p>Published: {new Date(post.publishedAt).toLocaleDateString()}</p>
                    )}
                  </div>

                  {post.excerpt && (
                    <p className="text-vanillaCustard/90 line-clamp-2">{post.excerpt}</p>
                  )}

                  {(post.categories.length > 0 || post.tags.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {post.categories.map((category) => (
                        <span
                          key={category}
                          className="rounded-lg bg-powderBlush/20 text-paleAmber px-2 py-1 text-xs"
                        >
                          {category}
                        </span>
                      ))}
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg bg-graphite border border-vanillaCustard/20 text-vanillaCustard/70 px-2 py-1 text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/admin/blog-posts/${post._id}`}
                    className="rounded-xl bg-powderBlush px-3 py-2 text-sm font-bold text-pitchBlack hover:brightness-95 transition"
                  >
                    Edit
                  </Link>
                  
                  {post.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updatePostStatus(post._id, 'approved')}
                        className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700 transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updatePostStatus(post._id, 'rejected')}
                        className="rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700 transition"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  
                  {post.status === 'approved' && (
                    <button
                      onClick={() => updatePostStatus(post._id, 'published')}
                      className="rounded-xl bg-green-600 px-3 py-2 text-sm font-bold text-white hover:bg-green-700 transition"
                    >
                      Publish
                    </button>
                  )}
                  
                  {post.status === 'published' && (
                    <Link
                      to={`/blog/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-powderBlush px-3 py-2 text-sm font-bold text-pitchBlack hover:brightness-95 transition"
                    >
                      View Post
                    </Link>
                  )}
                  
                  <button
                    onClick={() => deletePost(post._id)}
                    className="rounded-xl bg-red-900 px-3 py-2 text-sm font-bold text-white hover:bg-red-800 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
