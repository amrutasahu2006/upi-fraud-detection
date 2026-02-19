// backend/routes/blacklistRoutes.js
const express = require('express');
const router = express.Router();
const BlacklistWhitelist = require('../models/BlacklistWhitelist');
const { protect, adminOnly } = require('../middleware/auth');
const blacklistController = require('../controllers/blacklistController');

// ===== VPA BLACKLIST API (NPCI-like) =====

// Check if VPA is blacklisted (with Redis cache)
router.get('/check', blacklistController.checkVPA);

// Report suspicious VPA (community reporting)
router.post('/report', protect, blacklistController.reportVPA);

// Get all blacklisted VPAs (admin only)
router.get('/all', protect, adminOnly, blacklistController.getAllBlacklisted);

// Update blacklist status (admin only)
router.put('/:id/status', protect, adminOnly, blacklistController.updateBlacklistStatus);

// Remove from blacklist (admin only)
router.delete('/:id', protect, adminOnly, blacklistController.removeFromBlacklist);

// Batch add to blacklist - NPCI feed simulation (admin only)
router.post('/batch', protect, adminOnly, blacklistController.batchAddBlacklist);

// ===== LEGACY BLACKLIST ROUTES =====

// Get all blacklist entries
router.get('/blacklist', protect, adminOnly, async (req, res) => {
  try {
    const blacklist = await BlacklistWhitelist.getActiveList('blacklist');
    
    res.json({
      success: true,
      count: blacklist.length,
      data: blacklist
    });
  } catch (error) {
    console.error('Error fetching blacklist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blacklist'
    });
  }
});

// Add to blacklist
router.post('/blacklist', protect, adminOnly, async (req, res) => {
  try {
    const { vpa, phoneNumber, accountNumber, reason, severity, metadata } = req.body;
    const normalizedVPA = vpa ? vpa.toLowerCase().trim() : undefined;
    const normalizedPhone = phoneNumber ? String(phoneNumber).trim() : undefined;
    const normalizedAccount = accountNumber ? String(accountNumber).trim() : undefined;
    const identifierFilters = [];

    if (normalizedVPA) identifierFilters.push({ vpa: normalizedVPA });
    if (normalizedPhone) identifierFilters.push({ phoneNumber: normalizedPhone });
    if (normalizedAccount) identifierFilters.push({ accountNumber: normalizedAccount });

    // Validate: at least one identifier required
    if (identifierFilters.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one identifier (VPA, phone, or account) is required'
      });
    }

    // Check if already blacklisted
    const existing = await BlacklistWhitelist.findOne({
      type: 'blacklist',
      $or: identifierFilters,
      isActive: true
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Already on blacklist',
        data: existing
      });
    }

    const blacklistEntry = new BlacklistWhitelist({
      type: 'blacklist',
      vpa: normalizedVPA,
      phoneNumber: normalizedPhone,
      accountNumber: normalizedAccount,
      reason,
      severity: severity || 'high',
      reportedBy: req.user._id,
      reportedByName: req.user.name,
      metadata: metadata || {}
    });

    await blacklistEntry.save();

    res.status(201).json({
      success: true,
      message: 'Added to blacklist successfully',
      data: blacklistEntry
    });
  } catch (error) {
    console.error('Error adding to blacklist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to blacklist'
    });
  }
});

// Remove from blacklist
router.delete('/blacklist/:id', protect, adminOnly, async (req, res) => {
  try {
    const entry = await BlacklistWhitelist.findById(req.params.id);

    if (!entry || entry.type !== 'blacklist') {
      return res.status(404).json({
        success: false,
        message: 'Blacklist entry not found'
      });
    }

    entry.isActive = false;
    await entry.save();

    res.json({
      success: true,
      message: 'Removed from blacklist'
    });
  } catch (error) {
    console.error('Error removing from blacklist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from blacklist'
    });
  }
});

// ===== WHITELIST ROUTES =====

// Get all whitelist entries for current user
router.get('/whitelist', protect, async (req, res) => {
  try {
    let query;

    if (req.user.role === 'admin') {
      // Admin panel should see all whitelist entries, including seeded global entries
      query = {
        type: 'whitelist',
        isActive: true
      };
    } else {
      // Regular users see their own entries + global seeded trusted entries
      query = {
        type: 'whitelist',
        isActive: true,
        $or: [
          { reportedBy: req.user._id },
          { 'metadata.global': true }
        ]
      };
    }

    const whitelist = await BlacklistWhitelist.find(query)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: whitelist.length,
      data: whitelist
    });
  } catch (error) {
    console.error('Error fetching whitelist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch whitelist'
    });
  }
});

