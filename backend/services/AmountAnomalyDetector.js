/**
 * Amount Anomaly Detector Service
 * AI-driven amount anomaly detection using user's transaction history
 * Learns user's typical transaction amounts and detects deviations
 */
class AmountAnomalyDetector {
  constructor() {
    this.minTransactionsForAnalysis = 10;
  }

  /**
   * Analyze amount patterns for a user
   * @param {Array} transactions - User's transaction history
   * @returns {Object} Amount pattern analysis
   */
  analyzeAmountPatterns(transactions) {
    if (!transactions || transactions.length < this.minTransactionsForAnalysis) {
      return {
        hasEnoughData: false,
        averageAmount: 0,
        medianAmount: 0,
        typicalRange: { min: 0, max: 0 },
        standardDeviation: 0,
        confidence: 0
      };
    }

    const amounts = transactions.map(tx => tx.amount).sort((a, b) => a - b);
    const n = amounts.length;

    // Calculate basic statistics
    const sum = amounts.reduce((a, b) => a + b, 0);
    const averageAmount = sum / n;
    const medianAmount = n % 2 === 0
      ? (amounts[n/2 - 1] + amounts[n/2]) / 2
      : amounts[Math.floor(n/2)];

    // Calculate standard deviation
    const variance = amounts.reduce((acc, amount) => acc + Math.pow(amount - averageAmount, 2), 0) / n;
    const standardDeviation = Math.sqrt(variance);

    // Calculate typical range (mean ± 2 standard deviations, but not below 0)
    const typicalMin = Math.max(0, averageAmount - 2 * standardDeviation);
    const typicalMax = averageAmount + 2 * standardDeviation;

    // Calculate confidence based on data volume and consistency
    const coefficientOfVariation = standardDeviation / averageAmount;
    const confidence = Math.min(n / 50, 1) * (1 - Math.min(coefficientOfVariation, 1));

    return {
      hasEnoughData: true,
      averageAmount,
      medianAmount,
      typicalRange: { min: typicalMin, max: typicalMax },
      standardDeviation,
      confidence,
      totalTransactions: n
    };
  }

  /**
   * Detect if a transaction amount is anomalous
   * @param {number} amount - Transaction amount to check
   * @param {Array} userTransactions - User's transaction history
   * @returns {Object} Anomaly detection result
   */
  detectAnomaly(amount, userTransactions) {
    const patterns = this.analyzeAmountPatterns(userTransactions);

    if (!patterns.hasEnoughData) {
      return {
        isAnomalous: false,
        confidence: 0,
        reason: "Insufficient transaction history for amount analysis",
        deviation: 0,
        patterns
      };
    }

    // Calculate deviation from mean in standard deviations
    const deviation = Math.abs(amount - patterns.averageAmount) / patterns.standardDeviation;

    // Determine if anomalous based on deviation and amount thresholds
    let isAnomalous = false;
    let reason = "Amount within typical range";

    if (deviation > 3) {
      isAnomalous = true;
      reason = `Amount deviates significantly from average (${deviation.toFixed(1)} standard deviations)`;
    } else if (amount > patterns.typicalRange.max) {
      isAnomalous = true;
      reason = `Amount exceeds typical maximum (₹${patterns.typicalRange.max.toFixed(0)})`;
    } else if (amount < patterns.typicalRange.min && amount > 0) {
      // Only flag very low amounts if they're unusually low
      if (deviation > 2) {
        isAnomalous = true;
        reason = `Amount is unusually low compared to history`;
      }
    }

    // Special case: Very high amounts (> 5x average) are always suspicious
    if (amount > patterns.averageAmount * 5) {
      isAnomalous = true;
      reason = `Amount is extremely high (${(amount / patterns.averageAmount).toFixed(1)}x average)`;
    }

    return {
      isAnomalous,
      confidence: patterns.confidence,
      reason,
      deviation: deviation,
      patterns,
      riskScore: this.calculateRiskScore(amount, patterns, deviation)
    };
  }

  /**
   * Calculate risk score based on amount anomaly
   * @param {number} amount - Transaction amount
   * @param {Object} patterns - Amount patterns
   * @param {number} deviation - Standard deviation from mean
   * @returns {number} Risk score (0-100)
   */
  calculateRiskScore(amount, patterns, deviation) {
    let riskScore = 0;

    // Base risk from deviation
    if (deviation > 3) riskScore += 30;
    else if (deviation > 2) riskScore += 15;
    else if (deviation > 1.5) riskScore += 5;

    // Risk from exceeding typical range
    if (amount > patterns.typicalRange.max) {
      const excessRatio = amount / patterns.typicalRange.max;
      if (excessRatio > 2) riskScore += 25;
      else if (excessRatio > 1.5) riskScore += 15;
      else riskScore += 10;
    }

    // Risk from extremely high amounts
    const averageMultiplier = amount / patterns.averageAmount;
    if (averageMultiplier > 10) riskScore += 40;
    else if (averageMultiplier > 5) riskScore += 25;
    else if (averageMultiplier > 3) riskScore += 15;

    // Risk from very low amounts (if suspicious)
    if (amount < patterns.typicalRange.min && deviation > 2) {
      riskScore += 10;
    }

    return Math.min(riskScore, 100);
  }

  /**
   * Get amount-based recommendations
   * @param {Object} anomalyResult - Result from detectAnomaly
   * @returns {Array} List of recommendations
   */
  getRecommendations(anomalyResult) {
    const recommendations = [];

    if (anomalyResult.isAnomalous) {
      recommendations.push("Verify transaction amount before proceeding");
      recommendations.push("Check recipient details carefully");

      if (anomalyResult.deviation > 3) {
        recommendations.push("Consider enabling transaction limits");
        recommendations.push("Review recent account activity");
      }

      if (anomalyResult.patterns.averageAmount > 0) {
        recommendations.push(`Your typical transaction amount is ₹${anomalyResult.patterns.averageAmount.toFixed(0)}`);
      }
    }

    return recommendations;
  }
}

module.exports = AmountAnomalyDetector;
