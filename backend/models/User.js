
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { reverseGeocode } = require('../utils/geocoding');

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
    avatar: {
      type: String
    }
  },
  lastLogin: {
    type: Date
  },
  knownDevices: {
    type: [String],
    default: []
  },
  transactions: [{
    transactionId: {
      type: String,
      // required: true, // Removed to prevent empty object creation
      // unique: true // Removed in favor of sparse index
    },
    amount: {
      type: Number,
      // required: true,
      min: 0
    },
    payee: {
      type: String,
      // required: true
    },
    payeeUpiId: {
      type: String,
      // required: true
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
      enum: ['newPayee', 'highAmount', 'newDevice', 'unusualTime', 'newLocation', 'locationUnavailable', 'amountAnomaly', 'rarePayee']
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
    },
    location: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      city: String,
      state: String,
      country: String,
      timestamp: Date
    }
  }],
  // Taniya
  trustedCircle: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],

  circleFraudReports: [{
    payeeUpiId: { type: String },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    payeeName: String,
    timestamp: { type: Date, default: Date.now }
  }],

  phoneNumber: { type: String },
  fcmToken: { type: String },
  privacySettings: {
    anonymousSharing: {
      type: Boolean,
      default: true
    },
    aiDetection: {
      type: Boolean,
      default: true
    },
    behaviorLearning: {
      type: Boolean,
      default: false
    }
  },
  //Taniya
  
  // Adaptive learning weights for fraud detection
  adaptiveWeights: {
    AMOUNT_ANOMALY: { type: Number, default: 25, min: 5, max: 50 },
    TIME_PATTERN: { type: Number, default: 15, min: 5, max: 40 },
    NEW_PAYEE: { type: Number, default: 20, min: 5, max: 45 },
    DEVICE_FINGERPRINT: { type: Number, default: 15, min: 5, max: 40 },
    LOCATION_ANOMALY: { type: Number, default: 10, min: 5, max: 35 },
    VELOCITY_CHECK: { type: Number, default: 10, min: 5, max: 35 },
    BLACKLIST_HIT: { type: Number, default: 100 },
    WHITELIST_HIT: { type: Number, default: -100 }
  },
  
  // Learning statistics
  learningStats: {
    totalFeedbackCount: { type: Number, default: 0 },
    falsePositiveCount: { type: Number, default: 0 },
    falseNegativeCount: { type: Number, default: 0 },
    lastWeightAdjustment: { type: Date },
    learningConfidence: { type: Number, default: 0, min: 0, max: 1 }
  }
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
    deviceInfo: transactionData.deviceInfo || {},
    location: transactionData.location || null
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

// Analyze amount patterns for anomaly detection
userSchema.methods.analyzeAmountPatterns = function() {
  const AmountAnomalyDetector = require('../services/AmountAnomalyDetector');
  const detector = new AmountAnomalyDetector();
  return detector.analyzeAmountPatterns(this.transactions.filter(tx => tx.status === 'completed'));
};

// Detect amount anomalies
userSchema.methods.detectAmountAnomaly = function(amount) {
  const AmountAnomalyDetector = require('../services/AmountAnomalyDetector');
  const detector = new AmountAnomalyDetector();
  return detector.detectAnomaly(amount, this.transactions.filter(tx => tx.status === 'completed'));
};

// Build recipient profiles
userSchema.methods.buildRecipientProfiles = function() {
  const RecipientProfiler = require('../services/RecipientProfiler');
  const profiler = new RecipientProfiler();
  return profiler.buildRecipientProfiles(this.transactions.filter(tx => tx.status === 'completed'));
};

// Analyze recipient for transaction
userSchema.methods.analyzeRecipient = function(payeeUpiId, payeeName) {
  const RecipientProfiler = require('../services/RecipientProfiler');
  const profiler = new RecipientProfiler();
  const profiles = profiler.buildRecipientProfiles(this.transactions.filter(tx => tx.status === 'completed'));
  return profiler.analyzeRecipient(payeeUpiId, payeeName, profiles);
};

