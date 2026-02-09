const mongoose = require('mongoose');

const blacklistVPASchema = new mongoose.Schema({
  vpa: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(v);
      },
      message: props => `${props.value} is not a valid VPA format!`
    }
  },
  risk_level: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true,
    default: 'medium'
  },
  reason: {
    type: String,
    enum: ['fraud', 'phishing', 'fake_loan', 'impersonation', 'scam', 'suspicious_activity'],
    required: true
  },
  reported_at: {
    type: Date,
    default: Date.now
  },
  report_count: {
    type: Number,
    default: 1
  },
  confidence_score: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  reporters: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reported_date: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  status: {
    type: String,
    enum: ['active', 'resolved', 'under_review'],
    default: 'active'
  },
  last_updated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for fast VPA lookups
blacklistVPASchema.index({ vpa: 1 });
blacklistVPASchema.index({ risk_level: 1 });
blacklistVPASchema.index({ status: 1 });

// Update last_updated timestamp on save
blacklistVPASchema.pre('save', function(next) {
  this.last_updated = Date.now();
  next();
});

module.exports = mongoose.model('BlacklistVPA', blacklistVPASchema);
