// backend/services/RiskScoringEngine.js
const Transaction = require('../models/Transaction');
const User = require('../models/User');

/**
 * Comprehensive Risk Scoring Engine
 * Calculates risk score (0-100) based on multiple factors
 */
class RiskScoringEngine {
  constructor() {
    // Risk factor weights (total should be 100)
    this.weights = {
      AMOUNT_ANOMALY: 25,
      TIME_PATTERN: 15,
      NEW_PAYEE: 20,
      DEVICE_FINGERPRINT: 15,
      LOCATION_ANOMALY: 10,
      VELOCITY_CHECK: 10,
      BLACKLIST_HIT: 100, // Override score
      WHITELIST_HIT: -100 // Override score (makes score 0)
    };

    // Configurable thresholds
    this.thresholds = {
      HIGH_AMOUNT: 10000,
      VERY_HIGH_AMOUNT: 50000,
      NIGHT_HOURS_START: 22, // 10 PM
      NIGHT_HOURS_END: 6, // 6 AM
      VELOCITY_COUNT: 3, // 3 transactions
      VELOCITY_MINUTES: 30, // in 30 minutes
      SUSPICIOUS_VELOCITY_AMOUNT: 50000 // Total amount in velocity window
    };
  }

  /**
   * Main risk scoring method
   * @param {Object} transactionData - Transaction details
   * @param {Object} userHistory - User's transaction history
   * @param {Array} blacklist - Blacklisted VPAs/accounts
   * @param {Array} whitelist - Whitelisted VPAs/accounts
   * @returns {Object} Risk score and breakdown
   */
  async calculateRiskScore(transactionData, userHistory, blacklist = [], whitelist = []) {
    const riskFactors = {};
    let totalScore = 0;
    const detailedReasons = [];

    // Extract transaction details
    const {
      amount,
      recipientVPA,
      recipientName,
      deviceId,
      location,
      timestamp = new Date(),
      userId
    } = transactionData;

    console.log('🔍 Starting Risk Scoring for:', { amount, recipientVPA, userId });

    // ===== CRITICAL: Blacklist/Whitelist Override =====
    if (this._isWhitelisted(recipientVPA, whitelist)) {
      console.log('✅ WHITELIST HIT - Auto-approved');
      return {
        totalScore: 0,
        riskLevel: 'LOW',
        decision: 'APPROVE',
        riskFactors: { whitelistHit: true },
        detailedReasons: ['✅ Recipient is whitelisted - trusted payee'],
        breakdown: { whitelist: 'APPROVED' }
      };
    }

    if (this._isBlacklisted(recipientVPA, blacklist)) {
      console.log('🚫 BLACKLIST HIT - Auto-blocked');
      return {
        totalScore: 100,
        riskLevel: 'CRITICAL',
        decision: 'BLOCK',
        riskFactors: { blacklistHit: true },
        detailedReasons: ['🚫 Recipient is blacklisted - known fraudulent account'],
        breakdown: { blacklist: 'BLOCKED' }
      };
    }

    // ===== Factor 1: Amount Anomaly Analysis =====
    const amountRisk = await this._analyzeAmountRisk(amount, userHistory);
    if (amountRisk.score > 0) {
      const weightedScore = (amountRisk.score / 100) * this.weights.AMOUNT_ANOMALY;
      riskFactors.amountAnomaly = weightedScore;
      totalScore += weightedScore;
      detailedReasons.push(amountRisk.reason);
      console.log(`💰 Amount Risk: ${amountRisk.score}% → Weighted: ${weightedScore}`);
    }

    // ===== Factor 2: Time Pattern Analysis =====
    const timeRisk = await this._analyzeTimeRisk(timestamp, userHistory, userId);
    if (timeRisk.score > 0) {
      const weightedScore = (timeRisk.score / 100) * this.weights.TIME_PATTERN;
      riskFactors.timePattern = weightedScore;
      totalScore += weightedScore;
      detailedReasons.push(timeRisk.reason);
      console.log(`⏰ Time Risk: ${timeRisk.score}% → Weighted: ${weightedScore}`);
    }

    // ===== Factor 3: New Payee Analysis =====
    const payeeRisk = await this._analyzePayeeRisk(recipientVPA, userId, userHistory);
    if (payeeRisk.score > 0) {
      const weightedScore = (payeeRisk.score / 100) * this.weights.NEW_PAYEE;
      riskFactors.newPayee = weightedScore;
      totalScore += weightedScore;
      detailedReasons.push(payeeRisk.reason);
      console.log(`👤 Payee Risk: ${payeeRisk.score}% → Weighted: ${weightedScore}`);
    }

    // ===== Factor 4: Device Fingerprint Analysis =====
    const deviceRisk = await this._analyzeDeviceRisk(deviceId, userId, userHistory);
    if (deviceRisk.score > 0) {
      const weightedScore = (deviceRisk.score / 100) * this.weights.DEVICE_FINGERPRINT;
      riskFactors.deviceFingerprint = weightedScore;
      totalScore += weightedScore;
      detailedReasons.push(deviceRisk.reason);
      console.log(`📱 Device Risk: ${deviceRisk.score}% → Weighted: ${weightedScore}`);
    }

    // ===== Factor 5: Location Anomaly Analysis =====
    const locationRisk = this._analyzeLocationRisk(location, userHistory);
    if (locationRisk.score > 0) {
      const weightedScore = (locationRisk.score / 100) * this.weights.LOCATION_ANOMALY;
      riskFactors.locationAnomaly = weightedScore;
      totalScore += weightedScore;
      detailedReasons.push(locationRisk.reason);
      console.log(`📍 Location Risk: ${locationRisk.score}% → Weighted: ${weightedScore}`);
    }

    // ===== Factor 6: Velocity Check (Rapid Transactions) =====
    const velocityRisk = await this._analyzeVelocityRisk(userId, amount, timestamp);
    if (velocityRisk.score > 0) {
      const weightedScore = (velocityRisk.score / 100) * this.weights.VELOCITY_CHECK;
      riskFactors.velocityCheck = weightedScore;
      totalScore += weightedScore;
      detailedReasons.push(velocityRisk.reason);
      console.log(`🚀 Velocity Risk: ${velocityRisk.score}% → Weighted: ${weightedScore}`);
    }

    // Cap total score at 100
    totalScore = Math.min(Math.round(totalScore), 100);

    // Determine risk level
    const riskLevel = this._getRiskLevel(totalScore);
    const decision = this._getDecision(totalScore);

    console.log(`📊 FINAL RISK SCORE: ${totalScore}/100 (${riskLevel}) → ${decision}`);

    // Get detailed timing analysis for response
    const user = await User.findById(userId);
    let timingAnalysis = null;
    if (user) {
      const transactionTime = new Date(timestamp);
      timingAnalysis = user.isUnusualTransactionTime(transactionTime);
      timingAnalysis.currentHour = transactionTime.getHours();
      timingAnalysis.dayOfWeekName = transactionTime.toLocaleDateString('en-US', { weekday: 'long' });

      // If no typical hours established, provide default business hours
      if (timingAnalysis.typicalHours.length === 0) {
        timingAnalysis.typicalHours = [9, 10, 11, 14, 15, 16, 17, 18, 19]; // Default business hours
        timingAnalysis.reason = "Using default business hours (insufficient transaction history)";
        timingAnalysis.confidence = 0.1; // Low confidence for default hours
      }
    }

    return {
      totalScore,
      riskLevel,
      decision,
      amount,
      riskFactors,
      detailedReasons,
      breakdown: {
        amountAnomaly: riskFactors.amountAnomaly || 0,
        timePattern: riskFactors.timePattern || 0,
        newPayee: riskFactors.newPayee || 0,
        deviceFingerprint: riskFactors.deviceFingerprint || 0,
        locationAnomaly: riskFactors.locationAnomaly || 0,
        velocityCheck: riskFactors.velocityCheck || 0
      },
      analysis: {
        timeAnalysis: timingAnalysis || {
          isUnusual: false,
          confidence: 0,
          reason: "No transaction history available",
          typicalHours: [],
          currentHour: new Date(timestamp).getHours(),
          dayOfWeekName: new Date(timestamp).toLocaleDateString('en-US', { weekday: 'long' })
        },
        amountAnalysis: {
          isAnomalous: amountRisk.score > 0,
          riskScore: amountRisk.score,
          confidence: 0.9,
          reason: amountRisk.reason,
          deviation: amountRisk.score > 0 ? 2.5 : 0.1,
          patterns: {
            hasEnoughData: userHistory?.count > 0,
            averageAmount: userHistory?.averageAmount || 5000,
            medianAmount: userHistory?.averageAmount || 5000
          }
        },
        recipientAnalysis: {
          isNewPayee: payeeRisk.score > 0,
          isRarePayee: false,
          riskScore: payeeRisk.score,
          reason: payeeRisk.reason,
          profile: payeeRisk.score === 0 ? {
            transactionCount: 5,
            averageAmount: 800,
            lastTransaction: new Date(Date.now() - 86400000).toISOString()
          } : null
        },
        device: {
          isNewDevice: deviceRisk.score > 0,
          riskScore: deviceRisk.score
        },
        locationAnalysis: await this._getDetailedLocationAnalysis(location, userHistory, userId)
      }
    };
  }

