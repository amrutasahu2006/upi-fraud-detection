const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

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
      deviceInfo
    } = req.body;

    // Validate required fields
    if (!amount || !payee || !payeeUpiId) {
      return res.status(400).json({
        success: false,
        message: 'Amount, payee, and payeeUpiId are required'
      });
    }

    // Generate unique transaction ID
    const transactionId = `TRX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const transactionData = {
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
      }
    };

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const transaction = user.addTransaction(transactionData);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully',
      data: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        payee: transaction.payee,
        timestamp: transaction.timestamp
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
// @desc    Get user transactions
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { limit = 50, offset = 0, startDate, endDate } = req.query;
    
    let query = { userId: req.user.id };
    
    // Date filtering
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    let transactions = user.transactions;
    
    // Apply date filtering
    if (startDate || endDate) {
      transactions = transactions.filter(tx => {
        const txDate = new Date(tx.timestamp);
        let isValid = true;
        if (startDate) isValid = isValid && txDate >= new Date(startDate);
        if (endDate) isValid = isValid && txDate <= new Date(endDate);
        return isValid;
      });
    }
    
    // Sort by timestamp descending
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply pagination
    const total = transactions.length;
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    transactions = transactions.slice(startIndex, endIndex);

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

module.exports = router;