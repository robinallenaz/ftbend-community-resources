const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Taxonomy = require('../models/Taxonomy');
const Resource = require('../models/Resource');
const { requireAuth, requireRole } = require('../lib/auth');
const { validate } = require('../lib/validate');

// HTML sanitization for XSS protection - matches client-side sanitizeText function
function sanitizeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;');
}

// Get active taxonomy items by type (public)
router.get('/active/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['location', 'resourceType', 'audience'].includes(type)) {
      return res.status(400).json({ error: 'Invalid taxonomy type' });
    }

    const items = await Taxonomy.getActiveByType(type);
    res.json(items);
  } catch (error) {
    console.error('Error fetching taxonomy items:', error);
    res.status(500).json({ error: 'Failed to fetch taxonomy items' });
  }
});

// Get all taxonomy items by type (admin/editor only)
router.get('/all/:type', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['location', 'resourceType', 'audience'].includes(type)) {
      return res.status(400).json({ error: 'Invalid taxonomy type' });
    }

    const items = await Taxonomy.getAllByType(type);
    res.json(items);
  } catch (error) {
    console.error('Error fetching taxonomy items:', error);
    res.status(500).json({ error: 'Failed to fetch taxonomy items' });
  }
});

// Create new taxonomy item (admin/editor only)
router.post('/', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const { type, value, label, description, sortOrder = 0 } = req.body;
    
    if (!['location', 'resourceType', 'audience'].includes(type)) {
      return res.status(400).json({ error: 'Invalid taxonomy type' });
    }

    if (!value || !label) {
      return res.status(400).json({ error: 'Value and label are required' });
    }

    // Validate input lengths
    if (value.length > 50) {
      return res.status(400).json({ error: 'Value must be 50 characters or less' });
    }
    
    if (label.length > 100) {
      return res.status(400).json({ error: 'Label must be 100 characters or less' });
    }
    
    if (description && description.length > 500) {
      return res.status(400).json({ error: 'Description must be 500 characters or less' });
    }

    // Validate value format (alphanumeric, spaces, hyphens only - no leading/trailing spaces)
    const valueRegex = /^[a-zA-Z0-9]+(?:[\s\-][a-zA-Z0-9]+)*$/;
    if (!valueRegex.test(value)) {
      return res.status(400).json({ error: 'Value can only contain letters, numbers, spaces, and hyphens, and cannot start/end with spaces or hyphens' });
    }

    // Validate sortOrder
    if (typeof sortOrder !== 'number' || !Number.isInteger(sortOrder) || sortOrder < 0) {
      return res.status(400).json({ error: 'sortOrder must be a non-negative integer' });
    }

    const taxonomyItem = new Taxonomy({
      type,
      value: value.trim(),
      label: sanitizeHtml(label.trim()),
      description: sanitizeHtml(description?.trim() || ''),
      sortOrder,
      createdBy: req.auth.sub, // Fix: use 'sub' instead of 'id'
    });

    await taxonomyItem.save();
    res.status(201).json(taxonomyItem);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'This value already exists for this type' });
    }
    console.error('Error creating taxonomy item:', error);
    res.status(500).json({ error: 'Failed to create taxonomy item' });
  }
});

// Update taxonomy item (admin/editor only)
router.put('/:id', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    // Validate MongoDB ObjectID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid taxonomy item ID' });
    }

    const { label, description, isActive, sortOrder } = req.body;
    
    const updateData = {};
    if (label !== undefined) {
      if (typeof label !== 'string' || label.trim().length === 0) {
        return res.status(400).json({ error: 'Label must be a non-empty string' });
      }
      if (label.length > 100) {
        return res.status(400).json({ error: 'Label must be 100 characters or less' });
      }
      updateData.label = sanitizeHtml(label.trim());
    }
    if (description !== undefined) {
      if (typeof description !== 'string') {
        return res.status(400).json({ error: 'Description must be a string' });
      }
      if (description.length > 500) {
        return res.status(400).json({ error: 'Description must be 500 characters or less' });
      }
      updateData.description = sanitizeHtml(description.trim());
    }
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: 'isActive must be a boolean' });
      }
      updateData.isActive = isActive;
    }
    if (sortOrder !== undefined) {
      if (typeof sortOrder !== 'number' || !Number.isInteger(sortOrder) || sortOrder < 0) {
        return res.status(400).json({ error: 'sortOrder must be a non-negative integer' });
      }
      updateData.sortOrder = sortOrder;
    }

    const taxonomyItem = await Taxonomy.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!taxonomyItem) {
      return res.status(404).json({ error: 'Taxonomy item not found' });
    }

    res.json(taxonomyItem);
  } catch (error) {
    console.error('Error updating taxonomy item:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    res.status(500).json({ error: 'Failed to update taxonomy item' });
  }
});

// Delete taxonomy item (admin/editor only)
router.delete('/:id', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    // Validate MongoDB ObjectID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid taxonomy item ID' });
    }

    await session.withTransaction(async () => {
      const taxonomyItem = await Taxonomy.findById(req.params.id).session(session);
      
      if (!taxonomyItem) {
        throw new Error('Taxonomy item not found');
      }

      // Check if this item is being used by any resources
      const resourceCount = await Resource.countDocuments({
        [taxonomyItem.type === 'location' ? 'locations' : 
         taxonomyItem.type === 'resourceType' ? 'types' : 'audiences']: taxonomyItem.value
      }).session(session);

      if (resourceCount > 0) {
        throw new Error(`Cannot delete taxonomy item that is used by ${resourceCount} resource(s). Please remove the item from all resources first.`);
      }

      await Taxonomy.findByIdAndDelete(req.params.id).session(session);
    });

    res.json({ message: 'Taxonomy item deleted successfully' });
  } catch (error) {
    console.error('Error deleting taxonomy item:', error);
    
    if (error.message === 'Taxonomy item not found') {
      return res.status(404).json({ error: 'Taxonomy item not found' });
    }
    
    if (error.message.includes('Cannot delete taxonomy item')) {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    res.status(500).json({ error: 'Failed to delete taxonomy item' });
  } finally {
    try {
      await session.endSession();
    } catch (sessionError) {
      console.error('Error ending MongoDB session:', sessionError);
    }
  }
});

module.exports = router;
