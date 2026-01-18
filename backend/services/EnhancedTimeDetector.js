/**
 * Enhanced Time Detector for sophisticated time-based fraud detection
 * Detects complex temporal patterns and anomalies
 */
class EnhancedTimeDetector {
  constructor() {
    this.suspiciousPatterns = new Map();
    this.userBehaviorProfiles = new Map();
  }

  /**
   * Comprehensive time pattern analysis
   * @param {string} userId 
   * @param {Date} transactionTime 
   * @param {number} amount 
   * @param {Array} userHistory 
   * @returns {Object} Detailed pattern analysis
   */
  async detectAdvancedPatterns(userId, transactionTime, amount, userHistory) {
    const basePatterns = this.detectBasicPatterns(transactionTime, amount);
    const behavioralPatterns = await this.analyzeBehavioralPatterns(userId, transactionTime, userHistory);
    const velocityPatterns = this.analyzeTransactionVelocity(userId, transactionTime, userHistory);
    const seasonalPatterns = this.analyzeSeasonalPatterns(transactionTime, userHistory);
    
    const allPatterns = {
      ...basePatterns,
      ...behavioralPatterns,
      ...velocityPatterns,
      ...seasonalPatterns
    };

    const riskScore = this.calculatePatternRisk(allPatterns, amount);
    const alerts = this.generatePatternAlerts(allPatterns, amount);
    
    return {
      patterns: allPatterns,
      riskScore,
      alerts,
      confidence: this.calculatePatternConfidence(userHistory.length, allPatterns)
    };
  }

  /**
   * Basic time pattern detection
   */
  detectBasicPatterns(transactionTime, amount) {
    const hour = transactionTime.getHours();
    const day = transactionTime.getDay();
    const minute = transactionTime.getMinutes();
    
    return {
      // Temporal patterns
      lateNight: hour >= 0 && hour <= 5,
      earlyMorning: hour >= 4 && hour <= 7,
     深夜交易: hour >= 22 || hour <= 3,
      weekend: day === 0 || day === 6,
      businessHours: day >= 1 && day <= 5 && hour >= 9 && hour <= 17,
      lunchHours: hour >= 12 && hour <= 14,
      dinnerHours: hour >= 18 && hour <= 21,
      
      // Amount-time correlations
      highValueOffHours: amount > 50000 && (hour < 9 || hour > 17),
      mediumValueLate: amount > 10000 && amount <= 50000 && (hour >= 20 || hour <= 6),
      smallValue深夜: amount <= 10000 && (hour >= 22 || hour <= 4),
      
      // Suspicious timing combinations
      roundHour: minute === 0, // Exactly on the hour
      quarterHour: minute % 15 === 0, // 15, 30, 45 min marks
      unusualMinute: minute === 33 || minute === 44 || minute === 55, // Suspicious minutes
      
      // Speed patterns
      rapidSuccession: false, // Will be set by velocity analysis
      burstActivity: false    // Will be set by velocity analysis
    };
  }

  /**
   * Behavioral pattern analysis based on user history
   */
  async analyzeBehavioralPatterns(userId, transactionTime, userHistory) {
    if (userHistory.length < 5) {
      return { insufficientData: true };
    }

    const currentHour = transactionTime.getHours();
    const currentDay = transactionTime.getDay();
    
    // Calculate user's baseline behavior
    const hourlyFrequency = this.calculateHourlyFrequency(userHistory);
    const dailyFrequency = this.calculateDailyFrequency(userHistory);
    const amountPatterns = this.analyzeAmountPatterns(userHistory);
    
    // Compare current transaction to user baseline
    const hourlyDeviation = this.calculateHourlyDeviation(currentHour, hourlyFrequency);
    const dailyDeviation = this.calculateDailyDeviation(currentDay, dailyFrequency);
    
    return {
      hourlyDeviation,
      dailyDeviation,
      amountPatternDeviation: this.calculateAmountDeviation(userHistory, transactionTime),
      consistencyScore: this.calculateConsistencyScore(hourlyFrequency, dailyFrequency),
      firstTimeHour: !hourlyFrequency[currentHour],
      firstTimeDay: !dailyFrequency[currentDay],
      typicalAmountRange: amountPatterns.typicalRange,
      amountOutlier: amountPatterns.outliers.includes(transactionTime.getTime())
    };
  }

