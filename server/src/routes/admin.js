const express = require('express');
const { z } = require('zod');

const Resource = require('../models/Resource');
const Event = require('../models/Event');
const Submission = require('../models/Submission');
const { requireAuth, requireRole } = require('../lib/auth');
const { validate } = require('../lib/validate');

const router = express.Router();

const OPTIONS = {
  locations: ['Fort Bend', 'Houston', 'Virtual', 'South TX', 'TX'],
  types: ['Mental Health', 'Legal', 'Self Care', 'Faith', 'Business', 'Community', 'Pride Orgs', 'Arts', 'Youth', 'Family', 'Events'],
  audiences: ['Trans', 'Youth', 'Seniors', 'Families', 'All']
};

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

function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap((x) => String(x).split(',')).map((x) => x.trim()).filter(Boolean);
  return String(value)
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

const ResourceInputSchema = z.object({
  name: z.string().min(2).max(140),
  description: z.string().min(10).max(2000),
  url: UrlSchema,
  locations: z.array(z.string().min(1)).min(1),
  types: z.array(z.string().min(1)).min(1),
  audiences: z.array(z.string().min(1)).min(1),
  tags: z.array(z.string().min(1)).min(1)
});

const ResourcePatchSchema = z
  .object({
    name: z.string().min(2).max(140).optional(),
    description: z.string().min(10).max(2000).optional(),
    url: UrlSchema.optional(),
    locations: z.array(z.string().min(1)).min(1).optional(),
    types: z.array(z.string().min(1)).min(1).optional(),
    audiences: z.array(z.string().min(1)).min(1).optional(),
    tags: z.array(z.string().min(1)).min(1).optional(),
    status: z.enum(['active', 'archived']).optional()
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

const EventInputSchema = z.object({
  name: z.string().min(2).max(140),
  schedule: z.string().min(2).max(200),
  url: UrlSchema,
  locationHint: z.string().min(2).max(200)
});

const EventPatchSchema = z
  .object({
    name: z.string().min(2).max(140).optional(),
    schedule: z.string().min(2).max(200).optional(),
    url: UrlSchema.optional(),
    locationHint: z.string().min(2).max(200).optional(),
    status: z.enum(['active', 'archived']).optional()
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

router.use(requireAuth);
router.use(requireRole(['admin', 'editor']));

router.get('/options', async (_req, res) => {
  res.json({ options: OPTIONS });
});

router.get('/resources', async (req, res, next) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : 'active';
    const statuses = normalizeList(status);

    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const sortKey = typeof req.query.sort === 'string' ? req.query.sort.trim() : '';

    const sort =
      sortKey === 'updated_desc'
        ? { updatedAt: -1 }
        : sortKey === 'updated_asc'
          ? { updatedAt: 1 }
          : sortKey === 'created_desc'
            ? { createdAt: -1 }
            : sortKey === 'name_desc'
              ? { name: -1 }
              : { name: 1 };

    const filter = {};
    if (statuses.length) {
      filter.status = { $in: statuses };
    }

    if (q) {
      filter.$text = { $search: q };
    }

    const items = await Resource.find(filter).sort(sort).lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.get('/resources/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const item = await Resource.findById(id).lean();
    if (!item) {
      const err = new Error('Resource not found');
      err.status = 404;
      throw err;
    }
    res.json({ item });
  } catch (e) {
    next(e);
  }
});

router.post('/resources', async (req, res, next) => {
  try {
    const input = validate(ResourceInputSchema, req.body);

    const resource = await Resource.create({
      ...input,
      status: 'active'
    });

    res.status(201).json({ id: resource._id });
  } catch (e) {
    next(e);
  }
});

router.patch('/resources/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const input = validate(ResourcePatchSchema, req.body);

    if (input.status && req.auth.role !== 'admin') {
      const err = new Error('Forbidden');
      err.status = 403;
      throw err;
    }

    const resource = await Resource.findById(id);
    if (!resource) {
      const err = new Error('Resource not found');
      err.status = 404;
      throw err;
    }

    Object.assign(resource, input);
    await resource.save();

    res.json({ id: resource._id });
  } catch (e) {
    next(e);
  }
});

router.post('/resources/:id/archive', requireRole(['admin']), async (req, res, next) => {
  try {
    const id = req.params.id;

    const resource = await Resource.findById(id);
    if (!resource) {
      const err = new Error('Resource not found');
      err.status = 404;
      throw err;
    }

    resource.status = 'archived';
    await resource.save();

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

router.post('/resources/:id/unarchive', requireRole(['admin']), async (req, res, next) => {
  try {
    const id = req.params.id;

    const resource = await Resource.findById(id);
    if (!resource) {
      const err = new Error('Resource not found');
      err.status = 404;
      throw err;
    }

    resource.status = 'active';
    await resource.save();

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

router.get('/events', async (req, res, next) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : 'active';
    const statuses = normalizeList(status);

    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const sortKey = typeof req.query.sort === 'string' ? req.query.sort.trim() : '';

    const sort =
      sortKey === 'updated_desc'
        ? { updatedAt: -1 }
        : sortKey === 'updated_asc'
          ? { updatedAt: 1 }
          : sortKey === 'created_desc'
            ? { createdAt: -1 }
            : sortKey === 'name_desc'
              ? { name: -1 }
              : { name: 1 };

    const filter = {};
    if (statuses.length) {
      filter.status = { $in: statuses };
    }

    if (q) {
      filter.$text = { $search: q };
    }

    const items = await Event.find(filter).sort(sort).lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.get('/events/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const item = await Event.findById(id).lean();
    if (!item) {
      const err = new Error('Event not found');
      err.status = 404;
      throw err;
    }
    res.json({ item });
  } catch (e) {
    next(e);
  }
});

router.post('/events', async (req, res, next) => {
  try {
    const input = validate(EventInputSchema, req.body);

    const event = await Event.create({
      ...input,
      status: 'active'
    });

    res.status(201).json({ id: event._id });
  } catch (e) {
    next(e);
  }
});

router.patch('/events/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const input = validate(EventPatchSchema, req.body);

    if (input.status && req.auth.role !== 'admin') {
      const err = new Error('Forbidden');
      err.status = 403;
      throw err;
    }

    const event = await Event.findById(id);
    if (!event) {
      const err = new Error('Event not found');
      err.status = 404;
      throw err;
    }

    Object.assign(event, input);
    await event.save();

    res.json({ id: event._id });
  } catch (e) {
    next(e);
  }
});

router.post('/events/:id/archive', requireRole(['admin']), async (req, res, next) => {
  try {
    const id = req.params.id;

    const event = await Event.findById(id);
    if (!event) {
      const err = new Error('Event not found');
      err.status = 404;
      throw err;
    }

    event.status = 'archived';
    await event.save();

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

router.post('/events/:id/unarchive', requireRole(['admin']), async (req, res, next) => {
  try {
    const id = req.params.id;

    const event = await Event.findById(id);
    if (!event) {
      const err = new Error('Event not found');
      err.status = 404;
      throw err;
    }

    event.status = 'active';
    await event.save();

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

router.get('/submissions', async (req, res, next) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : 'pending';
    const statuses = normalizeList(status);

    const filter = {};
    if (statuses.length) {
      filter.status = { $in: statuses };
    }

    const items = await Submission.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.post('/submissions/:id/approve', async (req, res, next) => {
  try {
    const id = req.params.id;

    const overrides = validate(
      z
        .object({
          resource: z
            .object({
              description: z.string().min(10).max(2000).optional(),
              locations: z.array(z.string().min(1)).min(1).optional(),
              types: z.array(z.string().min(1)).min(1).optional(),
              audiences: z.array(z.string().min(1)).min(1).optional(),
              tags: z.array(z.string().min(1)).min(1).optional()
            })
            .optional()
        })
        .optional()
        .default({}),
      req.body
    );

    const submission = await Submission.findById(id);
    if (!submission) {
      const err = new Error('Submission not found');
      err.status = 404;
      throw err;
    }

    if (submission.status !== 'pending') {
      const err = new Error('Submission already reviewed');
      err.status = 409;
      throw err;
    }

    submission.status = 'approved';
    submission.reviewedByUserId = req.auth.sub;
    submission.reviewedAt = new Date();
    await submission.save();

    const resourceOverrides = overrides.resource || {};

    const resource = await Resource.create({
      name: submission.name,
      description: resourceOverrides.description || submission.notes || 'Submitted by community member.',
      url: submission.url,
      locations: resourceOverrides.locations || ['Fort Bend'],
      types: resourceOverrides.types || ['Community'],
      audiences: resourceOverrides.audiences || ['All'],
      tags: resourceOverrides.tags || ['submitted'],
      status: 'active'
    });

    res.json({ resourceId: resource._id });
  } catch (e) {
    next(e);
  }
});

router.post('/submissions/:id/reject', async (req, res, next) => {
  try {
    const id = req.params.id;

    const submission = await Submission.findById(id);
    if (!submission) {
      const err = new Error('Submission not found');
      err.status = 404;
      throw err;
    }

    submission.status = 'rejected';
    submission.reviewedByUserId = req.auth.sub;
    submission.reviewedAt = new Date();
    await submission.save();

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
