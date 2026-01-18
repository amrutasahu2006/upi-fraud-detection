const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// @route   POST /api/transactions/analyze
// @desc    Analyze transaction risk in real-time using AI-driven behavior fingerprinting
// @access  Private
router.post('/analyze', protect, async (req, res) => {
  try {
    const {
      amount,
      recipient, // object with name, upi
      note,
      timestamp = new Date().toISOString(),
      location, // object with lat, long, etc.
      deviceId, // string
      isHighAmount, // from frontend
      isUnusualTime // from frontend
    } = req.body;

    // --- Basic Validation ---
    if (!amount || !recipient || !recipient.upi) {
      return res.status(400).json({ success: false, message: 'Amount and recipient UPI ID are required' });
    }
    if (!deviceId) {
      return res.status(400).json({ success: false, message: 'Device ID is required for security analysis' });
    }

    // --- Get User ---
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // --- Device Analysis (with defensive check) ---
    if (!user.knownDevices) {
      user.knownDevices = [];
    }
    const isNewDevice = !user.knownDevices.includes(deviceId);
    if (isNewDevice) {
      user.knownDevices.push(deviceId);
      // Keep list to a reasonable size, e.g., 10
      if (user.knownDevices.length > 10) {
        user.knownDevices.shift();
      }
    }

    // --- Prepare Data for Model Methods ---
    const transactionDataForAnalysis = {
      amount: parseFloat(amount),
      payee: recipient.name,
      payeeUpiId: recipient.upi,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      isNewDevice, // Use calculated value
      location, // Pass full location object
      // Pass other frontend-detected factors if needed by comprehensive analysis
      isHighAmount,
      isUnusualTime,
      deviceInfo: { deviceId }
    };

    // --- Comprehensive Risk Calculation ---
    const comprehensiveRisk = await user.calculateComprehensiveRisk(transactionDataForAnalysis);

    // --- Add Transaction to User History ---
    const savedTransaction = user.addTransaction({
      ...transactionDataForAnalysis,
      riskScore: comprehensiveRisk.totalRiskScore,
      riskFactors: comprehensiveRisk.riskFactors,
      status: comprehensiveRisk.shouldBlock ? 'blocked' : 'completed',
      blockedReason: comprehensiveRisk.shouldBlock ? 'High risk score detected by automated system.' : ''
    });

    // --- Save User (updates transaction history and known devices) ---
    await user.save();

    // --- Prepare Response ---
    let riskLevel = "LOW";
    if (comprehensiveRisk.totalRiskScore >= 80) riskLevel = "CRITICAL";
    else if (comprehensiveRisk.totalRiskScore >= 60) riskLevel = "HIGH";
    else if (comprehensiveRisk.totalRiskScore >= 40) riskLevel = "MEDIUM";

    const analysisResult = {
      transactionId: savedTransaction.transactionId,
      riskScore: comprehensiveRisk.totalRiskScore,
      riskLevel,
      riskFactors: comprehensiveRisk.riskFactors,
      shouldBlock: comprehensiveRisk.shouldBlock,
      shouldWarn: comprehensiveRisk.totalRiskScore >= 40,
      timestamp: new Date().toISOString(),
      analysis: {
        ...comprehensiveRisk.analysis,
        // Override device analysis with our calculated value
        device: {
          isNewDevice,
          riskScore: isNewDevice ? 25 : 0
        },
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
      message: 'Server error during transaction analysis',
      error: {
        message: error.message,
        stack: error.stack,
      }
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