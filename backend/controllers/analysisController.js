// backend/controllers/analysisController.js
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const BlacklistWhitelist = require('../models/BlacklistWhitelist');
const NotificationService = require('../services/NotificationService');
const RiskScoringEngine = require('../services/RiskScoringEngine');
const DecisionEngine = require('../services/DecisionEngine');
const mongoose = require('mongoose');

/**
 * Enhanced Transaction Analysis with Risk Scoring & Decision Engine
 */
exports.analyzeTransaction = async (req, res) => {
  try {
    const {
      amount,
      recipientVPA,
      recipientName,
      recipientPhone,
      deviceId,
      location,
      timestamp,
      recipient // Support old format with recipient object
    } = req.body;

    const userId = req.user._id;

    // Handle both old and new data formats
    const finalRecipientVPA = recipientVPA || recipient?.upi;
    const finalRecipientName = recipientName || recipient?.name;
    const finalDeviceId = deviceId || 'unknown-device';

    console.log('🔬 Starting Enhanced Risk Analysis:', {
      userId,
      amount,
      recipientVPA: finalRecipientVPA,
      timestamp: timestamp || new Date()
    });

    // Step 1: Get user's transaction history
    const userHistory = await getUserTransactionHistory(userId);

    // Step 2: Fetch blacklist and whitelist
    const blacklist = await BlacklistWhitelist.getActiveList('blacklist');
    const whitelist = await BlacklistWhitelist.find({
      type: 'whitelist',
      reportedBy: userId,
      isActive: true
    });

    console.log(`📋 Lists loaded: ${blacklist.length} blacklist, ${whitelist.length} whitelist entries`);

    // Step 3: Calculate risk score using RiskScoringEngine
    const riskAnalysis = await RiskScoringEngine.calculateRiskScore(
      {
        amount,
        recipientVPA: finalRecipientVPA,
        recipientName: finalRecipientName,
        recipientPhone,
        deviceId: finalDeviceId,
        location,
        timestamp: timestamp || new Date(),
        userId
      },
      userHistory,
      blacklist,
      whitelist
    );

    console.log('📊 Risk Analysis Complete:', {
      score: riskAnalysis.totalScore,
      level: riskAnalysis.riskLevel,
      decision: riskAnalysis.decision
    });

    // Step 4: Make decision using DecisionEngine
    const decision = DecisionEngine.makeDecision(riskAnalysis);

    console.log('🎯 Decision Made:', decision.action);

    // Step 5: Save transaction record
    const transaction = new Transaction({
      userId,
      amount,
      recipientVPA: finalRecipientVPA,
      recipientName: finalRecipientName,
      recipientPhone,
      deviceId: finalDeviceId,
      location,
      riskScore: riskAnalysis.totalScore,
      riskLevel: riskAnalysis.riskLevel,
      riskFactors: riskAnalysis.riskFactors,
      decision: decision.action,
      decisionMetadata: decision.metadata,
      status: decision.action === 'BLOCK' ? 'blocked' : 
              decision.action === 'DELAY' ? 'pending' : 'pending',
      createdAt: timestamp || new Date()
    });

    await transaction.save();

    // Step 6: Send notifications based on decision
    if (['BLOCK', 'DELAY', 'WARN'].includes(decision.action)) {
      const user = await User.findById(userId);
      if (user) {
        const alertMessage = DecisionEngine.generateAlertMessage(decision, {
          amount,
          recipientVPA: finalRecipientVPA
        });
        await NotificationService.sendFraudAlert(user, {
          amount,
          riskScore: riskAnalysis.totalScore,
          action: decision.action,
          message: alertMessage
        });
      }
    }

    // Step 7: Return comprehensive response
    res.status(200).json({
      success: true,
      data: {
        transactionId: transaction._id,
        riskScore: riskAnalysis.totalScore,
        riskLevel: riskAnalysis.riskLevel,
        decision: decision.action,
        title: decision.title,
        message: decision.message,
        color: decision.color,
        icon: decision.icon,
        canProceed: decision.canProceed,
        isBlocked: decision.isBlocked,
        actionRequired: decision.actionRequired,
        metadata: decision.metadata,
        riskFactors: riskAnalysis.riskFactors,
        detailedReasons: riskAnalysis.detailedReasons,
        breakdown: riskAnalysis.breakdown,
        timestamp: decision.timestamp
      }
    });

  } catch (error) {
    console.error('❌ Analysis Controller Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze transaction',
      error: error.message
    });
  }
};

/**
 * Get user's transaction history and statistics
 */
