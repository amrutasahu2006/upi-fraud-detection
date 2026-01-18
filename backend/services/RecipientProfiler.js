/**
 * Recipient Profiler Service
 * AI-driven recipient history profiling and anomaly detection
 * Learns user's typical payee patterns and detects unusual recipients
 */
class RecipientProfiler {
  constructor() {
    this.minTransactionsForAnalysis = 5;
  }

  /**
   * Build recipient profiles from transaction history
   * @param {Array} transactions - User's transaction history
   * @returns {Object} Recipient profiles indexed by payeeUpiId
   */
  buildRecipientProfiles(transactions) {
    const profiles = {};

    if (!transactions || transactions.length < this.minTransactionsForAnalysis) {
      return profiles;
    }

    // Group transactions by payee
    const payeeGroups = {};
    transactions.forEach(tx => {
      const key = tx.payeeUpiId;
      if (!payeeGroups[key]) {
        payeeGroups[key] = {
          payeeUpiId: key,
          payeeName: tx.payee,
          transactions: []
        };
      }
      payeeGroups[key].transactions.push(tx);
    });

    // Build profiles for each payee
    Object.values(payeeGroups).forEach(group => {
      const txns = group.transactions;
      const amounts = txns.map(tx => tx.amount);

      profiles[group.payeeUpiId] = {
        payeeUpiId: group.payeeUpiId,
        payeeName: group.payeeName,
        transactionCount: txns.length,
        totalAmount: amounts.reduce((sum, amt) => sum + amt, 0),
        averageAmount: amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length,
        minAmount: Math.min(...amounts),
        maxAmount: Math.max(...amounts),
        lastTransactionDate: new Date(Math.max(...txns.map(tx => new Date(tx.timestamp)))),
        firstTransactionDate: new Date(Math.min(...txns.map(tx => new Date(tx.timestamp)))),
        frequency: this.calculateTransactionFrequency(txns),
        typicalHours: this.calculateTypicalHours(txns),
        riskScore: this.calculatePayeeRiskScore(txns, transactions.length),
        isFrequentPayee: txns.length >= Math.max(3, transactions.length * 0.1), // Top 10% or at least 3 transactions
        category: this.categorizePayee(txns)
      };
    });

    return profiles;
  }

