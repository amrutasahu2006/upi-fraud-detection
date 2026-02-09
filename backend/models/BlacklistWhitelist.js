// backend/models/BlacklistWhitelist.js
const mongoose = require('mongoose');

const blacklistWhitelistSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['blacklist', 'whitelist'],
    required: true
  },
  vpa: {
    type: String,
    sparse: true, // Allow null but must be unique if present
    trim: true
  },
  phoneNumber: {
    type: String,
    sparse: true,
    trim: true
  },
  accountNumber: {
    type: String,
    sparse: true,
    trim: true
  },
  reason: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reportedByName: String,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: null // null = permanent
  },
  metadata: {
    numberOfReports: { type: Number, default: 1 },
    lastIncidentDate: Date,
    totalFraudAmount: { type: Number, default: 0 },
    affectedUsers: { type: Number, default: 0 },
    notes: String,
    global: { type: Boolean, default: false }, // For global trusted VPAs (banks, merchants)
    identifier: String // Store normalized identifier for quick lookup
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient lookups
blacklistWhitelistSchema.index({ type: 1, vpa: 1 });
blacklistWhitelistSchema.index({ type: 1, phoneNumber: 1 });
blacklistWhitelistSchema.index({ type: 1, isActive: 1 });

// Pre-save middleware
blacklistWhitelistSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance methods
blacklistWhitelistSchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Static methods
blacklistWhitelistSchema.statics.findByVPA = function(vpa, type = null) {
  const query = { vpa, isActive: true };
  if (type) query.type = type;
  return this.findOne(query);
};

blacklistWhitelistSchema.statics.findByPhone = function(phoneNumber, type = null) {
  const query = { phoneNumber, isActive: true };
  if (type) query.type = type;
  return this.findOne(query);
};

blacklistWhitelistSchema.statics.getActiveList = function(type) {
  return this.find({ 
    type, 
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  }).sort({ createdAt: -1 });
};

// New method: Check if VPA is whitelisted (global trusted VPAs)
blacklistWhitelistSchema.statics.isWhitelisted = async function(identifier) {
  const normalizedIdentifier = identifier.toLowerCase().trim();
  
  const whitelisted = await this.findOne({
    type: 'whitelist',
    $or: [
      { vpa: normalizedIdentifier },
      { phoneNumber: normalizedIdentifier },
      { accountNumber: normalizedIdentifier }
    ],
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });

  return !!whitelisted;
};

// New method: Get global trusted VPAs (banks, large merchants)
blacklistWhitelistSchema.statics.getGlobalWhitelist = function() {
  return this.find({
    type: 'whitelist',
    isActive: true,
    'metadata.global': true, // Only global whitelisted entries
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  }).select('vpa phoneNumber accountNumber reason');
};

module.exports = mongoose.model('BlacklistWhitelist', blacklistWhitelistSchema);
