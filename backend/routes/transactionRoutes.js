const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Helper function to generate recommendations based on risk analysis
function generateRecommendations(riskAnalysis) {
  const recommendations = [];

  if (riskAnalysis.totalRiskScore >= 80) {
    recommendations.push("Transaction blocked due to critical risk level");
    recommendations.push("Contact your bank immediately");
  } else if (riskAnalysis.totalRiskScore >= 60) {
    recommendations.push("High risk transaction - verify recipient details");
    recommendations.push("Consider cancelling this transaction");
  } else if (riskAnalysis.totalRiskScore >= 40) {
    recommendations.push("Medium risk detected - double-check transaction details");
  }

  if (riskAnalysis.riskFactors.includes('newPayee')) {
    recommendations.push("New recipient detected - verify UPI ID carefully");
  }

  if (riskAnalysis.riskFactors.includes('amountAnomaly')) {
    recommendations.push("Transaction amount is unusual for your patterns");
  }

  if (riskAnalysis.riskFactors.includes('unusualTime')) {
    recommendations.push("Transaction timing is unusual for your patterns");
  }

  return recommendations;
}

// @route   POST /api/transactions
// @desc    Create new transaction
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      amount,
      payee,
      payeeUpiId,
      purpose,
      timestamp,
      deviceInfo,
      location // Extract location from request body
    } = req.body;

    // Validate required fields
    if (!amount || !payee || !payeeUpiId) {
      return res.status(400).json({
        success: false,
        message: 'Amount, payee, and payeeUpiId are required'
      });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate unique transaction ID
    const transactionId = `TRX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    let transactionData = {
      userId: req.user.id,
      transactionId,
      amount: parseFloat(amount),
      payee,
      payeeUpiId,
      purpose: purpose || '',
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      deviceInfo: deviceInfo || {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.connection.remoteAddress,
        deviceId: req.headers['device-id'] || 'unknown'
      },
      location: location || null // Add location to transaction data
    };
    
    // Perform comprehensive risk analysis
    const riskAnalysis = await user.calculateComprehensiveRisk(transactionData);
    
    // Add risk analysis results to transaction data
    transactionData.riskScore = riskAnalysis.totalRiskScore;
    transactionData.riskFactors = riskAnalysis.riskFactors;
    transactionData.isBlocked = riskAnalysis.shouldBlock;
    transactionData.blockedReason = riskAnalysis.shouldBlock ? 'High risk score' : '';
    
    // If the location was analyzed, add the determined city/state back
    if (riskAnalysis.analysis.locationAnalysis && riskAnalysis.analysis.locationAnalysis.currentLocation) {
        transactionData.location = riskAnalysis.analysis.locationAnalysis.currentLocation;
    }

    const transaction = user.addTransaction(transactionData);
    await user.save();
    
    const recommendations = generateRecommendations(riskAnalysis);

    res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully',
      data: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        payee: transaction.payee,
        timestamp: transaction.timestamp,
        riskAnalysis,
        recommendations
      }
    });

  } catch (error) {
    console.error('Transaction creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while recording transaction'
    });
  }
});

// @route   GET /api/transactions
// @desc    Get user transactions (completed only)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { limit = 50, offset = 0, startDate, endDate } = req.query;
    
    // Fetch all transactions (completed, pending, blocked, etc.)
    let query = { userId: req.user.id };
    
    console.log('🔍 Fetching transactions for userId:', req.user.id.toString());

    // Date filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Fetch from Transaction model (not user.transactions array)
    const Transaction = require('../models/Transaction');
    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    console.log('📋 Fetching ALL transactions for user', req.user.id.toString(), '- Found:', transactions.length);
    if (transactions.length > 0) {
      console.log('📝 First transaction:', {
        id: transactions[0]._id,
        userId: transactions[0].userId.toString(),
        amount: transactions[0].amount,
        status: transactions[0].status,
        recipientVPA: transactions[0].recipientVPA
      });
    }

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transactions'
    });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get specific transaction
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const transaction = user.transactions.find(tx => 
      tx._id.toString() === req.params.id || tx.transactionId === req.params.id
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });

  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transaction'
    });
  }
});

// @route   GET /api/transactions/patterns/:userId
// @desc    Get user transaction patterns (admin only)
// @access  Private/Admin
router.get('/patterns/:userId', protect, async (req, res) => {
  try {
    // Check if user is admin (you'll need to implement admin check)
    // For now, allowing users to see their own patterns
    const targetUserId = req.params.userId;
    
    if (targetUserId !== req.user.id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const patterns = user.transactions.filter(tx => tx.status === 'completed');
    const typicalHours = user.getTypicalHours();

    res.json({
      success: true,
      data: {
        totalTransactions: patterns.length,
        typicalHours,
        recentTransactions: patterns.slice(0, 10)
      }
    });

  } catch (error) {
    console.error('Get patterns error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching patterns'
    });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction (admin only)
// @access  Private/Admin
router.delete('/:id', protect, async (req, res) => {
  try {
    // Check admin permission
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    user.transactions = user.transactions.filter(tx => 
      tx._id.toString() !== req.params.id && tx.transactionId !== req.params.id
    );
    await user.save();

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });

  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting transaction'
    });
  }
});

// @route   POST /api/transactions/confirm/:transactionId
// @desc    Confirm a warned/pending transaction (user proceeds anyway)
// @access  Private
router.post('/confirm/:transactionId', protect, async (req, res) => {
  try {
    const Transaction = require('../models/Transaction');
    
    console.log('✅ Confirming transaction:', req.params.transactionId);
    
    // Find the transaction
    const transaction = await Transaction.findOne({
      _id: req.params.transactionId,
      userId: req.user.id
    });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    // Update status to completed (user proceeded anyway)
    transaction.status = 'completed';
    await transaction.save();
    
    console.log('💾 Transaction confirmed:', {
      transactionId: transaction._id,
      userId: transaction.userId.toString(),
      status: transaction.status
    });
    
    res.json({
      success: true,
      message: 'Transaction confirmed successfully',
      data: transaction
    });
    
  } catch (error) {
    console.error('Confirm transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while confirming transaction'
    });
  }
});

module.exports = router;