// Analyze location for transaction
userSchema.methods.analyzeLocation = async function(locationData) {
  // If no location data provided, treat as unavailable
  if (!locationData || !locationData.latitude || !locationData.longitude) {
    return {
      isNewLocation: false,
      isLocationUnavailable: true,
      riskScore: 20,
      reason: "Location data unavailable - GPS access denied or location services disabled.",
      confidence: 1,
      currentLocation: null,
      typicalLocations: []
    };
  }

  const currentLat = parseFloat(locationData.latitude);
  const currentLng = parseFloat(locationData.longitude);

  console.log(`🔍 Analyzing location: lat=${currentLat}, lng=${currentLng}`);

  // --- Real-time Reverse Geocoding ---
  let city = "Unknown City";
  let state = "Unknown State";
  let country = "Unknown Country";

  try {
    const geocodingResult = await reverseGeocode(currentLat, currentLng);
    city = geocodingResult.city;
    state = geocodingResult.state;
    country = geocodingResult.country;
    console.log(`✅ Real-time geocoding: ${city}, ${state}, ${country}`);
  } catch (error) {
    console.error('❌ Geocoding failed, using fallback:', error.message);
    // Enhanced fallback for India coordinates - matches geocoding.js fallback logic
    if (currentLat >= 6.0 && currentLat <= 35.5 && currentLng >= 68.0 && currentLng <= 97.5) {
      // Mumbai region (19.0717, 72.9172)
      if (currentLat >= 18.9 && currentLat <= 19.3 && currentLng >= 72.7 && currentLng <= 73.3) {
        city = "Mumbai";
        state = "Maharashtra";
        country = "India";
      }
      // Delhi region
      else if (currentLat >= 28.4 && currentLat <= 28.9 && currentLng >= 76.8 && currentLng <= 77.4) {
        city = "Delhi";
        state = "Delhi";
        country = "India";
      }
      // Bangalore region
      else if (currentLat >= 12.8 && currentLat <= 13.2 && currentLng >= 77.4 && currentLng <= 77.8) {
        city = "Bangalore";
        state = "Karnataka";
        country = "India";
      }
      // Chennai region
      else if (currentLat >= 12.9 && currentLat <= 13.2 && currentLng >= 80.1 && currentLng <= 80.4) {
        city = "Chennai";
        state = "Tamil Nadu";
        country = "India";
      }
      // Kolkata region
      else if (currentLat >= 22.5 && currentLat <= 22.7 && currentLng >= 88.2 && currentLng <= 88.4) {
        city = "Kolkata";
        state = "West Bengal";
        country = "India";
      }
      // Hyderabad region
      else if (currentLat >= 17.3 && currentLat <= 17.5 && currentLng >= 78.3 && currentLng <= 78.6) {
        city = "Hyderabad";
        state = "Telangana";
        country = "India";
      }
      // Pune region
      else if (currentLat >= 18.4 && currentLat <= 18.7 && currentLng >= 73.7 && currentLng <= 74.0) {
        city = "Pune";
        state = "Maharashtra";
        country = "India";
      }
      // Other India locations - default to Maharashtra as fallback
      else {
        city = "Unknown City";
        state = "Maharashtra";
        country = "India";
      }
    }
  }

  // Get transactions with location data from last 90 days
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  const recentTransactions = this.transactions.filter(tx =>
    new Date(tx.timestamp) >= cutoffDate &&
    tx.status === 'completed' &&
    tx.location &&
    tx.location.latitude &&
    tx.location.longitude
  );

  // If no location history, any location is considered new
  if (recentTransactions.length === 0) {
    return {
      isNewLocation: true,
      isLocationUnavailable: false,
      riskScore: 15,
      reason: `First transaction with location data from ${city}, ${state}.`,
      confidence: 0.5,
      currentLocation: { latitude: currentLat, longitude: currentLng, city, state, accuracy: locationData.accuracy },
      typicalLocations: []
    };
  }

  // Calculate distance to each historical location
  const locationDistances = recentTransactions.map(tx => {
    const distance = this.calculateDistance(
      currentLat, currentLng,
      tx.location.latitude, tx.location.longitude
    );
    return { distance, location: tx.location, timestamp: tx.timestamp };
  });

  locationDistances.sort((a, b) => a.distance - b.distance);

  const isWithinTypicalArea = locationDistances.some(loc => loc.distance <= 50);
  const isNewLocation = !isWithinTypicalArea;
  
  // Build list of typical locations
  const locationCounts = {};
  recentTransactions.forEach(tx => {
    const key = `${tx.location.city || 'Unknown'}-${tx.location.state || 'Unknown'}`;
    locationCounts[key] = (locationCounts[key] || 0) + 1;
  });

  const typicalLocations = Object.entries(locationCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([key, count]) => ({
      location: key,
      frequency: count,
      percentage: Math.round((count / recentTransactions.length) * 100)
    }));

  return {
    isNewLocation,
    isLocationUnavailable: false,
    riskScore: isNewLocation ? 15 : 0,
    reason: isNewLocation ?
      `Location ${city}, ${state} is outside typical transaction areas.` :
      `Location within typical transaction area.`,
    confidence: Math.min(recentTransactions.length / 10, 1),
    currentLocation: { latitude: currentLat, longitude: currentLng, city, state, accuracy: locationData.accuracy },
    typicalLocations,
    nearestDistance: locationDistances[0]?.distance || null
  };
};