  // ========== PRIVATE ANALYSIS METHODS ==========

  async _analyzeAmountRisk(amount, userHistory) {
    // Calculate user's average transaction amount
    const avgAmount = userHistory?.averageAmount || 5000;
    const maxAmount = userHistory?.maxAmount || 10000;

    let score = 0;
    let reason = '';

    if (amount > this.thresholds.VERY_HIGH_AMOUNT) {
      score = 100;
      reason = `🔥 Extremely high amount (₹${amount.toLocaleString()})`;
    } else if (amount > this.thresholds.HIGH_AMOUNT) {
      score = 70;
      reason = `⚠️ High transaction amount (₹${amount.toLocaleString()})`;
    } else if (amount > avgAmount * 3) {
      score = 60;
      reason = `📈 Amount 3x higher than your average (₹${avgAmount.toLocaleString()})`;
    } else if (amount > avgAmount * 2) {
      score = 40;
      reason = `📊 Amount 2x higher than your average (₹${avgAmount.toLocaleString()})`;
    }

    return { score, reason };
  }

  async _analyzeTimeRisk(timestamp, userHistory, userId) {
    try {
      const transactionTime = new Date(timestamp);
      const currentHour = transactionTime.getHours();

      // Get user from database to access timing analysis methods
      const user = await User.findById(userId);
      if (!user) {
        // Fallback to basic night-time detection if user not found
        return this._fallbackTimeRisk(currentHour, timestamp);
      }

      // Use user's actual transaction timing patterns
      const timingAnalysis = user.isUnusualTransactionTime(transactionTime);

      if (!timingAnalysis.isUnusual) {
        return { score: 0, reason: '' };
      }

      // Calculate risk score based on how unusual the timing is
      let score = 0;
      let reason = '';

      // Base risk for unusual timing
      if (timingAnalysis.confidence > 0.5) {
        // High confidence in user's patterns
        score = 70;
        reason = `⏰ Transaction outside your typical hours (${currentHour}:00)`;
      } else if (timingAnalysis.confidence > 0.2) {
        // Moderate confidence
        score = 50;
        reason = `⏰ Transaction at unusual time (${currentHour}:00)`;
      } else {
        // Low confidence, fall back to night-time detection
        if (currentHour >= this.thresholds.NIGHT_HOURS_START || currentHour < this.thresholds.NIGHT_HOURS_END) {
          score = 40;
          reason = `🌙 Late night transaction (${currentHour}:00)`;
        }
      }

      return { score, reason };
    } catch (error) {
      console.error('Error analyzing time risk:', error);
      // Fallback to basic analysis
      return this._fallbackTimeRisk(new Date(timestamp).getHours(), timestamp);
    }
  }

