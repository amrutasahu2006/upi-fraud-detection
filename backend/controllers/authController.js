const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { validateRegisterInput, validateLoginInput } = require('../utils/validation');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const crypto = require('crypto');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password, phoneNumber, confirmPassword, role = 'user' } = req.body;

    // Validate input
    const { isValid, errors } = validateRegisterInput({
      username,
      email,
      phoneNumber,
      password,
      confirmPassword,
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists',
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      phoneNumber,
      password,
      role, // Default role is 'user', admin can be assigned by other means
      trustedCircle: [],       // ✅ Explicitly initialize
      circleFraudReports: []
    });

    // Generate token
    const token = generateToken({ id: user._id, role: user.role });

    // Return user and token (excluding password)
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
      createdAt: user.createdAt,
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userData,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const { isValid, errors } = validateLoginInput({ email, password });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    // Find user by email
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled === true) {
      // Don't complete login - send temp response requiring 2FA
      return res.status(200).json({
        success: true,
        requires2FA: true,
        userId: user._id,
        message: '2FA verification required'
      });
    }

    // Track device information (only if 2FA passed or not enabled)
    const deviceId = req.headers['x-device-id'] || `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    
    // Parse user agent for device info
    const getDeviceInfo = (ua) => {
      const mobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua);
      const tablet = /iPad|Android(?!.*Mobile)/i.test(ua);
      const ios = /iPhone|iPad|iPod/i.test(ua);
      const android = /Android/i.test(ua);
      const windows = /Windows/i.test(ua);
      const mac = /Macintosh|Mac OS X/i.test(ua);
      const linux = /Linux/i.test(ua);
      
      let type = 'other';
      if (tablet) type = 'tablet';
      else if (mobile) type = 'smartphone';
      else type = 'laptop';
      
      let os = 'Unknown';
      if (ios) os = 'iOS ' + (ua.match(/OS (\d+)_/)?.[1] || '');
      else if (android) os = 'Android ' + (ua.match(/Android (\d+)/)?.[1] || '');
      else if (windows) os = 'Windows ' + (ua.match(/Windows NT (\d+\.\d+)/)?.[1] || '');
      else if (mac) os = 'Mac OS';
      else if (linux) os = 'Linux';
      
      let browser = 'Unknown';
      if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
      else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
      else if (/Firefox/i.test(ua)) browser = 'Firefox';
      else if (/Edg/i.test(ua)) browser = 'Edge';
      
      let name = type.charAt(0).toUpperCase() + type.slice(1);
      if (ios) name = 'iPhone';
      else if (android && mobile) name = 'Android Phone';
      else if (android && tablet) name = 'Android Tablet';
      else if (windows) name = 'Windows PC';
      else if (mac) name = 'Mac';
      
      return { type, os, browser, name };
    };
    
    const deviceInfo = getDeviceInfo(userAgent);
    
    // Check if device already exists, update or add new
    const existingDeviceIndex = user.devices.findIndex(d => d.deviceId === deviceId);
    if (existingDeviceIndex >= 0) {
      // Update existing device
      user.devices[existingDeviceIndex].lastActive = new Date();
      user.devices[existingDeviceIndex].ipAddress = ipAddress;
    } else {
      // Add new device (keep max 10 devices)
      if (user.devices.length >= 10) {
        // Remove oldest device
        user.devices.sort((a, b) => new Date(a.lastActive) - new Date(b.lastActive));
        user.devices.shift();
      }
      
      user.devices.push({
        deviceId,
        name: deviceInfo.name,
        type: deviceInfo.type,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        userAgent,
        ipAddress,
        location: {
          country: 'India' // Can be enhanced with IP geolocation
        },
        lastActive: new Date(),
        loginDate: new Date()
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token with deviceId
    const token = generateToken({ id: user._id, role: user.role, deviceId });

    // Return user and token (excluding password)
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
      lastLogin: user.lastLogin,
      deviceId, // Include deviceId for frontend storage
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userData,
      deviceId, // Return deviceId
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber } = req.body;

    const updatedFields = {};
    
    if (firstName !== undefined) updatedFields['profile.firstName'] = firstName;
    if (lastName !== undefined) updatedFields['profile.lastName'] = lastName;
    if (phoneNumber !== undefined) updatedFields.phoneNumber = phoneNumber;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updatedFields },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password, new password, and confirm new password are required',
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get user privacy settings
// @route   GET /api/auth/privacy-settings
// @access  Private
const getPrivacySettings = async (req, res) => {
  try {
    // Assuming req.user.id comes from your auth middleware
    const user = await User.findById(req.user.id).select('privacySettings');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    
    // Default fallback if settings are missing
    const settings = user.privacySettings || {
       anonymousSharing: true,
       aiDetection: true,
       behaviorLearning: false
    };

    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Update user privacy settings
// @route   PUT /api/auth/privacy-settings
// @access  Private
const updatePrivacySettings = async (req, res) => {
  const { anonymousSharing, aiDetection, behaviorLearning } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Update fields
    user.privacySettings = {
      anonymousSharing,
      aiDetection,
      behaviorLearning
    };

    await user.save();
    res.json(user.privacySettings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
  getPrivacySettings,
  updatePrivacySettings
};

// @desc    Setup 2FA - Generate secret and QR code
// @route   POST /api/auth/setup-2fa
// @access  Private
const setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+twoFactorSecret +backupCodes');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `UPI Fraud Detection (${user.email})`,
      length: 32
    });

    // Generate backup codes (10 codes)
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Store secret and backup codes (hashed)
    user.twoFactorSecret = secret.base32;
    user.backupCodes = backupCodes.map(code => 
      crypto.createHash('sha256').update(code).digest('hex')
    );
    await user.save();

    // Generate QR code as data URL
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        backupCodes: backupCodes, // Send plain codes only once
        manualEntry: secret.base32
      }
    });
  } catch (error) {
    console.error('Setup 2FA error:', error);
    res.status(500).json({ success: false, message: 'Server error during 2FA setup' });
  }
};

// @desc    Verify 2FA code and enable 2FA
// @route   POST /api/auth/verify-2fa
// @access  Private
const verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token || token.length !== 6) {
      return res.status(400).json({ success: false, message: 'Invalid token format' });
    }

    const user = await User.findById(req.user.id).select('+twoFactorSecret');
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ success: false, message: '2FA not set up' });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time step window for clock skew
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    await user.save();

    res.json({
      success: true,
      message: '2FA enabled successfully',
      data: { twoFactorEnabled: true }
    });
  } catch (error) {
    console.error('Verify 2FA error:', error);
    res.status(500).json({ success: false, message: 'Server error during 2FA verification' });
  }
};

// @desc    Verify 2FA code during login
// @route   POST /api/auth/verify-2fa-login
// @access  Public (requires temp token)
const verify2FALogin = async (req, res) => {
  try {
    const { userId, token, useBackupCode } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const user = await User.findById(userId).select('+twoFactorSecret +backupCodes +password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let verified = false;

    if (useBackupCode) {
      // Verify backup code
      const hashedCode = crypto.createHash('sha256').update(token).digest('hex');
      const codeIndex = user.backupCodes.indexOf(hashedCode);
      
      if (codeIndex !== -1) {
        verified = true;
        // Remove used backup code
        user.backupCodes.splice(codeIndex, 1);
        await user.save();
      }
    } else {
      // Verify TOTP token
      verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 2
      });
    }

    if (!verified) {
      return res.status(400).json({ 
        success: false, 
        message: useBackupCode ? 'Invalid backup code' : 'Invalid verification code' 
      });
    }

    // Update last login and generate proper token
    user.lastLogin = new Date();
    await user.save();

    const deviceId = req.headers['x-device-id'];
    const authToken = generateToken({ 
      id: user._id, 
      role: user.role,
      deviceId: deviceId || '' 
    });

    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled
    };

    res.json({
      success: true,
      token: authToken,
      user: userData,
      deviceId: deviceId
    });
  } catch (error) {
    console.error('2FA Login verification error:', error);
    res.status(500).json({ success: false, message: 'Server error during 2FA login verification' });
  }
};

// @desc    Disable 2FA
// @route   POST /api/auth/disable-2fa
// @access  Private
const disable2FA = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password required' });
    }

    const user = await User.findById(req.user.id).select('+password +twoFactorSecret +backupCodes');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect password' });
    }

    // Disable 2FA and clear secrets
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.backupCodes = [];
    await user.save();

    res.json({
      success: true,
      message: '2FA disabled successfully',
      data: { twoFactorEnabled: false }
    });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({ success: false, message: 'Server error during 2FA disable' });
  }
};

// @desc    Get 2FA status
// @route   GET /api/auth/2fa-status
// @access  Private
const get2FAStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('twoFactorEnabled');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        twoFactorEnabled: user.twoFactorEnabled || false
      }
    });
  } catch (error) {
    console.error('Get 2FA status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update user language preference
// @route   POST /api/auth/language-preference
// @access  Private
const updateLanguagePreference = async (req, res) => {
  try {
    const { language } = req.body;

    if (!language || !['en', 'hi'].includes(language)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid language. Supported: en, hi'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { languagePreference: language },
      { new: true }
    ).select('languagePreference');

    res.json({
      success: true,
      data: {
        languagePreference: user.languagePreference
      }
    });
  } catch (error) {
    console.error('Update language preference error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user language preference
// @route   GET /api/auth/language-preference
// @access  Private
const getLanguagePreference = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('languagePreference');

    res.json({
      success: true,
      data: {
        languagePreference: user.languagePreference || 'en'
      }
    });
  } catch (error) {
    console.error('Get language preference error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
  getPrivacySettings,
  updatePrivacySettings,
  setup2FA,
  verify2FA,
  verify2FALogin,
  disable2FA,
  get2FAStatus,
  updateLanguagePreference,
  getLanguagePreference
};