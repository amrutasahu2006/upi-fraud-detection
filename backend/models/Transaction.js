const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  payee: {
    type: String
  },
  payeeUpiId: {
    type: String
  },
  // New fields for enhanced risk scoring
  recipientVPA: {
    type: String
  },
  recipientName: {
    type: String
  },
  recipientPhone: {
    type: String
  },
  purpose: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'blocked', 'delayed'],
    default: 'pending'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  hour: {
    type: Number,
    min: 0,
    max: 23
  },
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6
  },
  riskScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW'
  },
  riskFactors: {
    type: Object,
    default: {}
  },
  decision: {
    type: String,
    enum: ['APPROVE', 'WARN', 'DELAY', 'BLOCK'],
    default: 'APPROVE'
  },
  decisionMetadata: {
    type: Object,
    default: {}
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedReason: {
    type: String,
    default: ''
  },
  fraudType: {
    type: String,
    enum: ['phishing', 'otp_fraud', 'scam', 'technical', 'other'],
    default: 'other'
  },
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    deviceId: String
  },
  deviceId: {
    type: String
  },
  location: {
    latitude: Number,
    longitude: Number,
    city: String,
    state: String,
    country: String
  }
}, {
  timestamps: true
});

// Indexes for performance
transactionSchema.index({ userId: 1, timestamp: -1 });
transactionSchema.index({ userId: 1, hour: 1 });
transactionSchema.index({ userId: 1, dayOfWeek: 1 });
transactionSchema.index({ timestamp: -1 });

// Pre-save hook to populate hour and dayOfWeek
transactionSchema.pre('save', function(next) {
  if (this.timestamp) {
    const date = new Date(this.timestamp);
    this.hour = date.getHours();
    this.dayOfWeek = date.getDay();
  }
  next();
});

// Static method to get user transaction patterns
transactionSchema.statics.getUserPatterns = async function(userId, daysBack = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  
  const transactions = await this.find({
    userId: userId,
    timestamp: { $gte: cutoffDate },
    status: 'completed'
  }).sort({ timestamp: -1 });
  
  return transactions;
};

// Static method to get typical hours for user
transactionSchema.statics.getTypicalHours = async function(userId, daysBack = 90) {
  const transactions = await this.getUserPatterns(userId, daysBack);
  
  if (transactions.length === 0) return [];
  
  // Count hour frequencies
  const hourCounts = {};
  transactions.forEach(tx => {
    hourCounts[tx.hour] = (hourCounts[tx.hour] || 0) + 1;
  });
  
  // Sort by frequency and get top 80%
  const sortedHours = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a);
  
  const totalTransactions = transactions.length;
  let cumulativeCount = 0;
  const typicalHours = [];
  
  for (const [hour, count] of sortedHours) {
    cumulativeCount += count;
    typicalHours.push(parseInt(hour));
    
    if ((cumulativeCount / totalTransactions) >= 0.8) break;
  }
  
  return typicalHours.sort((a, b) => a - b);
};

module.exports = mongoose.model('Transaction', transactionSchema);