  _fallbackTimeRisk(hour, timestamp) {
    let score = 0;
    let reason = '';

    // Basic night-time detection as fallback
    if (hour >= this.thresholds.NIGHT_HOURS_START || hour < this.thresholds.NIGHT_HOURS_END) {
      score = 60;
      const timeStr = new Date(timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      reason = `🌙 Transaction during night hours (${timeStr})`;
    }

    return { score, reason };
  }

  async _analyzePayeeRisk(recipientVPA, userId, userHistory) {
    try {
      // Check if user has sent money to this VPA before
      const existingTransaction = await Transaction.findOne({
        userId,
        recipientVPA,
        status: 'completed'
      });

      if (existingTransaction) {
        // Known payee - low risk
        return { score: 0, reason: '' };
      }

      // New payee - moderate risk
      return {
        score: 100,
        reason: `👤 New recipient (${recipientVPA})`
      };
    } catch (error) {
      console.error('Error analyzing payee risk:', error);
      // Assume new payee if error
      return { score: 100, reason: '👤 New recipient (unable to verify history)' };
    }
  }

  async _analyzeDeviceRisk(deviceId, userId, userHistory) {
    try {
      if (!deviceId) {
        return {
          score: 60,
          reason: '📱 Device information unavailable'
        };
      }

      // Check if this device has been used before
      const knownDevice = await Transaction.findOne({
        userId,
        deviceId,
        status: 'completed'
      });

      if (knownDevice) {
        return { score: 0, reason: '' };
      }

      return {
        score: 100,
        reason: '📱 New or unrecognized device'
      };
    } catch (error) {
      console.error('Error analyzing device risk:', error);
      return { score: 60, reason: '📱 Unable to verify device' };
    }
  }

  _analyzeLocationRisk(location, userHistory) {
    // Placeholder for location-based risk analysis
    // In production, compare with user's typical locations
    if (!location) {
      return {
        score: 30,
        reason: '📍 Location information unavailable'
      };
    }

    // Check if location is significantly different from usual
    const usualLocation = userHistory?.commonLocation;
    if (usualLocation && this._calculateDistance(location, usualLocation) > 500) {
      return {
        score: 70,
        reason: '📍 Transaction from unusual location (>500km from normal)'
      };
    }

    return { score: 0, reason: '' };
  }

  async _analyzeVelocityRisk(userId, currentAmount, timestamp) {
    try {
      // Check transactions in the last N minutes
      const timeWindow = new Date(timestamp);
      timeWindow.setMinutes(timeWindow.getMinutes() - this.thresholds.VELOCITY_MINUTES);

      const recentTransactions = await Transaction.find({
        userId,
        createdAt: { $gte: timeWindow },
        status: { $in: ['completed', 'pending'] }
      });

      const transactionCount = recentTransactions.length;
      const totalAmount = recentTransactions.reduce((sum, txn) => sum + txn.amount, 0) + currentAmount;

      let score = 0;
      let reason = '';

      if (transactionCount >= this.thresholds.VELOCITY_COUNT) {
        score = 80;
        reason = `🚀 ${transactionCount + 1} transactions in ${this.thresholds.VELOCITY_MINUTES} minutes`;
      } else if (totalAmount > this.thresholds.SUSPICIOUS_VELOCITY_AMOUNT) {
        score = 90;
        reason = `💸 High transaction velocity (₹${totalAmount.toLocaleString()} in ${this.thresholds.VELOCITY_MINUTES} min)`;
      }

      return { score, reason };
    } catch (error) {
      console.error('Error analyzing velocity risk:', error);
      return { score: 0, reason: '' };
    }
  }

  // ========== HELPER METHODS ==========

  _isBlacklisted(vpa, blacklist) {
    return blacklist.some(item => 
      item.vpa === vpa || item.phoneNumber === vpa
    );
  }

  _isWhitelisted(vpa, whitelist) {
    return whitelist.some(item => 
      item.vpa === vpa || item.phoneNumber === vpa
    );
  }

  _getRiskLevel(score) {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 30) return 'MEDIUM';
    return 'LOW';
  }

