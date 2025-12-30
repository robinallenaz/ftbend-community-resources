const bcrypt = require('bcryptjs');
const express = require('express');
const { z } = require('zod');

const User = require('../models/User');
const { requireAuth, signToken } = require('../lib/auth');
const { validate } = require('../lib/validate');

const router = express.Router();

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub).lean();
    if (!user) {
      const err = new Error('Not authenticated');
      err.status = 401;
      throw err;
    }

    res.json({
      user: {
        id: String(user._id),
        email: user.email,
        role: user.role
      }
    });
  } catch (e) {
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const input = validate(
      z.object({
        email: z.string().email().max(200),
        password: z.string().min(8).max(200)
      }),
      req.body
    );

    const user = await User.findOne({ email: input.email.toLowerCase() });
    if (!user) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    const token = signToken({ sub: String(user._id), role: user.role, email: user.email });

    const isProd = process.env.NODE_ENV === 'production';

    res
      .cookie('token', token, {
        httpOnly: true,
        sameSite: isProd ? 'none' : 'lax',
        secure: isProd,
        maxAge: 14 * 24 * 60 * 60 * 1000
      })
      .json({
        token,
        user: {
          id: String(user._id),
          email: user.email,
          role: user.role
        }
      });
  } catch (e) {
    next(e);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token').status(204).send();
});

module.exports = router;
