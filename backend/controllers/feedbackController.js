const UserFeedback = require('../models/UserFeedback');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Weight adjustment constants
const WEIGHT_ADJUSTMENT_RATE = 0.15; // 15% adjustment per feedback
const MIN_WEIGHT = 5;
const MAX_WEIGHT = 50;
const LEARNING_CONFIDENCE_THRESHOLD = 10; // Minimum feedbacks for high confidence

/**
 * Record user feedback and adjust risk weights
 * POST /api/feedback/confirm-not-fraud
 */
exports.confirmNotFraud = async (req, res) => {
  try {
    const { transactionId, userComment } = req.body;
    const userId = req.user._id;
    
    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }
    
    // Get the transaction
    const transaction = await Transaction.findOne({
      $or: [
        { transactionId },
        { _id: transactionId }
      ],
      userId
    });
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Get user with current weights
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Initialize adaptiveWeights if not exists (for existing users)
    if (!user.adaptiveWeights) {
      user.adaptiveWeights = {
        AMOUNT_ANOMALY: 25,
        TIME_PATTERN: 15,
        NEW_PAYEE: 20,
        DEVICE_FINGERPRINT: 15,
        LOCATION_ANOMALY: 10,
        VELOCITY_CHECK: 10,
        BLACKLIST_HIT: 100,
        WHITELIST_HIT: -100
      };
    }
    
    // Initialize learningStats if not exists
    if (!user.learningStats) {
      user.learningStats = {
        totalFeedbackCount: 0,
        falsePositiveCount: 0,
        falseNegativeCount: 0,
        lastWeightAdjustment: null,
        learningConfidence: 0
      };
    }
    
    // Determine if this was a false positive
    const wasFalsePositive = transaction.decision === 'BLOCK' || transaction.decision === 'DELAY' || transaction.decision === 'WARN';
    
    // Map transaction risk factor keys to adaptive weight keys
    const factorKeyMap = {
      'amountAnomaly': 'AMOUNT_ANOMALY',
      'timePattern': 'TIME_PATTERN',
      'newPayee': 'NEW_PAYEE',
      'deviceFingerprint': 'DEVICE_FINGERPRINT',
      'locationAnomaly': 'LOCATION_ANOMALY',
      'velocityCheck': 'VELOCITY_CHECK',
      'blacklistHit': 'BLACKLIST_HIT',
      'whitelistHit': 'WHITELIST_HIT'
    };
    
    // Extract triggered risk factors from transaction
    const triggeredFactors = Object.entries(transaction.riskFactors || {})
      .filter(([_, score]) => score > 0)
      .map(([factor, score]) => {
        const weightKey = factorKeyMap[factor] || factor.toUpperCase();
        return {
          factor: weightKey,
          score,
          weight: user.adaptiveWeights[weightKey] || 0
        };
      });
    
    // Calculate weight adjustments
    const weightAdjustments = [];
    
    if (wasFalsePositive && triggeredFactors.length > 0) {
      // Reduce weights for factors that caused false positive
      triggeredFactors.forEach(({ factor, weight }) => {
        if (factor === 'BLACKLIST_HIT' || factor === 'WHITELIST_HIT') return; // Don't adjust overrides
        
        const adjustment = weight * WEIGHT_ADJUSTMENT_RATE;
        const newWeight = Math.max(MIN_WEIGHT, weight - adjustment);
        
        weightAdjustments.push({
          factor,
          oldWeight: weight,
          newWeight,
          adjustment: -adjustment
        });
        
        // Update user's adaptive weight
        user.adaptiveWeights[factor] = newWeight;
      });
      
      // Increment false positive count
      user.learningStats.falsePositiveCount += 1;
    }
    
    // Update learning stats
    user.learningStats.totalFeedbackCount += 1;
    user.learningStats.lastWeightAdjustment = new Date();
    user.learningStats.learningConfidence = Math.min(
      user.learningStats.totalFeedbackCount / LEARNING_CONFIDENCE_THRESHOLD,
      1
    );
    
    await user.save();
    
    // Create feedback record
    const feedback = new UserFeedback({
      userId,
      transactionId: transaction.transactionId || transaction._id.toString(),
      originalRiskScore: transaction.riskScore,
      originalRiskLevel: transaction.riskLevel,
      originalDecision: transaction.decision,
      triggeredRiskFactors: triggeredFactors,
      feedbackType: 'NOT_FRAUD',
      userComment,
      wasFalsePositive,
      wasFalseNegative: false,
      weightAdjustments,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    await feedback.save();
    
    // Update transaction status
    transaction.status = 'completed';
    transaction.decision = 'APPROVE';
    transaction.decisionMetadata = {
      ...transaction.decisionMetadata,
      userOverride: true,
      overrideReason: userComment || 'User confirmed not fraud',
      feedbackId: feedback._id
    };
    await transaction.save();
    
    res.json({
      success: true,
      message: 'Feedback recorded and weights adjusted',
      feedback: {
        id: feedback._id,
        wasFalsePositive,
        weightAdjustments,
        learningConfidence: user.learningStats.learningConfidence
      },
      updatedWeights: user.adaptiveWeights
    });
    
  } catch (error) {
    console.error('❌ Error recording feedback:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Failed to record feedback', details: error.message });
  }
};

