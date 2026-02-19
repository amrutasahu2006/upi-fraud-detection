const Transaction = require('../models/Transaction');
const UserFeedback = require('../models/UserFeedback');

/**
 * Fraud Forecasting Service
 * Predicts user's likelihood of being targeted by fraud in the next 7 days
 */
class FraudForecastService {
  constructor() {
    // Risk factors and their weights for forecasting
    this.forecastWeights = {
      transactionVelocity: 0.20,
      amountAnomaly: 0.20,
      timePatternAnomaly: 0.15,
      newPayeeRatio: 0.15,
      weekendFactor: 0.10,
      recentFraudReports: 0.20
    };

    // High-risk days (Friday=5, Saturday=6, Sunday=0)
    this.highRiskDays = [0, 5, 6];
    
    // Fraud pattern multipliers
    this.fraudPatterns = {
      salaryDay: { dates: [1, 2], multiplier: 1.3 }, // 1st-2nd of month
      festivalSeason: { months: [10, 11], multiplier: 1.4 }, // Nov-Dec
      weekend: { days: [0, 5, 6], multiplier: 1.2 }
    };
  }

  /**
   * Generate 7-day fraud risk forecast for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Forecast result
   */
  async generateForecast(userId) {
    try {
      // Get user's recent transaction history (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentTransactions = await Transaction.find({
        userId,
        timestamp: { $gte: thirtyDaysAgo }
      }).sort({ timestamp: -1 });

      // Get user's feedback history
      const recentFeedback = await UserFeedback.find({
        userId,
        timestamp: { $gte: thirtyDaysAgo }
      });

      // Calculate individual risk factors
      const velocityScore = this._calculateVelocityScore(recentTransactions);
      const amountAnomalyScore = this._calculateAmountAnomalyScore(recentTransactions);
      const timeAnomalyScore = this._calculateTimeAnomalyScore(recentTransactions);
      const newPayeeScore = this._calculateNewPayeeScore(recentTransactions);
      const weekendRiskScore = this._calculateWeekendRisk();
      const fraudReportScore = this._calculateFraudReportScore(recentFeedback);

      // Calculate base forecast score
      let forecastScore = (
        velocityScore * this.forecastWeights.transactionVelocity +
        amountAnomalyScore * this.forecastWeights.amountAnomaly +
        timeAnomalyScore * this.forecastWeights.timePatternAnomaly +
        newPayeeScore * this.forecastWeights.newPayeeRatio +
        weekendRiskScore * this.forecastWeights.weekendFactor +
        fraudReportScore * this.forecastWeights.recentFraudReports
      );

      // Apply seasonal/temporal multipliers
      forecastScore = this._applyTemporalMultipliers(forecastScore);

      // Cap at 100
      forecastScore = Math.min(Math.round(forecastScore), 100);

      // Generate daily breakdown for next 7 days
      const dailyForecast = this._generateDailyForecast(forecastScore, recentTransactions);

      // Determine risk level and message
      const { riskLevel, message, tips } = this._generateRiskAssessment(forecastScore, dailyForecast);