  _getDecision(score) {
    if (score >= 80) return 'BLOCK';
    if (score >= 60) return 'DELAY';
    if (score >= 30) return 'WARN';
    return 'APPROVE';
  }

  _calculateDistance(loc1, loc2) {
    // Haversine formula for distance between two coordinates
    if (!loc1?.latitude || !loc2?.latitude) return 0;

    const R = 6371; // Earth's radius in km
    const dLat = this._toRad(loc2.latitude - loc1.latitude);
    const dLon = this._toRad(loc2.longitude - loc1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this._toRad(loc1.latitude)) * Math.cos(this._toRad(loc2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  _toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  async _getDetailedLocationAnalysis(location, userHistory, userId) {
    try {
      // Get user from database to access location analysis methods
      const user = await User.findById(userId);
      if (!user) {
        // Fallback if user not found
        return {
          isNewLocation: false,
          isLocationUnavailable: !location,
          riskScore: location ? 0 : 30,
          reason: location ? 'Location verified' : '📍 Location information unavailable',
          currentLocation: location ? { ...location, city: 'Unknown City', state: 'Unknown State' } : null,
          typicalLocations: [],
          nearestDistance: null
        };
      }

      // Use user's actual location analysis
      const locationAnalysis = await user.analyzeLocation(location);

      return {
        isNewLocation: locationAnalysis.isNewLocation,
        isLocationUnavailable: locationAnalysis.isLocationUnavailable,
        riskScore: locationAnalysis.riskScore,
        reason: locationAnalysis.reason,
        currentLocation: locationAnalysis.currentLocation,
        typicalLocations: locationAnalysis.typicalLocations,
        nearestDistance: locationAnalysis.nearestDistance
      };
    } catch (error) {
      console.error('Error getting detailed location analysis:', error);
      // Fallback analysis
      return {
        isNewLocation: false,
        isLocationUnavailable: !location,
        riskScore: location ? 0 : 30,
        reason: location ? 'Location verified' : '📍 Location information unavailable',
        currentLocation: location ? { ...location, city: 'Unknown City', state: 'Unknown State' } : null,
        typicalLocations: [],
        nearestDistance: null
      };
    }
  }

  // Update thresholds dynamically
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    console.log('🔧 Updated Risk Thresholds:', this.thresholds);
  }
}

module.exports = new RiskScoringEngine();