// Add to whitelist (trusted payees)
router.post('/whitelist', protect, async (req, res) => {
  try {
    const { vpa, phoneNumber, reason, override } = req.body;
    const normalizedVPA = vpa ? vpa.toLowerCase().trim() : undefined;
    const normalizedPhone = phoneNumber ? String(phoneNumber).trim() : undefined;
    const identifierFilters = [];

    if (normalizedVPA) identifierFilters.push({ vpa: normalizedVPA });
    if (normalizedPhone) identifierFilters.push({ phoneNumber: normalizedPhone });

    if (identifierFilters.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'VPA or phone number is required'
      });
    }

    // Check if already whitelisted by this user
    const existing = await BlacklistWhitelist.findOne({
      type: 'whitelist',
      reportedBy: req.user._id,
      $or: identifierFilters,
      isActive: true
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Already on your whitelist',
        data: existing
      });
    }

    // Check if on blacklist (global)
    const blacklisted = await BlacklistWhitelist.findOne({
      type: 'blacklist',
      $or: identifierFilters,
      isActive: true
    });

    // Only admins can override blacklist
    if (blacklisted && !override) {
      return res.status(400).json({
        success: false,
        message: 'Cannot whitelist: recipient is globally blacklisted',
        blacklistReason: blacklisted.reason,
        isBlacklisted: true,
        canOverride: req.user.role === 'admin'
      });
    }

    // Admin override check
    if (blacklisted && override) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can override blacklist'
        });
      }
      console.log(`⚠️ ADMIN OVERRIDE: ${req.user.name} is whitelisting blacklisted VPA: ${vpa || phoneNumber}`);
    }

    const whitelistEntry = new BlacklistWhitelist({
      type: 'whitelist',
      vpa: normalizedVPA,
      phoneNumber: normalizedPhone,
      reason: reason || 'Trusted payee',
      severity: 'low',
      reportedBy: req.user._id,
      reportedByName: req.user.name,
      metadata: {
        overrideBlacklist: override && blacklisted ? true : false,
        notes: override && blacklisted ? `Admin override - Original blacklist reason: ${blacklisted.reason}` : null
      }
    });

    await whitelistEntry.save();

    res.status(201).json({
      success: true,
      message: 'Added to whitelist successfully',
      data: whitelistEntry,
      wasOverride: override && blacklisted ? true : false
    });
  } catch (error) {
    console.error('Error adding to whitelist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to whitelist'
    });
  }
});

// Remove from whitelist
router.delete('/whitelist/:id', protect, async (req, res) => {
  try {
    const entry = await BlacklistWhitelist.findById(req.params.id);

    if (!entry || entry.type !== 'whitelist') {
      return res.status(404).json({
        success: false,
        message: 'Whitelist entry not found'
      });
    }

    // Users can only remove their own whitelist entries
    if (entry.reportedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    entry.isActive = false;
    await entry.save();

    res.json({
      success: true,
      message: 'Removed from whitelist'
    });
  } catch (error) {
    console.error('Error removing from whitelist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from whitelist'
    });
  }
});

// ===== CHECK ROUTES (Used by frontend before transaction) =====

// Check if VPA is blacklisted or whitelisted
router.post('/check', protect, async (req, res) => {
  try {
    const { vpa, phoneNumber } = req.body;

    const blacklisted = await BlacklistWhitelist.findOne({
      type: 'blacklist',
      $or: [{ vpa }, { phoneNumber }],
      isActive: true
    });

    const whitelisted = await BlacklistWhitelist.findOne({
      type: 'whitelist',
      reportedBy: req.user._id,
      $or: [{ vpa }, { phoneNumber }],
      isActive: true
    });

    res.json({
      success: true,
      data: {
        isBlacklisted: !!blacklisted,
        isWhitelisted: !!whitelisted,
        blacklistInfo: blacklisted ? {
          reason: blacklisted.reason,
          severity: blacklisted.severity,
          addedAt: blacklisted.createdAt
        } : null,
        whitelistInfo: whitelisted ? {
          reason: whitelisted.reason,
          addedAt: whitelisted.createdAt
        } : null
      }
    });
  } catch (error) {
    console.error('Error checking lists:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check lists'
    });
  }
});

module.exports = router;
