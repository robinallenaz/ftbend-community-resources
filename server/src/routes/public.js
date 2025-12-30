const express = require('express');
const { z } = require('zod');

const Resource = require('../models/Resource');
const Event = require('../models/Event');
const Submission = require('../models/Submission');
const { validate } = require('../lib/validate');

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

    res.status(201).json({
      id: submission._id,
      status: submission.status
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
