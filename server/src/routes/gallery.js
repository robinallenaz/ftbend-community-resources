const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireRole } = require('../lib/auth');
const GalleryImage = require('../models/GalleryImage');

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/gallery');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/i;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

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

// Serve uploaded images publicly
router.get('/:filename', (req, res, next) => {
  const filePath = path.join(uploadDir, req.params.filename);
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      const notFound = new Error('Image not found');
      notFound.status = 404;
      return next(notFound);
    }
    res.sendFile(filePath);
  });
});

module.exports = router;