  /**
   * Calculate transaction frequency for a payee
   * @param {Array} payeeTransactions - Transactions for this payee
   * @returns {Object} Frequency analysis
   */
  calculateTransactionFrequency(payeeTransactions) {
    if (payeeTransactions.length < 2) {
      return {
        transactionsPerMonth: 0,
        averageDaysBetween: 0,
        regularityScore: 0
      };
    }

    const sortedTxns = payeeTransactions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const firstDate = new Date(sortedTxns[0].timestamp);
    const lastDate = new Date(sortedTxns[sortedTxns.length - 1].timestamp);
    const totalDays = (lastDate - firstDate) / (1000 * 60 * 60 * 24);

    if (totalDays === 0) {
      return {
        transactionsPerMonth: 0,
        averageDaysBetween: 0,
        regularityScore: 0
      };
    }

    const transactionsPerMonth = (payeeTransactions.length / totalDays) * 30;
    const averageDaysBetween = totalDays / (payeeTransactions.length - 1);

    // Calculate regularity score (0-1) based on consistency
    let regularityScore = 0;
    if (payeeTransactions.length >= 3) {
      const intervals = [];
      for (let i = 1; i < sortedTxns.length; i++) {
        const interval = (new Date(sortedTxns[i].timestamp) - new Date(sortedTxns[i-1].timestamp)) / (1000 * 60 * 60 * 24);
        intervals.push(interval);
      }

      const avgInterval = intervals.reduce((sum, int) => sum + int, 0) / intervals.length;
      const variance = intervals.reduce((sum, int) => sum + Math.pow(int - avgInterval, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);

      regularityScore = Math.max(0, 1 - (stdDev / avgInterval));
    }

    return {
      transactionsPerMonth,
      averageDaysBetween,
      regularityScore
    };
  }

  /**
   * Calculate typical transaction hours for a payee
   * @param {Array} payeeTransactions - Transactions for this payee
   * @returns {Array} Typical hours (0-23)
   */
  calculateTypicalHours(payeeTransactions) {
    const hourCounts = {};
    payeeTransactions.forEach(tx => {
      const hour = tx.hour !== undefined ? tx.hour : new Date(tx.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Get hours with frequency > 20% of max frequency
    const maxCount = Math.max(...Object.values(hourCounts));
    const threshold = maxCount * 0.2;

    return Object.entries(hourCounts)
      .filter(([, count]) => count >= threshold)
      .map(([hour]) => parseInt(hour))
      .sort((a, b) => a - b);
  }

  /**
   * Calculate risk score for a payee based on behavior patterns
   * @param {Array} payeeTransactions - Transactions for this payee
   * @param {number} totalUserTransactions - Total transactions by user
   * @returns {number} Risk score (0-100)
   */
  calculatePayeeRiskScore(payeeTransactions, totalUserTransactions) {
    let riskScore = 0;

    const transactionCount = payeeTransactions.length;
    const frequencyRatio = transactionCount / totalUserTransactions;

    // Risk based on transaction frequency
    if (frequencyRatio < 0.01) { // Very rare payee
      riskScore += 20;
    } else if (frequencyRatio < 0.05) { // Rare payee
      riskScore += 10;
    }

    // Risk based on transaction amounts
    const amounts = payeeTransactions.map(tx => tx.amount);
    const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const maxAmount = Math.max(...amounts);

    // High amount transactions to this payee
    if (maxAmount > 50000) {
      riskScore += 15;
    } else if (maxAmount > 10000) {
      riskScore += 10;
    }

    // Inconsistent amounts (high variance)
    const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / avgAmount;

    if (coefficientOfVariation > 1) {
      riskScore += 10; // Highly variable amounts
    }

    // Recent activity (transactions in last 24 hours)
    const recentTxns = payeeTransactions.filter(tx => {
      const txDate = new Date(tx.timestamp);
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      return txDate >= oneDayAgo;
    });

    if (recentTxns.length > 2) {
      riskScore += 15; // Multiple recent transactions to same payee
    }

    return Math.min(riskScore, 100);
  }

  /**
   * Categorize payee based on transaction patterns
   * @param {Array} payeeTransactions - Transactions for this payee
   * @returns {string} Payee category
   */
  categorizePayee(payeeTransactions) {
    const transactionCount = payeeTransactions.length;
    const amounts = payeeTransactions.map(tx => tx.amount);
    const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;

    // Categorization logic
    if (transactionCount >= 10 && avgAmount < 500) {
      return 'regular_small'; // Regular small payments (utilities, subscriptions)
    } else if (transactionCount >= 5 && avgAmount >= 1000 && avgAmount <= 5000) {
      return 'regular_medium'; // Regular medium payments (shopping, bills)
    } else if (transactionCount >= 3 && avgAmount > 5000) {
      return 'regular_large'; // Regular large payments (rent, investments)
    } else if (transactionCount === 1) {
      return 'one_time'; // One-time payment
    } else if (transactionCount <= 3) {
      return 'occasional'; // Occasional payments
    } else {
      return 'unknown';
    }
  }

  /**
   * Analyze a specific recipient for anomaly detection
   * @param {string} payeeUpiId - Payee UPI ID
   * @param {string} payeeName - Payee name
   * @param {Object} profiles - Recipient profiles
   * @returns {Object} Recipient analysis result
   */
  analyzeRecipient(payeeUpiId, payeeName, profiles) {
    const profile = profiles[payeeUpiId];

    if (!profile) {
      // New payee
      return {
        isNewPayee: true,
        isRarePayee: true,
        isFrequentPayee: false,
        riskScore: 25,
        reason: "New recipient not found in transaction history",
        profile: null,
        recommendations: [
          "Verify recipient details carefully",
          "Check if this is a legitimate payment",
          "Consider the purpose of this transaction"
        ]
      };
    }

    // Existing payee analysis
    const isRarePayee = !profile.isFrequentPayee;
    const riskScore = profile.riskScore;

    let reason = "Known recipient";
    const recommendations = [];

    if (isRarePayee) {
      reason = "Rare recipient (low transaction frequency)";
      recommendations.push("Review transaction carefully - this recipient is not frequently used");
    }

    if (riskScore > 30) {
      recommendations.push("High-risk recipient based on transaction patterns");
    }

    return {
      isNewPayee: false,
      isRarePayee,
      isFrequentPayee: profile.isFrequentPayee,
      riskScore,
      reason,
      profile,
      recommendations
    };
  }

  /**
   * Detect recipient-based anomalies in a transaction
   * @param {string} payeeUpiId - Payee UPI ID
   * @param {string} payeeName - Payee name
   * @param {number} amount - Transaction amount
   * @param {Object} profiles - Recipient profiles
   * @returns {Object} Anomaly detection result
   */
  detectRecipientAnomaly(payeeUpiId, payeeName, amount, profiles) {
    const analysis = this.analyzeRecipient(payeeUpiId, payeeName, profiles);
    const profile = analysis.profile;

    let isAnomalous = false;
    let reason = "Normal recipient pattern";
    let deviation = 0;

    if (analysis.isNewPayee) {
      isAnomalous = true;
      reason = "New recipient";
    } else if (profile) {
      // Check amount deviation from typical amounts for this payee
      const amountDeviation = Math.abs(amount - profile.averageAmount) / profile.averageAmount;
      deviation = amountDeviation;

      if (amountDeviation > 2) {
        isAnomalous = true;
        reason = `Amount significantly deviates from typical amounts to this recipient (${amountDeviation.toFixed(1)}x average)`;
      } else if (amount > profile.maxAmount * 1.5) {
        isAnomalous = true;
        reason = `Amount exceeds maximum historical amount to this recipient by ${(amount / profile.maxAmount).toFixed(1)}x`;
      }

      // Check timing anomaly for this specific payee
      const currentHour = new Date().getHours();
      const isUnusualHour = !profile.typicalHours.includes(currentHour);

      if (isUnusualHour && profile.typicalHours.length > 0) {
        isAnomalous = true;
        reason += " at unusual hour for this recipient";
      }
    }

    return {
      isAnomalous,
      confidence: analysis.isNewPayee ? 1 : 0.8,
      reason,
      deviation,
      analysis,
      riskScore: this.calculateAnomalyRiskScore(analysis, deviation, amount)
    };
  }

  /**
   * Calculate risk score for recipient anomaly
   * @param {Object} analysis - Recipient analysis
   * @param {number} deviation - Amount deviation
   * @param {number} amount - Transaction amount
   * @returns {number} Risk score (0-100)
   */
  calculateAnomalyRiskScore(analysis, deviation, amount) {
    let riskScore = 0;

    if (analysis.isNewPayee) {
      riskScore += 25;
    }

    if (analysis.isRarePayee) {
      riskScore += 15;
    }

    // Amount deviation risk
    if (deviation > 3) riskScore += 20;
    else if (deviation > 2) riskScore += 15;
    else if (deviation > 1.5) riskScore += 10;

    // High amount to new/rare payee
    if ((analysis.isNewPayee || analysis.isRarePayee) && amount > 10000) {
      riskScore += 20;
    }

    return Math.min(riskScore, 100);
  }

  /**
   * Get recipient-based recommendations
   * @param {Object} anomalyResult - Result from detectRecipientAnomaly
   * @returns {Array} List of recommendations
   */
  getRecommendations(anomalyResult) {
    const recommendations = [];

    if (anomalyResult.isAnomalous) {
      recommendations.push("Verify recipient identity and transaction details");

      if (anomalyResult.analysis.isNewPayee) {
        recommendations.push("This appears to be a new recipient - double-check the UPI ID");
        recommendations.push("Consider if this payment is expected");
      }

      if (anomalyResult.analysis.isRarePayee) {
        recommendations.push("This recipient is not frequently used - review carefully");
      }

      if (anomalyResult.deviation > 2) {
        recommendations.push("Transaction amount is unusual for this recipient");
      }
    }

    return recommendations;
  }
}

module.exports = RecipientProfiler;