async function getUserTransactionHistory(userId) {
  try {
    const transactions = await Transaction.find({
      userId,
      status: 'completed',
      createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
    }).sort({ createdAt: -1 });

    if (transactions.length === 0) {
      return {
        count: 0,
        averageAmount: 5000,
        maxAmount: 10000,
        commonLocation: null,
        knownPayees: []
      };
    }

    const amounts = transactions.map(t => t.amount);
    const averageAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const maxAmount = Math.max(...amounts);
    const knownPayees = [...new Set(transactions.map(t => t.recipientVPA))];

    // Find most common location
    const locationCounts = {};
    transactions.forEach(t => {
      if (t.location?.city) {
        locationCounts[t.location.city] = (locationCounts[t.location.city] || 0) + 1;
      }
    });

    const commonLocation = Object.keys(locationCounts).length > 0
      ? Object.keys(locationCounts).reduce((a, b) => locationCounts[a] > locationCounts[b] ? a : b)
      : null;

    return {
      count: transactions.length,
      averageAmount: Math.round(averageAmount),
      maxAmount,
      commonLocation,
      knownPayees
    };
  } catch (error) {
    console.error('Error getting user history:', error);
    return {
      count: 0,
      averageAmount: 5000,
      maxAmount: 10000,
      commonLocation: null,
      knownPayees: []
    };
  }
}

/**
 * Get risk threshold configuration (admin only)
 */
exports.getThresholds = async (req, res) => {
  try {
    const thresholds = DecisionEngine.getThresholds();
    res.json({
      success: true,
      data: thresholds
    });
  } catch (error) {
    console.error('Error getting thresholds:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get thresholds'
    });
  }
};

/**
 * Update risk thresholds (admin only)
 */
exports.updateThresholds = async (req, res) => {
  try {
    const newThresholds = req.body;
    const updated = DecisionEngine.updateThresholds(newThresholds);
    
    res.json({
      success: true,
      message: 'Thresholds updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating thresholds:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update thresholds'
    });
  }
};

/**
 * Delay a transaction by specified minutes (user-initiated)
 * Body: { transactionId, delayMinutes }
 */
exports.delayTransaction = async (req, res) => {
  try {
    const { transactionId, delayMinutes = 5 } = req.body;
    const userId = req.user._id;

    if (!transactionId) {
      return res.status(400).json({ success: false, message: 'transactionId is required' });
    }

    // Find transaction by _id or custom transactionId
    const query = { userId };
    if (mongoose.Types.ObjectId.isValid(transactionId)) {
      query._id = new mongoose.Types.ObjectId(transactionId);
    } else {
      query.transactionId = transactionId;
    }
    const tx = await Transaction.findOne(query);

    if (!tx) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const delaySeconds = Math.max(1, Math.round(delayMinutes * 60));
    const expiresAt = new Date(Date.now() + delaySeconds * 1000);

    tx.status = 'delayed';
    tx.decision = 'DELAY';
    tx.decisionMetadata = {
      ...(tx.decisionMetadata || {}),
      delayMinutes: Math.round(delaySeconds / 60),
      delaySeconds,
      expiresAt,
      requestedByUser: true
    };

    await tx.save();

    // Notify user
    const user = await User.findById(userId);
    if (user) {
      const message = DecisionEngine.getActionDescription('DELAY', { delayMinutes: Math.round(delaySeconds / 60) });
      await NotificationService.sendFraudAlert(user, {
        amount: tx.amount,
        riskScore: tx.riskScore,
        action: 'DELAY',
        message
      });
    }

    return res.json({
      success: true,
      message: 'Transaction delayed',
      data: {
        transactionId: tx._id,
        status: tx.status,
        decision: tx.decision,
        decisionMetadata: tx.decisionMetadata
      }
    });
  } catch (error) {
    console.error('❌ Delay Transaction Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delay transaction', error: error.message });
  }
};

/**
 * Block a transaction immediately (user-initiated)
 * Body: { transactionId, reason }
 */
exports.blockTransaction = async (req, res) => {
  try {
    const { transactionId, reason = 'User-initiated block from UI' } = req.body;
    const userId = req.user._id;

    if (!transactionId) {
      return res.status(400).json({ success: false, message: 'transactionId is required' });
    }

    const query2 = { userId };
    if (mongoose.Types.ObjectId.isValid(transactionId)) {
      query2._id = new mongoose.Types.ObjectId(transactionId);
    } else {
      query2.transactionId = transactionId;
    }
    const tx = await Transaction.findOne(query2);

    if (!tx) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    tx.status = 'blocked';
    tx.decision = 'BLOCK';
    tx.isBlocked = true;
    tx.blockedReason = reason;
    tx.decisionMetadata = {
      ...(tx.decisionMetadata || {}),
      blockedByUser: true,
      reason
    };

    await tx.save();

    // Notify user
    const user = await User.findById(userId);
    if (user) {
      const message = DecisionEngine.getActionDescription('BLOCK', { permanent: false });
      await NotificationService.sendFraudAlert(user, {
        amount: tx.amount,
        riskScore: tx.riskScore,
        action: 'BLOCK',
        message
      });
    }

    return res.json({
      success: true,
      message: 'Transaction blocked',
      data: {
        transactionId: tx._id,
        status: tx.status,
        decision: tx.decision,
        decisionMetadata: tx.decisionMetadata
      }
    });
  } catch (error) {
    console.error('❌ Block Transaction Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to block transaction', error: error.message });
  }
};