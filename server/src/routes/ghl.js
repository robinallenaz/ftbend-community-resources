const express = require('express');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');

const { requireAuth, requireRole } = require('../lib/auth');
const { validate } = require('../lib/validate');
const ghl = require('../lib/ghl');
const GHLContact = require('../models/GHLContact');
const NewsletterSubscriber = require('../models/NewsletterSubscriber');

const router = express.Router();

const crypto = require('crypto');

const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,             // 60 requests per minute
  message: { error: 'Too many webhook requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

const WebhookContactSchema = z.object({
  id: z.string().min(1).max(200),
  firstName: z.string().max(100).optional().default(''),
  lastName: z.string().max(100).optional().default(''),
  email: z.string().email().max(254).optional().default(''),
  phone: z.string().max(30).optional().default(''),
  companyName: z.string().max(200).optional().default(''),
  tags: z.array(z.string().max(100)).max(50).optional().default([]),
  dateAdded: z.string().optional(),
  lastActivity: z.string().optional(),
});

/**
 * Timing-safe comparison function to prevent timing attacks
 */
function timingSafeEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * POST /api/ghl/webhook
 * Receives real-time events from GrowthSphere360 / GoHighLevel.
 * Configure this URL in GHL Settings > Integrations > Webhooks.
 * No auth required — verified by GHL_WEBHOOK_SECRET header.
 */
router.post('/webhook', webhookRateLimit, async (req, res) => {
  const secret = process.env.GHL_WEBHOOK_SECRET;
  const incoming = req.headers['x-ghl-signature'] || req.headers['x-webhook-secret'];
  
  // Always perform timing-safe comparison to prevent timing attacks
  if (secret) {
    if (!incoming || !timingSafeEqual(incoming, secret)) {
      return res.status(401).json({ error: 'Invalid webhook secret' });
    }
  } else {
    // If no secret is configured, still validate that incoming is empty
    if (incoming) {
      return res.status(401).json({ error: 'Webhook secret not configured but signature provided' });
    }
  }

  const event = req.body;

  // Basic structure validation
  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }

  const type = typeof event.type === 'string' ? event.type
    : typeof event.event === 'string' ? event.event
    : null;

  try {
    if (type === 'ContactCreate' || type === 'ContactUpdate') {
      const raw = event.contact || event.data;
      if (raw && typeof raw === 'object' && raw.id) {
        // Validate and sanitize contact fields before persisting
        const parsed = WebhookContactSchema.safeParse(raw);
        if (!parsed.success) {
          console.warn('GHL webhook: invalid contact payload, skipping', parsed.error.flatten());
          return res.json({ received: true });
        }
        await syncContactToDb(parsed.data);
      }
    }
    res.json({ received: true });
  } catch (e) {
    console.error('GHL webhook error:', e.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * All routes below require admin authentication.
 */
router.use(requireAuth);
router.use(requireRole(['admin']));

/**
 * Escape special regex characters to prevent ReDoS attacks
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate and sanitize query parameters
 */
function validateQueryParams(req) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
  const tag = typeof req.query.tag === 'string' ? req.query.tag.trim().substring(0, 50) : '';
  const q = typeof req.query.q === 'string' ? req.query.q.trim().substring(0, 100) : '';
  
  return { page, limit, tag, q };
}

/**
 * GET /api/ghl/contacts
 * Returns all GHL contacts stored in MongoDB.
 * Query params: tag, q (search by name/email), page, limit
 */
router.get('/contacts', async (req, res, next) => {
  try {
    const { page, limit, tag, q } = validateQueryParams(req);
    const skip = (page - 1) * limit;

    const filter = {};
    if (tag) {
      // Use MongoDB's built-in escaping for exact match
      filter.tags = tag;
    }
    if (q) {
      const searchTerms = q.trim().split(/\s+/).filter(term => term.length > 0);
      if (searchTerms.length > 0) {
        const pattern = new RegExp(searchTerms.map(escapeRegex).join('|'), 'i');
        filter.$or = [
          { firstName: pattern },
          { lastName: pattern },
          { email: pattern },
          { businessName: pattern }
        ];
      }
    }

    const [items, total] = await Promise.all([
      GHLContact.find(filter).sort({ ghlCreatedAt: -1 }).skip(skip).limit(limit).lean(),
      GHLContact.countDocuments(filter)
    ]);

    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/ghl/contacts/tags
 * Returns a list of all unique tags across synced contacts.
 */
router.get('/contacts/tags', async (req, res, next) => {
  try {
    const tags = await GHLContact.distinct('tags');
    res.json({ tags: tags.sort() });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/ghl/sync
 * Pulls ALL contacts from GHL and upserts them into MongoDB.
 * This can take a moment if you have many contacts.
 */
router.post('/sync', async (req, res, next) => {
  try {
    const contacts = await ghl.getAllContacts();

    let created = 0;
    let updated = 0;

    for (const c of contacts) {
      const result = await GHLContact.findOneAndUpdate(
        { ghlId: c.id },
        {
          ghlId: c.id,
          firstName: c.firstName || '',
          lastName: c.lastName || '',
          email: c.email || '',
          phone: c.phone || '',
          businessName: c.companyName || '',
          tags: c.tags || [],
          ghlCreatedAt: c.dateAdded ? new Date(c.dateAdded) : null,
          ghlLastActivity: c.lastActivity ? new Date(c.lastActivity) : null,
          syncedAt: new Date()
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Properly check if this was a new document by checking if createdAt was just set
      const isNewDocument = result.createdAt && result.updatedAt && result.createdAt.getTime() === result.updatedAt.getTime();
      if (isNewDocument) {
        created++;
      } else {
        updated++;
      }
    }

    res.json({ synced: contacts.length, created, updated });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/ghl/push
 * Manually push a contact from the website to GHL.
 * Body: { email, firstName, lastName, phone, businessName, tags }
 */
router.post('/push', async (req, res, next) => {
  try {
    const input = validate(
      z.object({
        email: z.string().email().max(254).optional(),
        firstName: z.string().max(100).optional().default(''),
        lastName: z.string().max(100).optional().default(''),
        phone: z.string().max(30).optional().default(''),
        businessName: z.string().max(200).optional().default(''),
        tags: z.array(z.string().max(50)).optional().default([])
      }),
      req.body
    );

    const { contact, created } = await ghl.upsertContact(input);
    res.json({ contact, created });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/ghl/import-newsletter
 * Imports GHL contacts tagged "requesting general info/newsletter/rss"
 * into the website's NewsletterSubscriber collection.
 */
router.post('/import-newsletter', async (req, res, next) => {
  try {
    const newsletterTag = 'requesting general info/newsletter/rss';
    const contacts = await GHLContact.find({
      tags: newsletterTag,
      email: { $ne: '' },
      newsletterSynced: false
    }).lean();

    let imported = 0;
    let skipped = 0;

    for (const c of contacts) {
      if (!c.email) { skipped++; continue; }

      const exists = await NewsletterSubscriber.findOne({ email: c.email.toLowerCase() });
      if (exists) {
        await GHLContact.updateOne({ _id: c._id }, { newsletterSynced: true });
        skipped++;
        continue;
      }

      await NewsletterSubscriber.create({
        email: c.email.toLowerCase(),
        status: 'active',
        source: 'ghl-import'
      });

      await GHLContact.updateOne({ _id: c._id }, { newsletterSynced: true });
      imported++;
    }

    res.json({ imported, skipped });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/ghl/status
 * Returns integration health: API connectivity + sync stats.
 */
router.get('/status', async (req, res, next) => {
  try {
    const apiKey = process.env.GHL_API_KEY;
    const totalSynced = await GHLContact.countDocuments();
    const lastSynced = await GHLContact.findOne().sort({ syncedAt: -1 }).select('syncedAt').lean();

    let apiConnected = false;
    let apiError = null;
    if (apiKey) {
      try {
        await ghl.getContacts({ limit: 1 });
        apiConnected = true;
      } catch (e) {
        apiError = e.response?.data?.message || e.message;
      }
    }

    res.json({
      apiConnected,
      apiError,
      apiKeyConfigured: Boolean(apiKey),
      webhookSecretConfigured: Boolean(process.env.GHL_WEBHOOK_SECRET),
      totalSynced,
      lastSyncedAt: lastSynced?.syncedAt || null
    });
  } catch (e) {
    next(e);
  }
});

/**
 * Helper: upsert a GHL contact object into MongoDB.
 */
async function syncContactToDb(c) {
  await GHLContact.findOneAndUpdate(
    { ghlId: c.id },
    {
      ghlId: c.id,
      firstName: c.firstName || '',
      lastName: c.lastName || '',
      email: c.email || '',
      phone: c.phone || '',
      businessName: c.companyName || '',
      tags: c.tags || [],
      ghlCreatedAt: c.dateAdded ? new Date(c.dateAdded) : null,
      ghlLastActivity: c.lastActivity ? new Date(c.lastActivity) : null,
      syncedAt: new Date()
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

module.exports = router;
