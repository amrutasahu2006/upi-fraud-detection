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

// @route   GET /api/auth/devices
// @desc    Get all connected devices for the user
// @access  Private
router.get('/devices', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('devices');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get current device ID from request headers or generate
    const currentDeviceId = req.headers['x-device-id'] || req.user.deviceId;

    // Mark current device
    const devicesWithCurrent = user.devices.map(device => ({
      ...device.toObject(),
      isCurrent: device.deviceId === currentDeviceId
    }));

    res.json({
      success: true,
      data: {
        devices: devicesWithCurrent
      }
    });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching devices'
    });
  }
});

// @route   DELETE /api/auth/devices/:deviceId
// @desc    Remove a specific device
// @access  Private
router.delete('/devices/:deviceId', authenticate, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get current device ID
    const currentDeviceId = req.headers['x-device-id'] || req.user.deviceId;

    if (deviceId === currentDeviceId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove current device'
      });
    }

    // Remove device from array
    user.devices = user.devices.filter(d => d.deviceId !== deviceId);
    await user.save();

    console.log('🗑️ Device removed:', deviceId, 'for user:', user.email);

    res.json({
      success: true,
      message: 'Device removed successfully'
    });
  } catch (error) {
    console.error('Remove device error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing device'
    });
  }
});

// @route   POST /api/auth/logout-all-devices
// @desc    Logout user from all devices (invalidate all sessions)
// @access  Private
router.post('/logout-all-devices', authenticate, async (req, res) => {
  try {
    // In a production app, you would:
    // 1. Invalidate all JWT tokens for this user (if using token blacklist)
    // 2. Clear all sessions from Redis/database
    // 3. Update user's tokenVersion or add logout timestamp
    
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Option: Add a lastLogoutAll timestamp to force re-authentication
    user.lastLogoutAll = new Date();
    // Clear all devices
    user.devices = [];
    await user.save();

    console.log('🚪 User logged out from all devices:', user.email);

    res.json({
      success: true,
      message: 'Successfully logged out from all devices'
    });
  } catch (error) {
    console.error('Logout all devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while logging out'
    });
  }
});

module.exports = router;