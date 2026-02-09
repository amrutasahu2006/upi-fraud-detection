const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { getAllUsers, getUserById, updateUserRole, deleteUser, toggleUserStatus, getFraudHotspots, getFraudStats, getRecentFraudActivity, getDashboardSummary } = require('../controllers/adminController');

// Admin routes - only accessible by admin users
router.use(authenticate, authorizeRoles('admin'));

// Fraud analytics endpoints (must be defined before parameterized routes)
router.get('/fraud-hotspots', getFraudHotspots);
router.get('/fraud-stats', getFraudStats);
router.get('/recent-fraud-activity', getRecentFraudActivity);

router.route('/users')
  .get(getAllUsers); // Get all users

router.route('/users/:id')
  .get(getUserById) // Get a specific user
  .put(updateUserRole) // Update user role
  .delete(deleteUser); // Delete user

router.patch('/users/:id/toggle-status', toggleUserStatus); // Activate/deactivate user

router.get('/dashboard-summary', getDashboardSummary); // Get dashboard summary data

module.exports = router;
