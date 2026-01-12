const mongoose = require('mongoose');

const BlogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 10000 },
    authorName: { type: String, trim: true, maxlength: 100, default: 'Anonymous' },
    authorEmail: { type: String, trim: true, maxlength: 255, default: '' },
    categories: [{ type: String, trim: true, maxlength: 50 }],
    tags: [{ type: String, trim: true, maxlength: 30 }],
    status: { 
      type: String, 
      required: true, 
      enum: ['pending', 'approved', 'rejected', 'published'], 
      default: 'pending' 
    },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, trim: true, maxlength: 500 },
    featuredImage: { type: String, trim: true, maxlength: 500, default: '' },
    metaDescription: { type: String, trim: true, maxlength: 160 },
    publishedAt: { type: Date, default: null },
    reviewedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    reviewNotes: { type: String, trim: true, maxlength: 1000, default: '' },
    submissionConsent: { 
      type: Boolean, 
      required: true,
      description: 'Author consents to publication and terms'
    },
    privacyConsent: { 
      type: Boolean, 
      required: true,
      description: 'Author consents to privacy policy'
    },
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Generate slug from title
BlogPostSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
    
    // Add random suffix if slug exists
    if (this.isNew) {
      this.slug += `-${Date.now().toString(36)}`;
    }
  }
  next();
});

// Generate excerpt from content if not provided
BlogPostSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.excerpt) {
    this.excerpt = this.content
      .replace(/<[^>]*>/g, '') // Remove HTML
      .substring(0, 200)
      .trim() + '...';
  }
  next();
});

// Virtual for reading time
BlogPostSchema.virtual('readingTime').get(function() {
  const wordsPerMinute = 200;
  const words = this.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
});

// Index for search
BlogPostSchema.index({ title: 'text', content: 'text', excerpt: 'text' });
BlogPostSchema.index({ status: 1, publishedAt: -1 });
BlogPostSchema.index({ categories: 1 });
BlogPostSchema.index({ tags: 1 });

module.exports = mongoose.model('BlogPost', BlogPostSchema);
