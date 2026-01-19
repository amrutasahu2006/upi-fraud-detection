// backend/services/RiskAggregatorService.js
const AmountDetector = require('./AmountAnomalyDetector');
const TimeDetector = require('./EnhancedTimeDetector');
const RecipientProfiler = require('./RecipientProfiler');

exports.assessTransactionRisk = async (userId, amount, receiverId) => {
  let riskScore = 0;
  let riskReasons = [];

  // 1. Check Amount Anomaly
  // (Assuming your existing service has a method like 'check')
  const amountRisk = await AmountDetector.analyze(userId, amount); 
  if (amountRisk.isAnomalous) {
    riskScore += 30;
    riskReasons.push("Unusually high amount");
  }

  // 2. Check Time Anomaly
  const timeRisk = await TimeDetector.analyze(userId, new Date());
  if (timeRisk.isSuspicious) {
    riskScore += 20;
    riskReasons.push("Unusual time for transaction");
  }

  // 3. Check Recipient (New or Flagged)
  const recipientRisk = await RecipientProfiler.analyze(userId, receiverId);
  if (recipientRisk.isNewReceiver) {
    riskScore += 25;
    riskReasons.push("New Receiver");
  }
  if (recipientRisk.isFlagged) {
    riskScore += 50; // Critical
    riskReasons.push("Receiver wallet flagged for fraud");
  }

  // Cap score at 100
  riskScore = Math.min(riskScore, 100);

  // Construct the Smart Alert Message
  // Example: "⚠️ New receiver + high amount = 55% fraud risk"
  let alertMessage = "";
  if (riskScore > 0) {
    alertMessage = `⚠️ ${riskReasons.join(" + ")} = ${riskScore}% fraud risk`;
  }

  return {
    riskScore,
    riskReasons,
    alertMessage,
    shouldBlock: riskScore > 80, // Auto-block threshold
    shouldWarn: riskScore > 40   // Warning threshold
  };
};