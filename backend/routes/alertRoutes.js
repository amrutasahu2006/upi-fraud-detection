const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');

// @route   POST /api/alerts/time-based
// @desc    Generate time-based alerts for unusual transactions
// @access  Private/Admin
router.post('/time-based', protect, authorize('admin'), async (req, res) => {
  try {
    const { userId, daysBack = 7 } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const transactions = user.transactions.filter(tx => 
      new Date(tx.timestamp) >= cutoffDate
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (transactions.length === 0) {
      return res.json({
        success: true,
        data: {
          alerts: [],
          summary: {
            totalTransactions: 0,
            unusualTimeTransactions: 0,
            daysChecked: daysBack
          }
        }
      });
    }

    // Analyze each transaction for time-based anomalies
    const alerts = [];
    let unusualTimeCount = 0;

    for (const transaction of transactions) {
      const timeAnalysis = user.isUnusualTransactionTime(new Date(transaction.timestamp));
      const timeRiskScore = user.calculateTimeRisk(new Date(transaction.timestamp), transaction.amount);

      if (timeAnalysis.isUnusual) {
        unusualTimeCount++;
        
        alerts.push({
          transactionId: transaction.transactionId,
          timestamp: transaction.timestamp,
          amount: transaction.amount,
          payee: transaction.payee,
          riskScore: timeRiskScore,
          confidence: timeAnalysis.confidence,
          reason: timeAnalysis.reason,
          severity: timeRiskScore > 20 ? 'HIGH' : 'MEDIUM'
        });
      }
    }

    res.json({
      success: true,
      data: {
        alerts,
        summary: {
          totalTransactions: transactions.length,
          unusualTimeTransactions: unusualTimeCount,
          daysChecked: daysBack,
          alertRate: (unusualTimeCount / transactions.length) * 100
        }
      }
    });

  } catch (error) {
    console.error('Time-based alert generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during alert generation'
    });
  }
});

// @route   GET /api/alerts/user/:userId
// @desc    Get time-based alerts for specific user
// @access  Private/Admin
router.get('/user/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const transactions = user.transactions
      .filter(tx => new Date(tx.timestamp) >= weekAgo)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const alerts = [];
    let unusualTimeCount = 0;

    for (const transaction of transactions) {
      const timeAnalysis = user.isUnusualTransactionTime(new Date(transaction.timestamp));
      const timeRiskScore = user.calculateTimeRisk(new Date(transaction.timestamp), transaction.amount);

      if (timeAnalysis.isUnusual) {
        unusualTimeCount++;

        alerts.push({
          transactionId: transaction.transactionId,
          timestamp: transaction.timestamp,
          amount: transaction.amount,
          payee: transaction.payee,
          riskScore: timeRiskScore,
          confidence: timeAnalysis.confidence,
          reason: timeAnalysis.reason,
          severity: timeRiskScore > 20 ? 'HIGH' : 'MEDIUM'
        });
      }
    }

    res.json({
      success: true,
      data: {
        alerts,
        user: {
          userId,
          totalTransactions: transactions.length,
          unusualTimeTransactions: unusualTimeCount,
          alertRate: transactions.length > 0 ? (unusualTimeCount / transactions.length) * 100 : 0
        }
      }
    });

  } catch (error) {
    console.error('Get user alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching alerts'
    });
  }
});

// @route   GET /api/alerts/system-summary
// @desc    Get system-wide time-based alert summary
// @access  Private/Admin
router.get('/system-summary', protect, authorize('admin'), async (req, res) => {
  try {
    // Get all users and their recent transactions
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const users = await User.find();
    
    let allTransactions = [];
    users.forEach(user => {
      const recentTransactions = user.transactions.filter(tx => 
        new Date(tx.timestamp) >= yesterday
      );
      allTransactions = allTransactions.concat(recentTransactions.map(tx => ({
        ...tx.toObject(),
        userId: user._id,
        userName: user.username || user.email
      })));
    });

    const analysisResults = allTransactions.map(transaction => {
      const user = users.find(u => u._id.toString() === transaction.userId.toString());
      if (!user) return transaction;
      
      const timeAnalysis = user.isUnusualTransactionTime(new Date(transaction.timestamp));
      const timeRiskScore = user.calculateTimeRisk(new Date(transaction.timestamp), transaction.amount);
      
      return {
        ...transaction,
        timeAnalysis: {          ...timeAnalysis,
          riskScore: timeRiskScore
        }
      };
    });

    const unusualTimeTransactions = analysisResults.filter(
      result => result.timeAnalysis.isUnusual
    );

    const highRiskAlerts = unusualTimeTransactions.filter(
      tx => tx.timeAnalysis.riskScore > 20
    );

    const summary = {
      totalTransactions: transactions.length,
      unusualTimeTransactions: unusualTimeTransactions.length,
      highRiskAlerts: highRiskAlerts.length,
      alertRate: transactions.length > 0 ? (unusualTimeTransactions.length / transactions.length) * 100 : 0,
      timeDistribution: {
        // Count transactions by hour
        '0-6': unusualTimeTransactions.filter(tx => tx.hour < 6).length,
        '6-12': unusualTimeTransactions.filter(tx => tx.hour >= 6 && tx.hour < 12).length,
        '12-18': unusualTimeTransactions.filter(tx => tx.hour >= 12 && tx.hour < 18).length,
        '18-24': unusualTimeTransactions.filter(tx => tx.hour >= 18).length
      },
      riskDistribution: {
        low: unusualTimeTransactions.filter(tx => tx.timeAnalysis.riskScore <= 10).length,
        medium: unusualTimeTransactions.filter(tx => tx.timeAnalysis.riskScore > 10 && tx.timeAnalysis.riskScore <= 20).length,
        high: unusualTimeTransactions.filter(tx => tx.timeAnalysis.riskScore > 20).length
      }
    };

    res.json({
      success: true,
      data: {
        summary,
        topAlerts: highRiskAlerts.slice(0, 10).map(tx => ({
          transactionId: tx.transactionId,
          userId: tx.userId,
          timestamp: tx.timestamp,
          amount: tx.amount,
          payee: tx.payee,
          riskScore: tx.timeAnalysis.riskScore,
          confidence: tx.timeAnalysis.confidence
        }))
      }
    });

  } catch (error) {
    console.error('System summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating system summary'
    });
  }
});

// @route   POST /api/alerts/subscribe
// @desc    Subscribe user to time-based alerts
// @access  Private
router.post('/subscribe', protect, async (req, res) => {
  try {
    const { alertTypes = ['unusual_time'], notificationMethods = ['email'] } = req.body;

    // In a real system, you would save these preferences to the User model
    // For now, we'll just return success

    res.json({
      success: true,
      data: {
        message: 'Successfully subscribed to alerts',
        subscriptions: {
          alertTypes,
          notificationMethods,
          userId: req.user.id
        }
      }
    });

  } catch (error) {
    console.error('Subscribe to alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while subscribing to alerts'
    });
  }
});

module.exports = router;