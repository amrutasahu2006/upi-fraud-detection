const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profile: {
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    phoneNumber: {
      type: String,
      trim: true
    },
    avatar: {
      type: String
    }
  },
  lastLogin: {
    type: Date
  },
  transactions: [{
    transactionId: {
      type: String,
      required: true,
      unique: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    payee: {
      type: String,
      required: true
    },
    payeeUpiId: {
      type: String,
      required: true
    },
    purpose: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'blocked'],
      default: 'completed'
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
    riskFactors: [{
      type: String,
      enum: ['newPayee', 'highAmount', 'newDevice', 'unusualTime', 'newLocation']
    }],
    isBlocked: {
      type: Boolean,
      default: false
    },
    blockedReason: {
      type: String,
      default: ''
    },
    deviceInfo: {
      userAgent: String,
      ipAddress: String,
      deviceId: String
    }
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const saltRounds = 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Add transaction to user's history
userSchema.methods.addTransaction = function(transactionData) {
  const transaction = {
    transactionId: transactionData.transactionId || `TRX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    amount: transactionData.amount,
    payee: transactionData.payee,
    payeeUpiId: transactionData.payeeUpiId,
    purpose: transactionData.purpose || '',
    status: transactionData.status || 'completed',
    timestamp: transactionData.timestamp ? new Date(transactionData.timestamp) : new Date(),
    riskScore: transactionData.riskScore || 0,
    riskFactors: transactionData.riskFactors || [],
    isBlocked: transactionData.isBlocked || false,
    blockedReason: transactionData.blockedReason || '',
    deviceInfo: transactionData.deviceInfo || {}
  };
  
  // Set hour and dayOfWeek
  const date = new Date(transaction.timestamp);
  transaction.hour = date.getHours();
  transaction.dayOfWeek = date.getDay();
  
  this.transactions.push(transaction);
  
  // Keep only last 200 transactions (adjust as needed)
  if (this.transactions.length > 200) {
    this.transactions = this.transactions.slice(-200);
  }
  
  return transaction;
};

// Get user's typical transaction hours (80% frequency)
userSchema.methods.getTypicalHours = function(daysBack = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  
  const recentTransactions = this.transactions.filter(tx => 
    new Date(tx.timestamp) >= cutoffDate && tx.status === 'completed'
  );
  
  if (recentTransactions.length === 0) return [];
  
  // Count hour frequencies
  const hourCounts = {};
  recentTransactions.forEach(tx => {
    hourCounts[tx.hour] = (hourCounts[tx.hour] || 0) + 1;
  });
  
  // Sort by frequency and get top 80%
  const sortedHours = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a);
  
  const totalTransactions = recentTransactions.length;
  let cumulativeCount = 0;
  const typicalHours = [];
  
  for (const [hour, count] of sortedHours) {
    cumulativeCount += count;
    typicalHours.push(parseInt(hour));
    
    if ((cumulativeCount / totalTransactions) >= 0.8) break;
  }
  
  return typicalHours.sort((a, b) => a - b);
};

// Analyze if a transaction time is unusual for this user
userSchema.methods.isUnusualTransactionTime = function(transactionTime) {
  const typicalHours = this.getTypicalHours();
  
  if (typicalHours.length === 0) {
    return {
      isUnusual: false,
      confidence: 0,
      reason: "Insufficient transaction history",
      typicalHours: [],
      currentHour: transactionTime.getHours(),
      dayOfWeek: transactionTime.getDay(),
      dayOfWeekName: this.getDayName(transactionTime.getDay())
    };
  }
  
  const transactionHour = transactionTime.getHours();
  const dayOfWeek = transactionTime.getDay();
  
  // Get day-specific typical hours
  const dayTransactions = this.transactions.filter(tx => 
    tx.dayOfWeek === dayOfWeek && tx.status === 'completed'
  );
  
  let dayTypicalHours = [];
  if (dayTransactions.length > 0) {
    const hourCounts = {};
    dayTransactions.forEach(tx => {
      hourCounts[tx.hour] = (hourCounts[tx.hour] || 0) + 1;
    });
    
    const sortedHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a);
    
    const total = dayTransactions.length;
    let cumulative = 0;
    
    for (const [hour, count] of sortedHours) {
      cumulative += count;
      dayTypicalHours.push(parseInt(hour));
      if ((cumulative / total) >= 0.8) break;
    }
    dayTypicalHours.sort((a, b) => a - b);
  }
  
  const referenceHours = dayTypicalHours.length > 0 ? dayTypicalHours : typicalHours;
  
  // Check if current hour is within typical range ± 2 hours
  const isWithinTypicalRange = referenceHours.some(typicalHour => 
    Math.abs(transactionHour - typicalHour) <= 2
  );
  
  // Special case: sleeping hours (0-5 AM) when no night history
  const isSleepingHour = transactionHour >= 0 && transactionHour <= 5;
  const hasNightHistory = referenceHours.some(hour => hour >= 0 && hour <= 5);
  
  let isUnusual = !isWithinTypicalRange;
  if (isSleepingHour && !hasNightHistory) {
    isUnusual = true;
  }
  
  return {
    isUnusual,
    confidence: Math.min(this.transactions.length / 20, 1), // Scale confidence with data volume
    reason: isUnusual ? "Transaction outside typical hours" : "Normal transaction time",
    typicalHours: referenceHours,
    currentHour: transactionHour,
    dayOfWeek: dayOfWeek,
    dayOfWeekName: this.getDayName(dayOfWeek)
  };
};

// Calculate time-based risk score
userSchema.methods.calculateTimeRisk = function(transactionTime, amount = 0) {
  const analysis = this.isUnusualTransactionTime(transactionTime);
  
  if (!analysis.isUnusual) return 0;
  
  let riskScore = 0;
  
  // Base risk for unusual timing
  const typicalHours = this.getTypicalHours();
  if (typicalHours.length > 0) {
    const closestTypical = typicalHours.reduce((prev, curr) => 
      Math.abs(curr - analysis.currentHour) < Math.abs(prev - analysis.currentHour) ? curr : prev
    );
    
    const hourDifference = Math.abs(analysis.currentHour - closestTypical);
    
    if (hourDifference <= 2) riskScore += 0;
    else if (hourDifference <= 4) riskScore += 10;
    else if (hourDifference <= 6) riskScore += 15;
    else riskScore += 20;
  }
  
  // Additional risk for high-value transactions at unusual times
  if (amount > 50000 && analysis.isUnusual) {
    riskScore += 15;
  }
  
  // Risk for late night transactions (0-5 AM)
  if (analysis.currentHour >= 0 && analysis.currentHour <= 5) {
    riskScore += 10;
  }
  
  return Math.min(riskScore, 30);
};

// Helper method to get day name
userSchema.methods.getDayName = function(dayIndex) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex];
};

// Index for performance
userSchema.index({ 'transactions.timestamp': -1 });
userSchema.index({ 'transactions.hour': 1 });
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);