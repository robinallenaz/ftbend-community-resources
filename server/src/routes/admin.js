const express = require('express');
const { z } = require('zod');

const Resource = require('../models/Resource');
const Submission = require('../models/Submission');
const { requireAuth, requireRole } = require('../lib/auth');
const { validate } = require('../lib/validate');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['admin', 'editor']));

router.get('/resources', async (_req, res, next) => {
  try {
    const items = await Resource.find({ status: 'active' }).sort({ name: 1 }).lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.post('/resources', async (req, res, next) => {
  try {
    const input = validate(
      z.object({
        name: z.string().min(2).max(140),
        description: z.string().min(10).max(2000),
        url: z.string().url().max(500),
        locations: z.array(z.string().min(1)).min(1),
        types: z.array(z.string().min(1)).min(1),
        audiences: z.array(z.string().min(1)).min(1),
        tags: z.array(z.string().min(1)).min(1)
      }),
      req.body
    );

    const resource = await Resource.create({
      ...input,
      status: 'active'
    });

    res.status(201).json({ id: resource._id });
  } catch (e) {
    next(e);
  }
});

router.post('/resources/:id/archive', async (req, res, next) => {
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

router.get('/submissions', async (_req, res, next) => {
  try {
    const items = await Submission.find({ status: 'pending' }).sort({ createdAt: -1 }).lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.post('/submissions/:id/approve', async (req, res, next) => {
  try {
    const id = req.params.id;

    const submission = await Submission.findById(id);
    if (!submission) {
      const err = new Error('Submission not found');
      err.status = 404;
      throw err;
    }

    submission.status = 'approved';
    submission.reviewedByUserId = req.auth.sub;
    submission.reviewedAt = new Date();
    await submission.save();

    const resource = await Resource.create({
      name: submission.name,
      description: submission.notes || 'Submitted by community member.',
      url: submission.url,
      locations: ['Fort Bend'],
      types: ['Community'],
      audiences: ['All'],
      tags: ['submitted'],
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
