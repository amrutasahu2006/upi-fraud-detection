const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  blockVPA,
  unblockVPA,
  getMyBlockedVPAs,
  checkUserBlock,
  getVPAStats
} = require('../controllers/blockVPAController');

// Block a VPA (user level)
router.post('/', protect, blockVPA);

// Unblock a VPA
router.delete('/:vpa', protect, unblockVPA);

// Get user's blocked VPAs
router.get('/my-blocks', protect, getMyBlockedVPAs);

// Check if VPA is blocked by current user
router.get('/check/:vpa', protect, checkUserBlock);

// Get VPA block stats (admin only)
router.get('/stats/:vpa', protect, adminOnly, getVPAStats);

module.exports = router;
