// backend/controllers/transactionController.js
const RiskScoringEngine = require('../services/RiskScoringEngine');
const Transaction = require('../models/Transaction');

exports.analyzeTransaction = async (req, res) => {
  try {
    const { amount, payeeUpiId, recipient, location } = req.body;
    const userId = req.user.id; // From 'protect' middleware

    // 1. Run Risk Analysis
    const riskAnalysis = await RiskScoringEngine.calculateRiskScore(
      { ...req.body, userId },
      { averageAmount: 2000 } // You can fetch real history here later
    );

    // 2. Decide status
    let status = 'pending';
    if (riskAnalysis.decision === 'BLOCK') status = 'blocked';
    if (riskAnalysis.decision === 'APPROVE') status = 'completed';

    // 3. Save to DB immediately (Security enforcement)
    const transaction = await Transaction.create({
      userId,
      amount,
      recipientVPA: payeeUpiId,
      recipientName: recipient?.name || 'Unknown',
      riskScore: riskAnalysis.totalScore,
      status: status,
      isBlocked: riskAnalysis.decision === 'BLOCK',
      location: location,
      timestamp: new Date()
    });

    // 4. Send response to frontend
    res.status(200).json({
      success: true,
      data: {
        ...riskAnalysis,
        transactionId: transaction._id,
        status: status,
        detailedReasons: riskAnalysis.detailedReasons
      }
    });

  } catch (error) {
    console.error('Analysis Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};