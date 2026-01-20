const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { validateRegisterInput, validateLoginInput } = require('../utils/validation');

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

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

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
      lastLogin: user.lastLogin,
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userData,
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

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
};