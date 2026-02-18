const express = require('express');
const router = express.Router();
const { getPrivacySettings, updatePrivacySettings } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

router.get('/privacy-settings', authenticate, getPrivacySettings);
router.put('/privacy-settings', authenticate, updatePrivacySettings);

// @route   GET /api/auth/daily-limit
// @desc    Get user's daily transaction limit
// @access  Private
router.get('/daily-limit', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('dailyTransactionLimit');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        dailyTransactionLimit: user.dailyTransactionLimit
      }
    });
  } catch (error) {
    console.error('Get daily limit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching daily limit'
    });
  }
});

// @route   POST /api/auth/daily-limit
// @desc    Set or unset user's daily transaction limit
// @access  Private
router.post('/daily-limit', authenticate, async (req, res) => {
  try {
    const { dailyTransactionLimit } = req.body;

    // Allow null to unset limit, but if setting a limit, must be >= 1000
    if (dailyTransactionLimit !== null && dailyTransactionLimit !== undefined && dailyTransactionLimit < 1000) {
      return res.status(400).json({
        success: false,
        message: 'Daily limit must be at least ₹1000 or null to remove'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.dailyTransactionLimit = dailyTransactionLimit || null;
    await user.save();

    console.log('💾 Daily transaction limit updated for user:', user._id.toString(), '- Limit:', user.dailyTransactionLimit || 'Removed');

    res.json({
      success: true,
      message: dailyTransactionLimit ? 'Daily transaction limit set successfully' : 'Daily transaction limit removed successfully',
      data: {
        dailyTransactionLimit: user.dailyTransactionLimit
      }
    });
  } catch (error) {
    console.error('Update daily limit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating daily limit'
    });
  }
});

module.exports = router;