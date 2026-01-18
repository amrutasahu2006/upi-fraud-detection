const Transaction = require('../models/Transaction');

/**
 * Time-based anomaly detection service
 * Analyzes user transaction patterns to detect unusual timing
 */
class TimeAnalysisService {
  constructor() {
    // Cache for performance (could be Redis in production)
    this.patternCache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
  }

  /**
   * Analyze if a transaction time is unusual for the user
   * @param {string} userId - User ID
   * @param {Date} transactionTime - Transaction timestamp
   * @param {number} amount - Transaction amount
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeTransactionTime(userId, transactionTime, amount = 0) {
    try {
      const userHistory = await this.getUserTransactionHistory(userId);
      
      if (userHistory.length === 0) {
        return {
          isUnusualTime: false,
          confidence: 0,
          reason: "Insufficient transaction history",
          typicalHours: [],
          riskScore: 0,
          warnings: []
        };
      }

      const transactionHour = transactionTime.getHours();
      const dayOfWeek = transactionTime.getDay();
      
      // Get typical hours for this user
      const typicalHours = await this.getTypicalHours(userId);
      const dayTypicalHours = await this.getDaySpecificTypicalHours(userId, dayOfWeek);
      
      // Check various time patterns
      const timePatterns = this.detectTimePatterns(transactionTime, amount);
      
      // Determine if time is unusual
      const isUnusual = this.isHourUnusual(
        transactionHour, 
        typicalHours, 
        dayTypicalHours
      );
      
      // Calculate risk score contribution
      const timeRiskScore = this.calculateTimeRiskScore(
        transactionHour, 
        typicalHours, 
        dayTypicalHours, 
        timePatterns
      );
      
      // Generate warnings
      const warnings = this.generateTimeWarnings(timePatterns, isUnusual, amount);
      
      const result = {
        isUnusualTime: isUnusual,
        confidence: this.calculateConfidence(userHistory.length),
        reason: isUnusual ? "Transaction outside typical hours" : "Normal transaction time",
        typicalHours,
        dayTypicalHours,
        currentHour: transactionHour,
        dayOfWeek,
        dayOfWeekName: this.getDayName(dayOfWeek),
        riskScore: timeRiskScore,
        patterns: timePatterns,
        warnings
      };
      
      // Cache the result for performance
      this.cacheResult(userId, result);
      
      return result;
      
    } catch (error) {
      console.error('Time analysis error:', error);
      return {
        isUnusualTime: false,
        confidence: 0,
        reason: "Analysis error",
        typicalHours: [],
        riskScore: 0,
        warnings: [],
        error: error.message
      };
    }
  }

  /**
   * Get user's transaction history from database
   */
  async getUserTransactionHistory(userId, daysBack = 90) {
    try {
      const cacheKey = `${userId}_history_${daysBack}`;
      
      // Check cache first
      if (this.patternCache.has(cacheKey)) {
        const cached = this.patternCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);
      
      const transactions = await Transaction.find({
        userId: userId,
        timestamp: { $gte: cutoffDate },
        status: 'completed'
      }).sort({ timestamp: -1 });
      
      // Cache the result
      this.patternCache.set(cacheKey, {
        data: transactions,
        timestamp: Date.now()
      });
      
      return transactions;
      
    } catch (error) {
      console.error('Error fetching user history:', error);
      return [];
    }
  }

  /**
   * Get user's typical transaction hours (80% frequency)
   */
  async getTypicalHours(userId, daysBack = 90) {
    const cacheKey = `${userId}_typical_hours_${daysBack}`;
    
    // Check cache
    if (this.patternCache.has(cacheKey)) {
      const cached = this.patternCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }
    
    const transactions = await this.getUserTransactionHistory(userId, daysBack);
    
    if (transactions.length === 0) return [];
    
    // Count hour frequencies
    const hourCounts = {};
    transactions.forEach(tx => {
      hourCounts[tx.hour] = (hourCounts[tx.hour] || 0) + 1;
    });
    
    // Get hours accounting for 80% of transactions
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
    
    const result = typicalHours.sort((a, b) => a - b);
    
    // Cache result
    this.patternCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
  }

  /**
   * Get typical hours for specific day of week
   */
  async getDaySpecificTypicalHours(userId, dayOfWeek, daysBack = 90) {
    const transactions = await this.getUserTransactionHistory(userId, daysBack);
    
    const dayTransactions = transactions.filter(tx => tx.dayOfWeek === dayOfWeek);
    
    if (dayTransactions.length === 0) return [];
    
    const hourCounts = {};
    dayTransactions.forEach(tx => {
      hourCounts[tx.hour] = (hourCounts[tx.hour] || 0) + 1;
    });
    
    const sortedHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a);
    
    const totalTransactions = dayTransactions.length;
    let cumulativeCount = 0;
    const typicalHours = [];
    
