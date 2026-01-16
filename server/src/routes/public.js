const express = require('express');
const { z } = require('zod');

const Resource = require('../models/Resource');
const Event = require('../models/Event');
const Submission = require('../models/Submission');
const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const GalleryImage = require('../models/GalleryImage');
const BlogPost = require('../models/BlogPost');
const { validate } = require('../lib/validate');
const { sendEmail } = require('../lib/email');
const { getOrCreateNotificationSettings } = require('../lib/notificationSettings');
const emailService = require('../services/emailService');

const router = express.Router();

function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap((x) => String(x).split(',')).map((x) => x.trim()).filter(Boolean);
  return String(value)
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function normalizeUrl(input) {
  const trimmed = String(input || '').trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const UrlSchema = z
  .string()
  .trim()
  .max(500)
  .transform((v) => normalizeUrl(v))
  .refine(
    (v) => {
      try {
        const u = new URL(v);
        return u.protocol === 'http:' || u.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Invalid url' }
  );

router.get('/resources', async (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const locations = normalizeList(req.query.locations);
    const types = normalizeList(req.query.types);
    const audiences = normalizeList(req.query.audiences);
    
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12; // 12 resources per page
    const skip = (page - 1) * limit;

    const filter = { status: 'active' };
    if (locations.length) filter.locations = { $in: locations };
    if (types.length) filter.types = { $in: types };
    if (audiences.length) filter.audiences = { $in: audiences };

    if (q) {
      filter.$text = { $search: q };

      const items = await Resource.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' }, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Resource.countDocuments(filter);

      return res.json({ 
        items,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    }

    const items = await Resource.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Resource.countDocuments(filter);
    
    return res.json({ 
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (e) {
    next(e);
  }
});

router.get('/events', async (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const filter = { status: 'active' };

    if (q) {
      filter.$text = { $search: q };

      const items = await Event.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' }, name: 1 })
        .limit(200)
        .lean();

      return res.json({ items });
    }

    const items = await Event.find(filter).sort({ name: 1 }).limit(200).lean();
    return res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.post('/submissions', async (req, res, next) => {
  try {
    const input = validate(
      z.object({
        name: z.string().min(2).max(140),
        url: UrlSchema,
        notes: z.string().max(2000).optional().default('')
      }),
      req.body
    );

    const submission = await Submission.create({
      name: input.name,
      url: input.url,
      notes: input.notes,
      status: 'pending'
    });

    void (async () => {
      try {
        const settings = await getOrCreateNotificationSettings();
        console.log('[submission] notification settings loaded. enabled?', settings.submissionEmailEnabled, 'recipients?', settings.submissionEmailRecipients);
        if (!settings.submissionEmailEnabled) {
          console.log('[submission] notifications disabled; skipping email');
          return;
        }

        const recipients = Array.isArray(settings.submissionEmailRecipients)
          ? settings.submissionEmailRecipients.map((x) => String(x || '').trim()).filter(Boolean)
          : [];
        if (!recipients.length) {
          console.log('[submission] no recipients; skipping email');
          return;
        }

        const base = String(settings.publicSiteUrl || '').replace(/\/+$/, '');
        const adminUrl = `${base}/admin/submissions`;

        const subject = `New resource submission: ${submission.name}`;
        const text = `A new resource was submitted to the Fort Bend County LGBTQIA+ Community Resources website.\n\nName: ${submission.name}\nURL: ${submission.url}\n\nReview in admin: ${adminUrl}`;
        const html = `
          <p>A new resource was submitted to the Fort Bend County LGBTQIA+ Community Resources website.</p>
          <p><strong>Name:</strong> ${submission.name}</p>
          <p><strong>URL:</strong> <a href="${submission.url}" target="_blank" rel="noreferrer">${submission.url}</a></p>
          <p><a href="${adminUrl}" target="_blank" rel="noreferrer">Review submissions</a></p>
        `;

        await sendEmail({ to: recipients, subject, text, html });
      } catch (e) {
        console.error('Submission notification email failed', e);
      }
    })();

    res.status(201).json({
      id: submission._id,
      status: submission.status
    });
  } catch (e) {
    next(e);
  }
});

router.post('/newsletter/subscribe', async (req, res, next) => {
  try {
    const input = validate(
      z.object({
        email: z.string().email().max(200)
      }),
      req.body
    );

    const existing = await NewsletterSubscriber.findOne({ email: input.email.toLowerCase().trim() });
    if (existing) {
      if (existing.status === 'unsubscribed') {
        existing.status = 'active';
        await existing.save();
      }
      return res.status(200).json({ status: 'subscribed' });
    }

    await NewsletterSubscriber.create({
      email: input.email.toLowerCase().trim(),
      source: 'public_signup',
      status: 'active'
    });

    // Send welcome email using ZeptoMail
    try {
      await emailService.sendNewsletterWelcome(input.email, input.email.split('@')[0]);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the subscription if email fails
    }

    res.status(201).json({ status: 'subscribed' });
  } catch (e) {
    next(e);
  }
});

// Public gallery list
router.get('/gallery', async (req, res, next) => {
  try {
    const items = await GalleryImage.find({ status: 'active' }).sort({ order: 1 }).lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

// Blog post submission
router.post('/blog-submissions', async (req, res, next) => {
  try {
    console.log('Received blog submission request body:', req.body); // Debug log
    
    const input = validate(
      z.object({
        title: z.string().min(2).max(200),
        content: z.string().min(1500).max(10000),
        authorName: z.string().max(100).optional().default('Anonymous'),
        authorEmail: z.string().max(255).optional().default('').refine((val) => {
          if (!val || val === '') return true; // Allow empty string
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val); // Validate email format if provided
        }, { message: 'Invalid email format' }),
        categories: z.array(z.string().max(50)).optional().default([]),
        tags: z.array(z.string().max(30)).optional().default([]),
        excerpt: z.string().max(500).optional().default(''),
        metaDescription: z.string().max(160).optional().default(''),
        featuredImage: z.string().max(500).optional().default(''),
        submissionConsent: z.boolean().refine(val => val === true, { message: 'Submission consent is required' }),
        privacyConsent: z.boolean().refine(val => val === true, { message: 'Privacy consent is required' })
      }),
      req.body
    );

    // Generate slug from title
    const slug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-') + `-${Date.now().toString(36)}`;

    const blogPost = await BlogPost.create({
      title: input.title,
      slug: slug,
      content: input.content,
      authorName: input.authorName,
      authorEmail: input.authorEmail,
      categories: input.categories,
      tags: input.tags,
      excerpt: input.excerpt,
      metaDescription: input.metaDescription,
      featuredImage: input.featuredImage,
      submissionConsent: input.submissionConsent,
      privacyConsent: input.privacyConsent,
      status: 'pending'
    });

    // Send notification email to admins
    void (async () => {
      try {
        const settings = await getOrCreateNotificationSettings();
        if (!settings.submissionEmailEnabled) {
          console.log('[blog submission] notifications disabled; skipping email');
          return;
        }

        const recipients = Array.isArray(settings.submissionEmailRecipients)
          ? settings.submissionEmailRecipients.map((x) => String(x || '').trim()).filter(Boolean)
          : [];
        if (!recipients.length) {
          console.log('[blog submission] no recipients; skipping email');
          return;
        }

        const base = String(settings.publicSiteUrl || '').replace(/\/+$/, '');
        const blogUrl = `${base}/blog`;
        const adminUrl = `${base}/admin/blog-posts/${blogPost._id}`;

        const subject = `New blog post submission: ${blogPost.title}`;
        const text = `A new blog post was submitted to the Fort Bend County LGBTQIA+ Community Resources website.\n\nTitle: ${blogPost.title}\nAuthor: ${blogPost.authorName}\nContent Preview:\n${blogPost.content.substring(0, 500)}...\n\nTo review and publish this submission, please log in to the admin dashboard: ${adminUrl}\n\nNote: You'll be taken directly to the blog post editor after logging in.\n\nPublic blog page: ${blogUrl}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; margin-bottom: 20px;">New Blog Post Submission</h1>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">Post Information</h2>
              <p><strong>Title:</strong> ${blogPost.title}</p>
              <p><strong>Author:</strong> ${blogPost.authorName}</p>
              <p><strong>Status:</strong> Pending review</p>
              
              <div style="margin: 15px 0;">
                <h3 style="color: #666; font-size: 14px; margin-bottom: 8px;">Content Preview:</h3>
                <div style="background: white; padding: 15px; border-left: 4px solid #007bff; border-radius: 4px;">
                  ${blogPost.content.substring(0, 500).replace(/\n/g, '<br>')}...
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${adminUrl}" target="_blank" rel="noreferrer" style="display: inline-block; background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Review Blog Post</a>
              <p style="margin-top: 10px; color: #666; font-size: 14px;">Log in to edit and publish this submission</p>
              <p style="margin-top: 5px; color: #999; font-size: 12px; font-style: italic;">You'll go directly to the blog post editor</p>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
              <p style="color: #999; font-size: 12px;">
                <a href="${blogUrl}" target="_blank" rel="noreferrer" style="color: #007bff;">View Public Blog Page</a>
              </p>
            </div>
          </div>
        `;

        await sendEmail({ to: recipients, subject, text, html });
      } catch (e) {
        console.error('Blog submission notification email failed', e);
      }
    })();

    res.status(201).json({
      id: blogPost._id,
      status: blogPost.status
    });
  } catch (e) {
    next(e);
  }
});

// Get published blog posts
router.get('/blog-posts', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { status: 'published' };
    
    // Add search functionality
    if (req.query.q) {
      filter.$text = { $search: req.query.q };
    }

    // Add category filter
    if (req.query.category) {
      filter.categories = { $in: [req.query.category] };
    }

    // Add tag filter
    if (req.query.tag) {
      filter.tags = { $in: [req.query.tag] };
    }

    const posts = await BlogPost.find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-content') // Exclude content from list view
      .lean();

    const total = await BlogPost.countDocuments(filter);

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (e) {
    next(e);
  }
});

// Get single blog post
router.get('/blog-posts/:slug', async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({ 
      slug: req.params.slug, 
      status: 'published' 
    }).lean();

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Increment view count
    await BlogPost.updateOne(
      { _id: post._id },
      { $inc: { viewCount: 1 } }
    );

    res.json({ post });
  } catch (e) {
    next(e);
  }
});

// Preview pending blog post (simplified - no email verification)
router.get('/blog-posts/:slug/preview', async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({ 
      slug: req.params.slug,
      status: { $in: ['pending', 'published'] } // Allow both pending and published
    }).lean();

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Don't increment view count for previews
    res.json({ post, isPreview: true });
  } catch (e) {
    next(e);
  }
});

// Like/unlike a blog post
router.post('/blog-posts/:id/like', async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    if (post.status !== 'published') {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Check if this is a like or unlike based on the request body
    const { action } = req.body;
    const increment = action === 'unlike' ? -1 : 1;

    // Update like count
    const updatedPost = await BlogPost.findByIdAndUpdate(
      req.params.id,
      { $inc: { likeCount: increment } },
      { new: true, runValidators: true }
    ).select('likeCount');

    res.json({ likeCount: Math.max(0, updatedPost.likeCount || 0) });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
