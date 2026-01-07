const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { requireRole } = require('../lib/auth');
const GalleryImage = require('../models/GalleryImage');

const router = express.Router();

// Configure Cloudinary
cloudinary.config(process.env.CLOUDINARY_URL || {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Debug: Log configuration (remove in production)
console.log('Cloudinary config:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING',
  cloudinary_url: process.env.CLOUDINARY_URL ? 'SET' : 'MISSING'
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ftbend-community-gallery',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    public_id: (req, file) => `gallery-${Date.now()}-${file.originalname}`
  }
});

const upload = multer({ storage });

// Upload endpoint (admin only)
router.post('/upload', requireRole(['admin']), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('No file uploaded');
      err.status = 400;
      throw err;
    }

    const maxOrder = await GalleryImage.findOne({ status: 'active' }).sort({ order: -1 }).lean();
    const newOrder = (maxOrder?.order ?? 0) + 1;

    const item = await GalleryImage.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      caption: req.body.caption || '',
      order: newOrder,
      uploadedBy: req.auth.sub
    });

    res.status(201).json(item);
  } catch (e) {
    next(e);
  }
});

// Note: Images are served directly from Cloudinary URLs
// No local file serving needed

module.exports = router;
