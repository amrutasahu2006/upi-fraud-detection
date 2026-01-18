const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// @route   POST /api/transactions/analyze
// @desc    Analyze transaction risk in real-time
// @access  Private
router.post('/analyze', protect, async (req, res) => {
  try {
    const {
      amount,
      recipient,
      isNewPayee = false,
      isHighAmount = false,
      isNewDevice = false,
      isNewLocation = false,
      timestamp = new Date().toISOString(),
      purpose = ''
    } = req.body;

    // Validate required fields
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required for risk analysis'
      });
    }

    // Get user for pattern analysis
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Perform time-based analysis using user's embedded methods
    const timeAnalysis = user.isUnusualTransactionTime(new Date(timestamp));
    const timeRiskScore = user.calculateTimeRisk(new Date(timestamp), parseFloat(amount));

    // Calculate risk score based on all factors
    let riskScore = 0;
    const detectedFactors = [];

    if (isNewPayee) {
      riskScore += 25;
      detectedFactors.push("newPayee");
    }

    if (isHighAmount || amount > 10000) {
      riskScore += 30;
      detectedFactors.push("highAmount");
    }

    if (isNewDevice) {
      riskScore += 25;
      detectedFactors.push("newDevice");
    }

    // Add time-based risk
    if (timeAnalysis.isUnusual) {
      riskScore += timeRiskScore;
      detectedFactors.push("unusualTime");
    }

    if (isNewLocation) {
      riskScore += 15;
      detectedFactors.push("newLocation");
    }

    // Add general security recommendations for medium+ risk
    if (riskScore >= 50) {
      detectedFactors.push("enable2FA");
    }

    if (riskScore >= 70) {
      detectedFactors.push("blockVPA");
    }

    // Determine risk level
    let riskLevel = "LOW";
    if (riskScore >= 70) riskLevel = "HIGH";
    else if (riskScore >= 40) riskLevel = "MEDIUM";

    // Prepare analysis result
    const analysisResult = {
      transactionId: `TRX-${Date.now()}`,
      riskScore: Math.min(riskScore, 100),
      riskLevel,
      riskFactors: [...new Set(detectedFactors)], // Remove duplicates
      shouldBlock: riskScore >= 80,
      timestamp: new Date().toISOString(),
      analysis: {
        isNewPayee,
        isHighAmount: amount > 10000,
        isNewDevice,
        isUnusualTime: timeAnalysis.isUnusual,
        isNewLocation,
        amount: parseFloat(amount),
        timeAnalysis: {
          ...timeAnalysis,
          riskScore: timeRiskScore
        }
      }
    };

    res.json({
      success: true,
      data: analysisResult
    });

  } catch (error) {
    console.error('Transaction analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during transaction analysis'
    });
  }
});

// @route   GET /api/transactions/user-patterns
// @desc    Get user's transaction patterns for analysis
// @access  Private
router.get('/user-patterns', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's typical hours
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const typicalHours = user.getTypicalHours();
    const userHistory = user.transactions.filter(tx => tx.status === 'completed');
    
    res.json({
      success: true,
      data: {
        typicalHours,
        totalTransactions: userHistory.length,
        transactionHistory: userHistory.slice(0, 10), // Last 10 transactions
        patterns: {
          lateNightTransactions: userHistory.filter(tx => tx.hour >= 0 && tx.hour <= 5).length,
          businessHourTransactions: userHistory.filter(tx => tx.hour >= 9 && tx.hour <= 17).length,
          weekendTransactions: userHistory.filter(tx => tx.dayOfWeek === 0 || tx.dayOfWeek === 6).length
        }
      }
    });

  } catch (error) {
    console.error('Get user patterns error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user patterns'
    });
  }
});

module.exports = router;