    for (const [hour, count] of sortedHours) {
      cumulativeCount += count;
      typicalHours.push(parseInt(hour));
      
      if ((cumulativeCount / totalTransactions) >= 0.8) break;
    }
    
    return typicalHours.sort((a, b) => a - b);
  }

  /**
   * Detect various time-based patterns
   */
  detectTimePatterns(transactionTime, amount) {
    const hour = transactionTime.getHours();
    const day = transactionTime.getDay();
    
    return {
      lateNightTransaction: hour >= 0 && hour <= 5,
      weekendTransaction: day === 0 || day === 6,
      businessHoursTransaction: day >= 1 && day <= 5 && hour >= 9 && hour <= 17,
      earlyMorningTransaction: hour >= 4 && hour <= 7,
      highValueUnusualTime: amount > 50000 && (hour < 9 || hour > 17),
     深夜交易: hour >= 22 || hour <= 3
    };
  }

  /**
   * Check if hour is unusual compared to user patterns
   */
  isHourUnusual(currentHour, typicalHours, dayTypicalHours) {
    const referenceHours = dayTypicalHours.length > 0 ? dayTypicalHours : typicalHours;
    
    if (referenceHours.length === 0) return false;
    
    // Check if current hour is within typical range ± 2 hours
    const isWithinTypicalRange = referenceHours.some(typicalHour => 
      Math.abs(currentHour - typicalHour) <= 2
    );
    
    // Special case: sleeping hours (0-5 AM) when no night history
    const isSleepingHour = currentHour >= 0 && currentHour <= 5;
    const hasNightHistory = referenceHours.some(hour => hour >= 0 && hour <= 5);
    
    if (isSleepingHour && !hasNightHistory) {
      return true;
    }
    
    return !isWithinTypicalRange;
  }

  /**
   * Calculate time-based risk score
   */
  calculateTimeRiskScore(currentHour, typicalHours, dayTypicalHours, patterns) {
    let riskScore = 0;
    
    // Base risk for unusual timing
    if (this.isHourUnusual(currentHour, typicalHours, dayTypicalHours)) {
      // Risk increases with deviation from typical hours
      const closestTypical = typicalHours.length > 0 
        ? typicalHours.reduce((prev, curr) => 
            Math.abs(curr - currentHour) < Math.abs(prev - currentHour) ? curr : prev
          )
        : 12;
      
      const hourDifference = Math.abs(currentHour - closestTypical);
      
      if (hourDifference <= 2) riskScore += 0;
      else if (hourDifference <= 4) riskScore += 10;
      else if (hourDifference <= 6) riskScore += 15;
      else riskScore += 20;
    }
    
    // Additional risk for specific patterns
    if (patterns.lateNightTransaction) riskScore += 15;
    if (patterns.earlyMorningTransaction) riskScore += 10;
    if (patterns.highValueUnusualTime) riskScore += 25;
    if (patterns.深夜交易) riskScore += 20;
    
    return Math.min(riskScore, 30); // Cap at 30 points
  }

  /**
   * Generate warnings based on detected patterns
   */
  generateTimeWarnings(patterns, isUnusual, amount) {
    const warnings = [];
    
    if (patterns.lateNightTransaction) {
      warnings.push("Late night transaction (12 AM - 5 AM)");
    }
    
    if (patterns.weekendTransaction && amount > 20000) {
      warnings.push("High-value weekend transaction");
    }
    
    if (patterns.earlyMorningTransaction) {
      warnings.push("Very early morning transaction (4 AM - 7 AM)");
    }
    
    if (patterns.highValueUnusualTime) {
      warnings.push("High-value transaction at unusual time");
    }
    
    if (patterns.深夜交易) {
      warnings.push("深夜 high-risk transaction time");
    }
    
    if (isUnusual && warnings.length === 0) {
      warnings.push("Transaction time differs from your usual pattern");
    }
    
    return warnings;
  }

  /**
   * Calculate confidence based on data volume
   */
  calculateConfidence(historyLength) {
    if (historyLength < 10) return 0.3;
    if (historyLength < 30) return 0.6;
    if (historyLength < 100) return 0.8;
    return 0.95;
  }

  /**
   * Helper method to get day name
   */
  getDayName(dayIndex) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  }

  /**
   * Cache analysis results for performance
   */
  cacheResult(userId, result) {
    const cacheKey = `${userId}_analysis_${Date.now()}`;
    this.patternCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    // Clean up old cache entries periodically
    if (this.patternCache.size > 1000) {
      this.cleanupCache();
    }
  }

  /**
   * Clean up expired cache entries
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.patternCache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.patternCache.delete(key);
      }
    }
  }

  /**
   * Clear user-specific cache (call when new transactions are added)
   */
  clearUserCache(userId) {
    for (const key of this.patternCache.keys()) {
      if (key.startsWith(userId)) {
        this.patternCache.delete(key);
      }
    }
  }
}

module.exports = TimeAnalysisService;