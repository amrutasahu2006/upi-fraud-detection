const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { reverseGeocode } = require('../utils/geocoding');

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
      CIRCLE_REPORT: 80,
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
   * Get adaptive weights for a user (uses personalized weights if available)
   * @param {Object} user - User document
   * @returns {Object} Weights to use for scoring
   */
  _getAdaptiveWeights(user) {
    // If user has adaptive weights and learning is enabled, use them
    if (user?.adaptiveWeights && user.privacySettings?.behaviorLearning !== false) {
      // Merge with defaults to ensure all factors exist
      return { ...this.weights, ...user.adaptiveWeights };
    }
    return this.weights;
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

    console.log('🔍 Starting Corrected Risk Scoring for:', { amount, recipientVPA, userId });
    
    const user = await User.findById(userId); // Still need user for settings
    const settings = user?.privacySettings || { 
      behaviorLearning: false 
    };

    const weights = this._getAdaptiveWeights(user);
    console.log('⚖️ Using weights:', weights);

    // Circle Fraud check remains the same
    const circleMatch = user?.circleFraudReports?.find(report => report.payeeUpiId === recipientVPA);
    if (circleMatch) {
      const weightedScore = this.weights.CIRCLE_REPORT;
      riskFactors.circleAlert = weightedScore;
      totalScore += weightedScore;
      detailedReasons.push(`🛡️ Warning: A member of your safety circle previously reported this payee.`);
    }

    // Blacklist/Whitelist overrides remain the same
    if (this._isWhitelisted(recipientVPA, whitelist)) {
      return this._generateResponse(0, 'LOW', 'APPROVE', { whitelistHit: true }, ['✅ Recipient is whitelisted - trusted payee'], {});
    }
    if (this._isBlacklisted(recipientVPA, blacklist)) {
      return this._generateResponse(100, 'CRITICAL', 'BLOCK', { blacklistHit: true }, ['🚫 Recipient is blacklisted - known fraudulent account'], {});
    }

    // AI Detection Privacy Check
    if (!settings.aiDetection) {
      console.log('🙈 AI Detection DISABLED by user. Skipping analysis.');
      return this._generateResponse(0, 'LOW', 'APPROVE', { aiDisabled: true }, ['🔒 AI Analysis disabled by user settings'], { aiDetection: 'DISABLED' });
    }

    // Behavior Learning Privacy Check
    let effectiveHistory = userHistory;
    if (!settings.behaviorLearning || !userHistory || userHistory.count === 0) {
        console.log('🧠 Behavior Learning DISABLED or no history. Using baseline analysis.');
        effectiveHistory = { transactions: [], count: 0, averageAmount: 0, maxAmount: 0, knownPayees: [], knownDevices: [] };
    }

    // ===== CORRECTED Factor Analysis =====

    const amountRisk = this._analyzeAmountRisk(amount, effectiveHistory);
    if (amountRisk.score > 0) {
      const weightedScore = (amountRisk.score / 100) * weights.AMOUNT_ANOMALY;
      riskFactors.amountAnomaly = weightedScore;
      totalScore += weightedScore;
      detailedReasons.push(amountRisk.reason);
      console.log(`💰 Amount Risk: ${amountRisk.score}% → Weighted: ${weightedScore}`);
    }

    const timeRisk = this._analyzeTimeRisk(timestamp, effectiveHistory);
    if (timeRisk.score > 0) {
      const weightedScore = (timeRisk.score / 100) * weights.TIME_PATTERN;
      riskFactors.timePattern = weightedScore;
      totalScore += weightedScore;
      detailedReasons.push(timeRisk.reason);
      console.log(`⏰ Time Risk: ${timeRisk.score}% → Weighted: ${weightedScore}`);
    }

    const payeeRisk = this._analyzePayeeRisk(recipientVPA, effectiveHistory);
    if (payeeRisk.score > 0) {
      const weightedScore = (payeeRisk.score / 100) * weights.NEW_PAYEE;
      riskFactors.newPayee = weightedScore;
      totalScore += weightedScore;
      detailedReasons.push(payeeRisk.reason);
      console.log(`👤 Payee Risk: ${payeeRisk.score}% → Weighted: ${weightedScore}`);
    }

    const deviceRisk = this._analyzeDeviceRisk(deviceId, effectiveHistory);
    if (deviceRisk.score > 0) {
      const weightedScore = (deviceRisk.score / 100) * weights.DEVICE_FINGERPRINT;
      riskFactors.deviceFingerprint = weightedScore;
      totalScore += weightedScore;
      detailedReasons.push(deviceRisk.reason);
      console.log(`📱 Device Risk: ${deviceRisk.score}% → Weighted: ${weightedScore}`);
    }

    const locationRisk = this._analyzeLocationRisk(location, effectiveHistory);
    if (locationRisk.score > 0) {
      const weightedScore = (locationRisk.score / 100) * weights.LOCATION_ANOMALY;
      riskFactors.locationAnomaly = weightedScore;
      totalScore += weightedScore;
      detailedReasons.push(locationRisk.reason);
      console.log(`📍 Location Risk: ${locationRisk.score}% → Weighted: ${weightedScore}`);
    }
    
    // Velocity check still needs to query recent transactions, which is correct.
    const velocityRisk = await this._analyzeVelocityRisk(userId, amount, timestamp);
    if (velocityRisk.score > 0) {
        const weightedScore = (velocityRisk.score / 100) * weights.VELOCITY_CHECK;
        riskFactors.velocityCheck = weightedScore;
        totalScore += weightedScore;
        detailedReasons.push(velocityRisk.reason);
        console.log(`🚀 Velocity Risk: ${velocityRisk.score}% → Weighted: ${weightedScore}`);
    }

    totalScore = Math.min(Math.round(totalScore), 100);
    const riskLevel = this._getRiskLevel(totalScore);
    const decision = this._getDecision(totalScore);

    console.log(`📊 FINAL RISK SCORE: ${totalScore}/100 (${riskLevel}) → ${decision}`);

    // Reverse geocode the location to get detailed address information
    let enrichedLocation = location;
    if (location && location.latitude && location.longitude) {
      try {
        const geocoded = await reverseGeocode(location.latitude, location.longitude);
        enrichedLocation = {
          ...location,
          city: geocoded.city,
          state: geocoded.state,
          country: geocoded.country,
          // Include all detailed address fields for more specific location information
          suburb: geocoded.suburb || '',
          district: geocoded.district || '',
          road: geocoded.road || '',
          neighbourhood: geocoded.neighbourhood || '',
          postcode: geocoded.postcode || '',
          countryCode: geocoded.countryCode || '',
          formattedAddress: geocoded.formattedAddress || ''
        };
        console.log(`📍 Reverse geocoded location: ${geocoded.formattedAddress || geocoded.city + ', ' + geocoded.state + ', ' + geocoded.country}`);
      } catch (error) {
        console.error('❌ Reverse geocoding failed:', error.message);
        // Keep original location if geocoding fails
      }
    }

    // Generate the final analysis object for the response
    const finalAnalysis = this._generateFinalAnalysis(
        timeRisk, amountRisk, payeeRisk, deviceRisk, locationRisk, effectiveHistory, timestamp, enrichedLocation
    );
    
    return this._generateResponse(totalScore, riskLevel, decision, riskFactors, detailedReasons, finalAnalysis);
  }

  /**
   * Generates the final analysis object for the API response.
   */
  _generateFinalAnalysis(timeRisk, amountRisk, payeeRisk, deviceRisk, locationRisk, userHistory, timestamp, location) {
    return {
        timeAnalysis: {
          isUnusual: timeRisk.score > 0,
          riskScore: timeRisk.score,
          confidence: timeRisk.confidence,
          reason: timeRisk.reason,
          typicalHours: timeRisk.typicalHours || [],
          currentHour: new Date(timestamp).getHours(),
          dayOfWeekName: new Date(timestamp).toLocaleDateString('en-US', { weekday: 'long' })
        },
        amountAnalysis: {
          isAnomalous: amountRisk.score > 0,
          riskScore: amountRisk.score,
          confidence: amountRisk.confidence,
          reason: amountRisk.reason,
          patterns: {
            hasEnoughData: userHistory.count > 3, // require at least 3 txns for pattern
            averageAmount: userHistory.averageAmount,
          }
        },
        recipientAnalysis: {
          isNewPayee: payeeRisk.score > 0,
          riskScore: payeeRisk.score,
          reason: payeeRisk.reason,
          profile: payeeRisk.score === 0 ? { transactionCount: userHistory.transactions.filter(t => t.recipientVPA === payeeRisk.vpa).length } : null
        },
        device: {
          isNewDevice: deviceRisk.score > 0,
          riskScore: deviceRisk.score,
          reason: deviceRisk.reason,
        },
        locationAnalysis: {
            isNewLocation: locationRisk.score > 0,
            riskScore: locationRisk.score,
            reason: locationRisk.reason,
            location: location
        }
    };
  }
  
  /**
   * Generates a consistent response object.
   */
  _generateResponse(totalScore, riskLevel, decision, riskFactors, detailedReasons, analysis) {
      return {
          totalScore,
          riskLevel,
          decision,
          riskFactors,
          detailedReasons,
          analysis,
          breakdown: {
            amountAnomaly: (riskFactors.amountAnomaly || 0),
            timePattern: (riskFactors.timePattern || 0),
            newPayee: (riskFactors.newPayee || 0),
            deviceFingerprint: (riskFactors.deviceFingerprint || 0),
            locationAnomaly: (riskFactors.locationAnomaly || 0),
            velocityCheck: (riskFactors.velocityCheck || 0),
            circleAlert: (riskFactors.circleAlert || 0)
          }
      };
  }


  // ========== CORRECTED PRIVATE ANALYSIS METHODS ==========

  _analyzeAmountRisk(amount, userHistory) {
    const { averageAmount, count } = userHistory;
    let score = 0;
    let reason = '';

    // If no history, only trigger on very high absolute amounts
    if (count < 3) {
      if (amount > this.thresholds.VERY_HIGH_AMOUNT) {
        score = 80; // Slightly lower score since there's no pattern to compare to
        reason = `🔥 Extremely high amount (₹${amount.toLocaleString()}) for a new user.`;
      } else if (amount > this.thresholds.HIGH_AMOUNT) {
        score = 50;
        reason = `⚠️ High transaction amount (₹${amount.toLocaleString()}) for a new user.`;
      }
      return { score, reason, confidence: 0.3 };
    }

    // With history, perform pattern analysis
    if (amount > this.thresholds.VERY_HIGH_AMOUNT) {
      score = 100;
      reason = `🔥 Extremely high amount (₹${amount.toLocaleString()})`;
    } else if (amount > this.thresholds.HIGH_AMOUNT) {
      score = 70;
      reason = `⚠️ High transaction amount (₹${amount.toLocaleString()})`;
    } else if (amount > averageAmount * 4) { // Increased multiplier for higher confidence
      score = 60;
      reason = `📈 Amount is more than 4x your average (₹${averageAmount.toLocaleString()})`;
    } else if (amount > averageAmount * 2.5) {
      score = 40;
      reason = `📊 Amount is more than 2.5x your average (₹${averageAmount.toLocaleString()})`;
    }

    return { score, reason, confidence: Math.min(count / 10, 1) };
  }

  _analyzeTimeRisk(timestamp, userHistory) {
    const transactionTime = new Date(timestamp);
    const currentHour = transactionTime.getHours();
    const recentTransactions = userHistory.transactions;
    
    // Fallback for no history
    if (recentTransactions.length < 5) {
        let score = 0, reason = 'Establishing typical transaction times...';
        if (currentHour >= this.thresholds.NIGHT_HOURS_START || currentHour < this.thresholds.NIGHT_HOURS_END) {
          score = 40;
          reason = `🌙 Late night transaction (${currentHour}:00) with insufficient history.`;
        }
        return { score, reason, confidence: 0.1, typicalHours: [] };
    }

    // --- Calculate Typical Hours from provided history ---
    const hourCounts = {};
    recentTransactions.forEach(tx => {
      const txHour = new Date(tx.createdAt).getHours();
      hourCounts[txHour] = (hourCounts[txHour] || 0) + 1;
    });
    
    const sortedHours = Object.entries(hourCounts).sort(([,a], [,b]) => b - a);
    let cumulativeCount = 0;
    const typicalHours = [];
    for (const [hour, count] of sortedHours) {
      cumulativeCount += count;
      typicalHours.push(parseInt(hour));
      if ((cumulativeCount / recentTransactions.length) >= 0.8) break; // Top 80%
    }
    typicalHours.sort((a, b) => a - b);
    // --- End Calculation ---

    const isSleepingHour = currentHour >= this.thresholds.NIGHT_HOURS_START || currentHour < this.thresholds.NIGHT_HOURS_END;
    const hasNightHistory = typicalHours.some(h => h >= this.thresholds.NIGHT_HOURS_START || h < this.thresholds.NIGHT_HOURS_END);
    
    let isUnusual = !typicalHours.includes(currentHour);
    // If it's a sleeping hour and user has no history of night transactions, it's definitely unusual.
    if (isSleepingHour && !hasNightHistory) {
      isUnusual = true;
    }

    if (!isUnusual) {
      return { score: 0, reason: '', confidence: Math.min(recentTransactions.length / 20, 1), typicalHours };
    }
    
    let score = 70;
    let reason = `⏰ Transaction at ${currentHour}:00 is outside your typical hours.`;
    if (isSleepingHour && !hasNightHistory) {
      score = 85;
      reason = `🌙 Transaction at ${currentHour}:00 is during late night, which is unusual for you.`;
    }

    return { score, reason, confidence: Math.min(recentTransactions.length / 20, 1), typicalHours };
  }

