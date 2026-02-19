import { recommendations } from "../data/recommendationData.jsx";

/**
 * Generates personalized security recommendations based on risk factors
 * @param {Array<string>} riskFactors - Array of risk factor identifiers
 * @param {number} maxRecommendations - Maximum number of recommendations to return (default: 3)
 * @returns {Array<Object>} Array of recommendation objects
 */
export function generateRecommendations(riskFactors = [], maxRecommendations = 3) {
  // Ensure riskFactors is always an array
  const safeRiskFactors = Array.isArray(riskFactors) ? riskFactors : [];
  
  return safeRiskFactors
    .map(factor => {
      const rec = recommendations[factor];
      return rec ? { ...rec, key: factor } : null;
    })
    .filter(Boolean) // Remove undefined entries
    .slice(0, maxRecommendations);
}

/**
 * Gets all available recommendations
 * @returns {Object} All recommendations from the catalog
 */
export function getAllRecommendations() {
  return recommendations;
}

/**
 * Gets a specific recommendation by key
 * @param {string} key - Recommendation key
 * @returns {Object|null} Recommendation object or null if not found
 */
export function getRecommendation(key) {
  return recommendations[key] || null;
}

/**
 * Analyzes risk score and returns appropriate risk factors
 * @param {number} riskScore - Risk score (0-100)
 * @returns {Array<string>} Array of risk factor identifiers
 */
export function analyzeRiskScore(riskScore) {
  const factors = [];
  
  if (riskScore >= 80) {
    factors.push('enable2FA', 'blockVPA', 'newDevice', 'highAmount');
  } else if (riskScore >= 60) {
    factors.push('highAmount', 'newDevice', 'enable2FA');
  } else if (riskScore >= 40) {
    factors.push('newPayee', 'highAmount', 'unusualTime');
  } else if (riskScore >= 20) {
    factors.push('newLocation', 'suspiciousPattern');
  }
  
  return factors;
}

/**
 * Gets recommendations based on transaction context
 * @param {Object} context - Transaction context
 * @returns {Array<Object>} Array of recommendation objects
 */
export function getContextualRecommendations(context = {}) {
  const factors = [];
  
  const {
    isNewPayee,
    isHighAmount,
    isUnusualTime,
    isNewDevice,
    isNewLocation,
    hasSuspiciousPattern,
    riskScore
  } = context;
  
  // Priority-based factor detection
  if (hasSuspiciousPattern) factors.push('suspiciousPattern');
  if (isNewPayee) factors.push('newPayee');
  if (isHighAmount) factors.push('highAmount');
  if (isNewDevice) factors.push('newDevice');
  if (isUnusualTime) factors.push('unusualTime');
  if (isNewLocation) factors.push('newLocation');
  
  // Add general security recommendations for high risk
  if (riskScore && riskScore >= 70) {
    factors.push('enable2FA', 'blockVPA');
  }
  
  return generateRecommendations(factors);
}