/**
 * Confirm that a transaction was actually fraud
 * POST /api/feedback/confirm-fraud
 */
exports.confirmFraud = async (req, res) => {
  try {
    const { transactionId, userComment } = req.body;
    const userId = req.user._id;
    
    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }
    
    const transaction = await Transaction.findOne({
      $or: [
        { transactionId },
        { _id: transactionId }
      ],
      userId
    });
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Initialize adaptiveWeights if not exists (for existing users)
    if (!user.adaptiveWeights) {
      user.adaptiveWeights = {
        AMOUNT_ANOMALY: 25,
        TIME_PATTERN: 15,
        NEW_PAYEE: 20,
        DEVICE_FINGERPRINT: 15,
        LOCATION_ANOMALY: 10,
        VELOCITY_CHECK: 10,
        BLACKLIST_HIT: 100,
        WHITELIST_HIT: -100
      };
    }
    
    // Initialize learningStats if not exists
    if (!user.learningStats) {
      user.learningStats = {
        totalFeedbackCount: 0,
        falsePositiveCount: 0,
        falseNegativeCount: 0,
        lastWeightAdjustment: null,
        learningConfidence: 0
      };
    }
    
    // This is a false negative if system approved but was actually fraud
    const wasFalseNegative = transaction.decision === 'APPROVE' || transaction.riskScore < 60;
    
    // Map transaction risk factor keys to adaptive weight keys
    const factorKeyMap = {
      'amountAnomaly': 'AMOUNT_ANOMALY',
      'timePattern': 'TIME_PATTERN',
      'newPayee': 'NEW_PAYEE',
      'deviceFingerprint': 'DEVICE_FINGERPRINT',
      'locationAnomaly': 'LOCATION_ANOMALY',
      'velocityCheck': 'VELOCITY_CHECK',
      'blacklistHit': 'BLACKLIST_HIT',
      'whitelistHit': 'WHITELIST_HIT'
    };
    
    const triggeredFactors = Object.entries(transaction.riskFactors || {})
      .filter(([_, score]) => score > 0)
      .map(([factor, score]) => {
        const weightKey = factorKeyMap[factor] || factor.toUpperCase();
        return {
          factor: weightKey,
          score,
          weight: user.adaptiveWeights[weightKey] || 0
        };
      });
    
    const weightAdjustments = [];
    
    if (wasFalseNegative) {
      // System failed to detect fraud - increase all weights
      Object.keys(user.adaptiveWeights).forEach(factor => {
        if (factor === 'BLACKLIST_HIT' || factor === 'WHITELIST_HIT') return;
        
        const currentWeight = user.adaptiveWeights[factor];
        const adjustment = currentWeight * WEIGHT_ADJUSTMENT_RATE;
        const newWeight = Math.min(MAX_WEIGHT, currentWeight + adjustment);
        
        weightAdjustments.push({
          factor,
          oldWeight: currentWeight,
          newWeight,
          adjustment
        });
        
        user.adaptiveWeights[factor] = newWeight;
      });
      
      user.learningStats.falseNegativeCount += 1;
    }
    
    user.learningStats.totalFeedbackCount += 1;
    user.learningStats.lastWeightAdjustment = new Date();
    user.learningStats.learningConfidence = Math.min(
      user.learningStats.totalFeedbackCount / LEARNING_CONFIDENCE_THRESHOLD,
      1
    );
    
    await user.save();
    
    const feedback = new UserFeedback({
      userId,
      transactionId: transaction.transactionId || transaction._id.toString(),
      originalRiskScore: transaction.riskScore,
      originalRiskLevel: transaction.riskLevel,
      originalDecision: transaction.decision,
      triggeredRiskFactors: triggeredFactors,
      feedbackType: 'CONFIRM_FRAUD',
      userComment,
      wasFalsePositive: false,
      wasFalseNegative,
      weightAdjustments,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    await feedback.save();
    
    // Mark transaction as confirmed fraud
    transaction.fraudConfirmed = true;
    transaction.fraudConfirmedAt = new Date();
    transaction.decisionMetadata = {
      ...transaction.decisionMetadata,
      fraudConfirmed: true,
      confirmationComment: userComment,
      feedbackId: feedback._id
    };
    await transaction.save();
    
    res.json({
      success: true,
      message: 'Fraud confirmed and weights adjusted',
      feedback: {
        id: feedback._id,
        wasFalseNegative,
        weightAdjustments,
        learningConfidence: user.learningStats.learningConfidence
      },
      updatedWeights: user.adaptiveWeights
    });
    
  } catch (error) {
    console.error('Error confirming fraud:', error);
    res.status(500).json({ error: 'Failed to confirm fraud' });
  }
};

/**
 * Get user's learning statistics
 * GET /api/feedback/stats
 */
exports.getLearningStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId).select('adaptiveWeights learningStats privacySettings');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Initialize adaptiveWeights if not exists
    if (!user.adaptiveWeights) {
      user.adaptiveWeights = {
        AMOUNT_ANOMALY: 25,
        TIME_PATTERN: 15,
        NEW_PAYEE: 20,
        DEVICE_FINGERPRINT: 15,
        LOCATION_ANOMALY: 10,
        VELOCITY_CHECK: 10,
        BLACKLIST_HIT: 100,
        WHITELIST_HIT: -100
      };
    }
    
    // Initialize learningStats if not exists
    if (!user.learningStats) {
      user.learningStats = {
        totalFeedbackCount: 0,
        falsePositiveCount: 0,
        falseNegativeCount: 0,
        lastWeightAdjustment: null,
        learningConfidence: 0
      };
    }
    
    // Get recent feedback history
    const recentFeedback = await UserFeedback.getUserFeedbackHistory(userId, 30);
    
    // Get false positive rate
    const falsePositiveRate = await UserFeedback.getFalsePositiveRate(userId);
    
    // Get problematic factors
    const problematicFactors = await UserFeedback.getProblematicFactors(userId);
    
    res.json({
      adaptiveWeights: user.adaptiveWeights,
      learningStats: user.learningStats,
      recentFeedbackCount: recentFeedback.length,
      falsePositiveRate: Math.round(falsePositiveRate * 100) / 100,
      problematicFactors,
      isLearningActive: user.privacySettings?.behaviorLearning !== false
    });
    
  } catch (error) {
    console.error('Error getting learning stats:', error);
    res.status(500).json({ error: 'Failed to get learning stats' });
  }
};

