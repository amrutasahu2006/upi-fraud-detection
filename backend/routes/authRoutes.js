const express = require('express');
const router = express.Router();
const { getPrivacySettings, updatePrivacySettings } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
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

module.exports = router;