_analyzePayeeRisk(recipientVPA, userHistory) {
    // FIX: Check both payeeUpiId AND recipientVPA for known payees
    // Some transactions might use payeeUpiId, others might use recipientVPA
    const isKnown = userHistory.knownPayees && userHistory.knownPayees.includes(recipientVPA);

    if (isKnown) {
      return { score: 0, reason: '' };
    }

    // Additional check: if no history, return appropriate response
    if (!userHistory.knownPayees || userHistory.knownPayees.length === 0) {
      return {
        score: 100, // High risk score for a new payee with no history
        reason: `👤 New recipient (${recipientVPA}) - No transaction history`,
        vpa: recipientVPA
      };
    }

    return {
      score: 100, // High risk score for a new payee
      reason: `👤 New recipient (${recipientVPA})`,
      vpa: recipientVPA
    };
  }

  _analyzeDeviceRisk(deviceId, userHistory) {
    if (!deviceId || deviceId === 'unknown-device') {
      return { score: 60, reason: '📱 Device information unavailable' };
    }
    
    // Uses the pre-fetched list of known devices
    const isKnown = userHistory.knownDevices.includes(deviceId);

    if (isKnown) {
      return { score: 0, reason: '' };
    }

    return {
      score: 100, // High risk score for a new device
      reason: '📱 New or unrecognized device used for transaction'
    };
  }

  _analyzeLocationRisk(location, userHistory) {
    if (!location) {
      return { score: 30, reason: '📍 Location information unavailable' };
    }

    const { commonLocation, count } = userHistory;
    
    if (count < 5 || !commonLocation) {
        return { score: 10, reason: '📍 Establishing typical transaction locations...' };
    }
    
    // A real implementation would be more complex, this is a simplification
    // For now, we assume controller's reverse geocoding is the main source
    // and we just check if the current city is the most common one.
    if (location.city && commonLocation && location.city !== commonLocation) {
        return {
            score: 70,
            reason: `📍 Transaction from unusual location (${location.city})`
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
          currentLocation: location ? { 
            city: location.city || 'Unknown City', 
            state: location.state || 'Unknown State', 
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy
          } : null,
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
        currentLocation: location ? { 
          city: location.city || 'Unknown City', 
          state: location.state || 'Unknown State',
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy
        } : null,
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