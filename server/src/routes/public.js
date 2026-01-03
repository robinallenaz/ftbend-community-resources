const express = require('express');
const { z } = require('zod');

const Resource = require('../models/Resource');
const Event = require('../models/Event');
const Submission = require('../models/Submission');
const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const GalleryImage = require('../models/GalleryImage');
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

    const filter = { status: 'active' };
    if (locations.length) filter.locations = { $in: locations };
    if (types.length) filter.types = { $in: types };
    if (audiences.length) filter.audiences = { $in: audiences };

    if (q) {
      filter.$text = { $search: q };

      const items = await Resource.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' }, name: 1 })
        .limit(200)
        .lean();

      return res.json({ items });
    }

    const items = await Resource.find(filter).sort({ name: 1 }).limit(200).lean();
    return res.json({ items });
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

module.exports = router;