      return {
        success: true,
        forecast: {
          overallRisk: forecastScore,
          riskLevel,
          message,
          tips,
          dailyForecast,
          contributingFactors: {
            transactionVelocity: { score: Math.round(velocityScore * 100) / 100, weight: this.forecastWeights.transactionVelocity },
            amountAnomaly: { score: Math.round(amountAnomalyScore * 100) / 100, weight: this.forecastWeights.amountAnomaly },
            timePatternAnomaly: { score: Math.round(timeAnomalyScore * 100) / 100, weight: this.forecastWeights.timePatternAnomaly },
            newPayeeRatio: { score: Math.round(newPayeeScore * 100) / 100, weight: this.forecastWeights.newPayeeRatio },
            weekendFactor: { score: Math.round(weekendRiskScore * 100) / 100, weight: this.forecastWeights.weekendFactor },
            recentFraudReports: { score: Math.round(fraudReportScore * 100) / 100, weight: this.forecastWeights.recentFraudReports }
          },
          generatedAt: new Date().toISOString(),
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      };

    } catch (error) {
      console.error('Error generating fraud forecast:', error);
      return {
        success: false,
        error: 'Failed to generate forecast',
        forecast: null
      };
    }
  }

  /**
   * Calculate transaction velocity score
   * Higher velocity = higher risk
   */
  _calculateVelocityScore(transactions) {
    if (transactions.length === 0) return 30; // Base risk for new users

    // Check for recent burst (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentBurst = transactions.filter(tx => new Date(tx.timestamp) >= oneDayAgo).length;
    
    // Check for weekly burst (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyCount = transactions.filter(tx => new Date(tx.timestamp) >= sevenDaysAgo).length;

    // High-amount transactions (above 10,000)
    const highAmountCount = transactions.filter(tx => tx.amount > 10000).length;
    const highAmountRatio = highAmountCount / transactions.length;

    // Burst activity scoring
    if (recentBurst >= 5) return 90; // 5+ in last 24 hours
    if (recentBurst >= 3) return 75; // 3-4 in last 24 hours
    if (weeklyCount >= 10) return 70; // 10+ in last week
    if (weeklyCount >= 7) return 60;  // 7-9 in last week
    
    // High amount ratio scoring
    if (highAmountRatio > 0.7) return 65; // 70% are high amounts
    if (highAmountRatio > 0.5) return 55; // 50% are high amounts
    if (highAmountRatio > 0.3) return 45; // 30% are high amounts

    // Default based on total count
    if (transactions.length > 20) return 50;
    if (transactions.length > 10) return 40;
    return 30;
  }

  /**
   * Calculate amount anomaly score
   * Unusual transaction amounts = higher risk
   */
  _calculateAmountAnomalyScore(transactions) {
    if (transactions.length < 2) return 30;

    const amounts = transactions.map(tx => tx.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const maxAmount = Math.max(...amounts);
    
    // Check for sudden spikes
    const recentTransactions = transactions.slice(0, 5); // Last 5 transactions
    const recentAvg = recentTransactions.reduce((sum, tx) => sum + tx.amount, 0) / recentTransactions.length;
    
    // If recent average is 3x+ higher than overall average = anomaly
    const spikeRatio = avgAmount > 0 ? recentAvg / avgAmount : 1;
    
    // Check for very high amounts (above 50k)
    const veryHighAmounts = transactions.filter(tx => tx.amount > 50000).length;
    const veryHighRatio = veryHighAmounts / transactions.length;

    // Score based on anomalies
    if (spikeRatio > 5 || veryHighRatio > 0.5) return 85; // Major spike
    if (spikeRatio > 3 || veryHighRatio > 0.3) return 70; // Significant spike
    if (spikeRatio > 2 || veryHighRatio > 0.2) return 55; // Moderate spike
    if (maxAmount > 100000) return 60; // Single very high transaction
    if (maxAmount > 50000) return 45;
    
    return 25;
  }

  /**
   * Calculate time pattern anomaly score
   * Unusual transaction times = higher risk
   */
  _calculateTimeAnomalyScore(transactions) {
    if (transactions.length < 5) return 40; // Not enough data

    // Count late-night transactions (11 PM - 5 AM)
    const lateNightTransactions = transactions.filter(tx => {
      const hour = new Date(tx.timestamp).getHours();
      return hour >= 23 || hour <= 5;
    });

    const lateNightRatio = lateNightTransactions.length / transactions.length;

    if (lateNightRatio > 0.5) return 80;
    if (lateNightRatio > 0.3) return 60;
    if (lateNightRatio > 0.1) return 40;
    return 20;
  }

  /**
   * Calculate new payee ratio score
   * More new payees = higher risk
   */
  _calculateNewPayeeScore(transactions) {
    if (transactions.length === 0) return 30;

    // Get unique payees
    const uniquePayees = new Set(transactions.map(tx => tx.recipientVPA || tx.payeeUpiId));
    const totalTransactions = transactions.length;

    // Calculate ratio of transactions to unique payees
    // Higher ratio = more repeated payees = lower risk
    const payeeRatio = uniquePayees.size / totalTransactions;

    if (payeeRatio > 0.8) return 80; // 80% are new payees
    if (payeeRatio > 0.6) return 60;
    if (payeeRatio > 0.4) return 40;
    return 20;
  }

  /**
   * Calculate weekend risk score
   */
  _calculateWeekendRisk() {
    const today = new Date().getDay();
    const daysUntilWeekend = this._getDaysUntilWeekend(today);
    
    // Higher risk as weekend approaches
    if (daysUntilWeekend === 0) return 70; // It's weekend
    if (daysUntilWeekend <= 2) return 50; // Weekend approaching
    return 30;
  }

  /**
   * Calculate fraud report score from user's circle/community
   */
  _calculateFraudReportScore(feedbackEntries) {
    // Count confirmed fraud cases in user's recent history
    const confirmedFrauds = feedbackEntries.filter(f => f.feedbackType === 'CONFIRM_FRAUD');
    
    if (confirmedFrauds.length >= 3) return 90;
    if (confirmedFrauds.length >= 2) return 70;
    if (confirmedFrauds.length >= 1) return 50;
    return 20;
  }

  /**
   * Apply temporal multipliers (salary day, festivals, etc.)
   */
  _applyTemporalMultipliers(baseScore) {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const month = now.getMonth();
    const dayOfWeek = now.getDay();

    let multiplier = 1.0;

    // Salary day multiplier
    if (dayOfMonth <= 2) {
      multiplier *= this.fraudPatterns.salaryDay.multiplier;
    }

    // Festival season multiplier
    if (this.fraudPatterns.festivalSeason.months.includes(month)) {
      multiplier *= this.fraudPatterns.festivalSeason.multiplier;
    }

    // Weekend multiplier
    if (this.fraudPatterns.weekend.days.includes(dayOfWeek)) {
      multiplier *= this.fraudPatterns.weekend.multiplier;
    }

    return baseScore * multiplier;
  }

  /**
   * Generate daily forecast for next 7 days
   */
  _generateDailyForecast(baseScore, transactions) {
    const dailyForecast = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      const dayOfWeek = date.getDay();
      const isWeekend = this.highRiskDays.includes(dayOfWeek);
      
      // Weekend days have higher risk
      let dayRisk = baseScore;
      if (isWeekend) {
        dayRisk = Math.min(dayRisk * 1.2, 100);
      }

      dailyForecast.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        riskScore: Math.round(dayRisk),
        riskLevel: this._getRiskLevel(dayRisk),
        isWeekend
      });
    }

    return dailyForecast;
  }

  /**
   * Generate risk assessment message and tips
   */
  _generateRiskAssessment(forecastScore, dailyForecast) {
    const maxDailyRisk = Math.max(...dailyForecast.map(d => d.riskScore));
    const highRiskDays = dailyForecast.filter(d => d.riskScore >= 60);

    let riskLevel, message, tips;

    if (forecastScore >= 70) {
      riskLevel = 'CRITICAL';
      message = `You're ${forecastScore}% likely to be targeted by fraud this week. ${highRiskDays.length} high-risk days detected.`;
      tips = [
        'Enable 2FA immediately',
        'Verify all UPI IDs before paying',
        'Avoid large transactions on weekends',
        'Report suspicious VPAs to your circle'
      ];
    } else if (forecastScore >= 50) {
      riskLevel = 'HIGH';
      message = `You're ${forecastScore}% likely to be targeted. Stay cautious on ${highRiskDays.map(d => d.dayName).join(', ')}.`;
      tips = [
        'Double-check recipient details',
        'Use trusted payees only',
        'Set transaction limits',
        'Enable payment notifications'
      ];
    } else if (forecastScore >= 30) {
      riskLevel = 'MEDIUM';
      message = `Moderate risk (${forecastScore}%). Some unusual patterns detected in your transactions.`;
      tips = [
        'Review your recent transactions',
        'Be cautious with new payees',
        'Avoid sharing UPI PIN'
      ];
    } else {
      riskLevel = 'LOW';
      message = `Low risk (${forecastScore}%). Your transaction patterns look safe.`;
      tips = [
        'Continue safe practices',
        'Update your security settings',
        'Share fraud alerts with your circle'
      ];
    }

    return { riskLevel, message, tips };
  }

  /**
   * Get days until weekend
   */
  _getDaysUntilWeekend(currentDay) {
    if (currentDay === 5) return 0; // Friday
    if (currentDay === 6) return 0; // Saturday
    if (currentDay === 0) return 0; // Sunday
    if (currentDay === 4) return 1; // Thursday
    return 5 - currentDay;
  }

  /**
   * Get risk level from score
   */
  _getRiskLevel(score) {
    if (score >= 70) return 'CRITICAL';
    if (score >= 50) return 'HIGH';
    if (score >= 30) return 'MEDIUM';
    return 'LOW';
  }
}

module.exports = new FraudForecastService();