  /**
   * Transaction velocity analysis
   */
  analyzeTransactionVelocity(userId, transactionTime, userHistory) {
    if (userHistory.length < 3) {
      return { insufficientData: true };
    }

    const recentTransactions = userHistory
      .filter(tx => {
        const txTime = new Date(tx.timestamp);
        const timeDiff = transactionTime - txTime;
        return timeDiff > 0 && timeDiff <= 60 * 60 * 1000; // Last hour
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const transactionCountLastHour = recentTransactions.length;
    const rapidTransactions = recentTransactions.filter((tx, index) => {
      if (index === 0) return false;
      const timeDiff = new Date(recentTransactions[index-1].timestamp) - new Date(tx.timestamp);
      return timeDiff <= 5 * 60 * 1000; // Within 5 minutes
    }).length;

    return {
      transactionsLastHour: transactionCountLastHour,
      rapidSuccession: transactionCountLastHour >= 3,
      burstActivity: rapidTransactions >= 2,
      averageInterval: this.calculateAverageInterval(recentTransactions),
      velocityRisk: this.calculateVelocityRisk(transactionCountLastHour, rapidTransactions)
    };
  }

  /**
   * Seasonal and cyclical pattern analysis
   */
  analyzeSeasonalPatterns(transactionTime, userHistory) {
    const month = transactionTime.getMonth();
    const isMonthEnd = transactionTime.getDate() >= 25;
    const isPaydayPeriod = (transactionTime.getDate() >= 1 && transactionTime.getDate() <= 5) ||
                          (transactionTime.getDate() >= 10 && transactionTime.getDate() <= 12);
    
    // Weekend vs weekday spending patterns
    const weekendSpendingRatio = this.calculateWeekendSpendingRatio(userHistory);
    const weekdaySpendingRatio = 1 - weekendSpendingRatio;
    
    return {
      monthEndActivity: isMonthEnd,
      paydayPeriod: isPaydayPeriod,
      seasonalMonth: this.isSeasonalMonth(month, userHistory),
      weekendSpendingPattern: weekendSpendingRatio > 0.4,
      weekdaySpendingPattern: weekdaySpendingRatio > 0.7,
      holidayPeriod: this.isHolidayPeriod(transactionTime)
    };
  }

  // Helper methods for calculations
  calculateHourlyFrequency(transactions) {
    const frequency = {};
    transactions.forEach(tx => {
      const hour = new Date(tx.timestamp).getHours();
      frequency[hour] = (frequency[hour] || 0) + 1;
    });
    return frequency;
  }

  calculateDailyFrequency(transactions) {
    const frequency = {};
    transactions.forEach(tx => {
      const day = new Date(tx.timestamp).getDay();
      frequency[day] = (frequency[day] || 0) + 1;
    });
    return frequency;
  }

  calculateHourlyDeviation(currentHour, hourlyFrequency) {
    const totalTransactions = Object.values(hourlyFrequency).reduce((sum, count) => sum + count, 0);
    const currentHourCount = hourlyFrequency[currentHour] || 0;
    const expectedFrequency = totalTransactions / 24;
    
    return Math.abs(currentHourCount - expectedFrequency) / expectedFrequency;
  }

  calculateDailyDeviation(currentDay, dailyFrequency) {
    const totalTransactions = Object.values(dailyFrequency).reduce((sum, count) => sum + count, 0);
    const currentDayCount = dailyFrequency[currentDay] || 0;
    const expectedFrequency = totalTransactions / 7;
    
    return Math.abs(currentDayCount - expectedFrequency) / expectedFrequency;
  }

  analyzeAmountPatterns(transactions) {
    const amounts = transactions.map(tx => tx.amount).sort((a, b) => a - b);
    const q1 = amounts[Math.floor(amounts.length * 0.25)];
    const q3 = amounts[Math.floor(amounts.length * 0.75)];
    const iqr = q3 - q1;
    
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    const outliers = transactions
      .filter(tx => tx.amount < lowerBound || tx.amount > upperBound)
      .map(tx => new Date(tx.timestamp).getTime());
    
    return {
      typicalRange: { min: q1, max: q3 },
      outliers,
      median: amounts[Math.floor(amounts.length / 2)]
    };
  }

  calculateAmountDeviation(transactions, transactionTime) {
    // Implementation for amount-time correlation analysis
    return 0.5; // Placeholder
  }

  calculateConsistencyScore(hourlyFreq, dailyFreq) {
    // Higher score means more consistent behavior
    const hourConsistency = Object.values(hourlyFreq).reduce((sum, count) => sum + (count > 0 ? 1 : 0), 0) / 24;
    const dayConsistency = Object.values(dailyFreq).reduce((sum, count) => sum + (count > 0 ? 1 : 0), 0) / 7;
    
    return (hourConsistency + dayConsistency) / 2;
  }

  calculateAverageInterval(transactions) {
    if (transactions.length < 2) return Infinity;
    
    let totalInterval = 0;
    for (let i = 1; i < transactions.length; i++) {
      const interval = new Date(transactions[i-1].timestamp) - new Date(transactions[i].timestamp);
      totalInterval += interval;
    }
    
    return totalInterval / (transactions.length - 1);
  }

  calculateVelocityRisk(transactionCount, rapidCount) {
    let risk = 0;
    if (transactionCount >= 5) risk += 15;
    if (transactionCount >= 10) risk += 10;
    if (rapidCount >= 3) risk += 20;
    return Math.min(risk, 35);
  }

  calculateWeekendSpendingRatio(transactions) {
    const weekendTransactions = transactions.filter(tx => {
      const day = new Date(tx.timestamp).getDay();
      return day === 0 || day === 6;
    });
    return weekendTransactions.length / transactions.length;
  }

  isSeasonalMonth(month, transactions) {
    // Detect if this month typically has higher/lower activity
    const monthlyActivity = {};
    transactions.forEach(tx => {
      const txMonth = new Date(tx.timestamp).getMonth();
      monthlyActivity[txMonth] = (monthlyActivity[txMonth] || 0) + 1;
    });
    
    const avgActivity = Object.values(monthlyActivity).reduce((sum, count) => sum + count, 0) / 12;
    const currentMonthActivity = monthlyActivity[month] || 0;
    
    return Math.abs(currentMonthActivity - avgActivity) / avgActivity > 0.5;
  }

  isHolidayPeriod(date) {
    const month = date.getMonth();
    const day = date.getDate();
    
    // Simplified holiday detection
    const holidays = [
      [0, 1],   // New Year
      [0, 26],  // Republic Day
      [8, 15],  // Independence Day
      [10, 2],  // Gandhi Jayanti
      [11, 25]  // Christmas
    ];
    
    return holidays.some(([holMonth, holDay]) => month === holMonth && day === holDay);
  }

  /**
   * Calculate overall risk from all detected patterns
   */
  calculatePatternRisk(patterns, amount) {
    let riskScore = 0;
    
    // Time-based risks
    if (patterns.lateNight) riskScore += 20;
    if (patterns.深夜交易) riskScore += 25;
    if (patterns.earlyMorning) riskScore += 15;
    if (patterns.weekend && amount > 20000) riskScore += 15;
    
    // Amount-time correlations
    if (patterns.highValueOffHours) riskScore += 30;
    if (patterns.mediumValueLate) riskScore += 20;
    
    // Behavioral deviations
    if (patterns.firstTimeHour) riskScore += 10;
    if (patterns.firstTimeDay) riskScore += 15;
    if (patterns.hourlyDeviation > 0.8) riskScore += 25;
    if (patterns.dailyDeviation > 0.8) riskScore += 20;
    
    // Velocity risks
    if (patterns.rapidSuccession) riskScore += 25;
    if (patterns.burstActivity) riskScore += 30;
    
    // Suspicious patterns
    if (patterns.unusualMinute) riskScore += 15;
    if (patterns.roundHour) riskScore += 10;
    
    return Math.min(riskScore, 50); // Cap at 50 points
  }

  /**
   * Generate alerts based on detected patterns
   */
  generatePatternAlerts(patterns, amount) {
    const alerts = [];
    
    if (patterns.lateNight) {
      alerts.push({
        type: 'WARNING',
        message: 'Transaction during late night hours (12 AM - 5 AM)',
        severity: 'MEDIUM'
      });
    }
    
    if (patterns.深夜交易) {
      alerts.push({
        type: 'ALERT',
        message: 'High-risk深夜 transaction time detected',
        severity: 'HIGH'
      });
    }
    
    if (patterns.highValueOffHours) {
      alerts.push({
        type: 'ALERT',
        message: `Large amount (₹${amount.toLocaleString()}) outside business hours`,
        severity: 'HIGH'
      });
    }
    
    if (patterns.rapidSuccession) {
      alerts.push({
        type: 'WARNING',
        message: 'Multiple transactions in short succession detected',
        severity: 'MEDIUM'
      });
    }
    
    if (patterns.burstActivity) {
      alerts.push({
        type: 'ALERT',
        message: 'Suspicious burst of transaction activity',
        severity: 'HIGH'
      });
    }
    
    return alerts;
  }

  /**
   * Calculate confidence in pattern detection
   */
  calculatePatternConfidence(historyLength, patterns) {
    let confidence = 0.5; // Base confidence
    
    if (historyLength >= 50) confidence += 0.3;
    else if (historyLength >= 20) confidence += 0.2;
    else if (historyLength >= 10) confidence += 0.1;
    
    // Reduce confidence for edge cases
    if (patterns.insufficientData) confidence *= 0.5;
    
    return Math.min(confidence, 0.95);
  }
}

module.exports = EnhancedTimeDetector;