// Helper method to calculate distance between two coordinates (Haversine formula)
userSchema.methods.calculateDistance = function(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

userSchema.methods.calculateComprehensiveRisk = async function(transactionData) {
  let totalRiskScore = 0;
  const riskFactors = [];

  // Time-based risk (existing)
  const timeAnalysis = this.isUnusualTransactionTime(new Date(transactionData.timestamp || new Date()));
  if (timeAnalysis.isUnusual) {
    totalRiskScore += this.calculateTimeRisk(new Date(transactionData.timestamp || new Date()), transactionData.amount);
    riskFactors.push('unusualTime');
  }

  // Check Circle Reports
  const circleAlert = this.circleFraudReports.find(
    report => report.payeeUpiId === transactionData.payeeUpiId
  );

  if (circleAlert) {
    totalRiskScore += 60; // Huge risk boost because a friend reported it
    riskFactors.push('circleReportedFraud');
  }

  // Amount-based risk (new)
  const amountAnalysis = this.detectAmountAnomaly(transactionData.amount);
  if (amountAnalysis.isAnomalous) {
    totalRiskScore += amountAnalysis.riskScore;
    riskFactors.push('amountAnomaly');
  }

  // Recipient-based risk (new)
  const recipientAnalysis = this.analyzeRecipient(transactionData.payeeUpiId, transactionData.payee);
  if (recipientAnalysis.isNewPayee) {
    totalRiskScore += 25;
    riskFactors.push('newPayee');
  } else if (recipientAnalysis.isRarePayee) {
    totalRiskScore += 15;
    riskFactors.push('rarePayee');
  }

  // Location-based risk (new)
  const locationAnalysis = await this.analyzeLocation(transactionData.location);
  if (locationAnalysis.isNewLocation) {
    totalRiskScore += locationAnalysis.riskScore;
    riskFactors.push('newLocation');
  }
  if (locationAnalysis.isLocationUnavailable) {
    totalRiskScore += locationAnalysis.riskScore;
    riskFactors.push('locationUnavailable');
  }

  // High amount risk (existing logic)
  if (transactionData.amount > 10000) {
    totalRiskScore += 30;
    riskFactors.push('highAmount');
  }

  // Other factors (existing)
  if (transactionData.isNewDevice) {
    totalRiskScore += 25;
    riskFactors.push('newDevice');
  }

  const finalRiskScore = Math.min(totalRiskScore, 100);

  return {
    totalRiskScore: finalRiskScore,
    riskFactors: [...new Set(riskFactors)], // Remove duplicates
    shouldBlock: finalRiskScore >= 80,
    shouldWarn: finalRiskScore >= 40 && finalRiskScore < 80,
    analysis: {
      timeAnalysis,
      amountAnalysis,
      recipientAnalysis,
      locationAnalysis
    }
  };
};

// Index for performance
userSchema.index({ 'transactions.timestamp': -1 });
userSchema.index({ 'transactions.hour': 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'transactions.transactionId': 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', userSchema);
