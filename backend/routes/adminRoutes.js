const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { getAllUsers, getUserById, updateUserRole, deleteUser, toggleUserStatus } = require('../controllers/adminController');

// Admin routes - only accessible by admin users
router.use(authenticate, authorizeRoles('admin'));

router.route('/')
  .get(getAllUsers); // Get all users

router.route('/:id')
  .get(getUserById) // Get a specific user
  .put(updateUserRole) // Update user role
  .delete(deleteUser); // Delete user

router.patch('/:id/toggle-status', toggleUserStatus); // Activate/deactivate user

module.exports = router;