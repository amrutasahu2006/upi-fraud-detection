const mongoose = require('mongoose');

const userFeedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  transactionId: {
    type: String,
    required: true,
    index: true
  },
  // Original risk assessment
  originalRiskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  originalRiskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true
  },
  originalDecision: {
    type: String,
    enum: ['APPROVE', 'WARN', 'DELAY', 'BLOCK'],
    required: true
  },
  // Risk factors that triggered
  triggeredRiskFactors: [{
    factor: {
      type: String,
      enum: ['AMOUNT_ANOMALY', 'TIME_PATTERN', 'NEW_PAYEE', 'DEVICE_FINGERPRINT', 'LOCATION_ANOMALY', 'VELOCITY_CHECK', 'BLACKLIST_HIT', 'WHITELIST_HIT']
    },
    score: Number,
    weight: Number
  }],
  // User feedback
  feedbackType: {
    type: String,
    enum: ['NOT_FRAUD', 'CONFIRM_FRAUD', 'FALSE_POSITIVE', 'FALSE_NEGATIVE'],
    required: true
  },
  userComment: {
    type: String,
    maxlength: 500
  },
  // Was this a false positive/negative?
  wasFalsePositive: {
    type: Boolean,
    default: false
  },
  wasFalseNegative: {
    type: Boolean,
    default: false
  },
  // Weight adjustments applied
  weightAdjustments: [{
    factor: String,
    oldWeight: Number,
    newWeight: Number,
    adjustment: Number
  }],
  // Metadata
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for analytics
userFeedbackSchema.index({ userId: 1, timestamp: -1 });
userFeedbackSchema.index({ feedbackType: 1, timestamp: -1 });
userFeedbackSchema.index({ wasFalsePositive: 1 });

// Static method to get user's feedback history
userFeedbackSchema.statics.getUserFeedbackHistory = async function(userId, daysBack = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  
  return await this.find({
    userId,
    timestamp: { $gte: cutoffDate }
  }).sort({ timestamp: -1 });
};

// Static method to get false positive rate
userFeedbackSchema.statics.getFalsePositiveRate = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        falsePositives: {
          $sum: { $cond: [{ $eq: ['$wasFalsePositive', true] }, 1, 0] }
        }
      }
    }
  ]);
  
  if (stats.length === 0) return 0;
  return (stats[0].falsePositives / stats[0].total) * 100;
};

// Static method to get most problematic risk factors
userFeedbackSchema.statics.getProblematicFactors = async function(userId) {
  return await this.aggregate([
    { 
      $match: { 
        userId: new mongoose.Types.ObjectId(userId),
        wasFalsePositive: true 
      } 
    },
    { $unwind: '$triggeredRiskFactors' },
    {
      $group: {
        _id: '$triggeredRiskFactors.factor',
        count: { $sum: 1 },
        avgScore: { $avg: '$triggeredRiskFactors.score' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

module.exports = mongoose.model('UserFeedback', userFeedbackSchema);
