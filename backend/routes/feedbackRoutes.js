const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Record "Not Fraud" feedback and adjust weights
router.post('/confirm-not-fraud', feedbackController.confirmNotFraud);

// Confirm transaction was actually fraud
router.post('/confirm-fraud', feedbackController.confirmFraud);

// Get user's learning statistics
router.get('/stats', feedbackController.getLearningStats);

// Get feedback history
router.get('/history', feedbackController.getFeedbackHistory);

// Reset weights to defaults
router.post('/reset-weights', feedbackController.resetWeights);

module.exports = router;