/**
 * Reset user weights to defaults
 * POST /api/feedback/reset-weights
 */
exports.resetWeights = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Reset to defaults
    user.adaptiveWeights = {
      AMOUNT_ANOMALY: 25,
      TIME_PATTERN: 15,
      NEW_PAYEE: 20,
      DEVICE_FINGERPRINT: 15,
      LOCATION_ANOMALY: 10,
      VELOCITY_CHECK: 10,
      BLACKLIST_HIT: 100,
      WHITELIST_HIT: -100
    };
    
    user.learningStats = {
      totalFeedbackCount: 0,
      falsePositiveCount: 0,
      falseNegativeCount: 0,
      lastWeightAdjustment: null,
      learningConfidence: 0
    };
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Weights reset to defaults',
      defaultWeights: user.adaptiveWeights
    });
    
  } catch (error) {
    console.error('Error resetting weights:', error);
    res.status(500).json({ error: 'Failed to reset weights' });
  }
};

/**
 * Get user's feedback history
 * GET /api/feedback/history
 */
exports.getFeedbackHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { days = 30, limit = 50 } = req.query;
    
    const feedback = await UserFeedback.find({ userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .select('-ipAddress -userAgent');
    
    res.json({
      feedback,
      count: feedback.length
    });
    
  } catch (error) {
    console.error('Error getting feedback history:', error);
    res.status(500).json({ error: 'Failed to get feedback history' });
  }
};
