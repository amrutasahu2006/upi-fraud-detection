const User = require('../models/User');
const Transaction = require('../models/Transaction');
const BlacklistWhitelist = require('../models/BlacklistWhitelist');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .select('-password -transactions')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalUsers = await User.countDocuments();

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNext: page * limit < totalUsers,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
};

// Update user role
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

// Toggle user status (activate/deactivate)
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      data: user,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle user status'
    });
  }
};

// Get fraud hotspots data for heatmap
const getFraudHotspots = async (req, res) => {
  try {
    // Get date range (default to last 30 days)
    const daysBack = parseInt(req.query.days) || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Build match conditions based on filters
    const matchConditions = {
      status: 'blocked',
      'location.city': { $exists: true, $ne: null },
      timestamp: { $gte: cutoffDate }
    };

    // Add fraud type filter if specified
    if (req.query.fraudType && req.query.fraudType !== 'all') {
      matchConditions.fraudType = req.query.fraudType;
    }

    // Aggregate fraud data by location (only blocked transactions are considered fraud)
    const fraudData = await Transaction.aggregate([
      {
        $match: matchConditions
      },
      {
        $group: {
          _id: {
            city: '$location.city',
            state: '$location.state'
          },
          fraudCount: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgRiskScore: { $avg: '$riskScore' },
          lat: { $first: '$location.latitude' },
          lon: { $first: '$location.longitude' },
          riskLevels: {
            $push: '$riskLevel'
          }
        }
      },
      {
        $project: {
          city: '$_id.city',
          state: '$_id.state',
          lat: 1,
          lon: 1,
          fraudCount: 1,
          totalAmount: 1,
          avgRiskScore: { $round: [{ $ifNull: ['$avgRiskScore', 0] }, 1] },
          highRiskCount: {
            $size: {
              $filter: {
                input: '$riskLevels',
                cond: { $in: ['$$this', ['HIGH', 'CRITICAL']] }
              }
            }
          }
        }
      },
      {
        $sort: { fraudCount: -1 }
      },
      {
        $limit: 50 // Top 50 fraud hotspots
      }
    ]);

    // Calculate risk level based on fraud count and average risk score
    const processedData = fraudData.map(item => {
      let riskLevel = 'Low';
      if (item.fraudCount > 100 || item.avgRiskScore > 70) {
        riskLevel = 'High';
      } else if (item.fraudCount > 50 || item.avgRiskScore > 50) {
        riskLevel = 'Medium';
      }

      return {
        city: item.city,
        state: item.state,
        lat: item.lat,
        lon: item.lon,
        fraudCount: item.fraudCount,
        totalAmount: item.totalAmount,
        avgRiskScore: item.avgRiskScore,
        riskLevel,
        highRiskCount: item.highRiskCount
      };
    });

    res.status(200).json({
      success: true,
      data: processedData,
      metadata: {
        totalHotspots: processedData.length,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get fraud hotspots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fraud hotspots data'
    });
  }
};

// Get fraud statistics for analytics dashboard
const getFraudStats = async (req, res) => {
  try {
    // Get date range (default to last 30 days)
    const daysBack = parseInt(req.query.days) || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Build match conditions based on filters
    const matchConditions = {
      timestamp: { $gte: cutoffDate }
    };

    // Add fraud type filter if specified
    if (req.query.fraudType && req.query.fraudType !== 'all') {
      matchConditions.fraudType = req.query.fraudType;
    }

    // Aggregate fraud statistics
    const stats = await Transaction.aggregate([
      {
        $match: matchConditions
      },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalFraudAttempts: {
            $sum: {
              $cond: [
                { $gt: ['$riskScore', 0] }, // Transactions that were analyzed for fraud (have risk score > 0)
                1,
                0
              ]
            }
          },
          blockedTransactions: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'blocked'] }, // Only actually blocked transactions
                1,
                0
              ]
            }
          },
          totalAmount: { $sum: '$amount' },
          avgRiskScore: { $avg: '$riskScore' }
        }
      }
    ]);

    const fraudStats = stats[0] || {
      totalTransactions: 0,
      totalFraudAttempts: 0,
      blockedTransactions: 0,
      totalAmount: 0,
      avgRiskScore: null
    };

    // Calculate success rate (blocked transactions / total fraud attempts)
    const successRate = fraudStats.totalFraudAttempts > 0
      ? (fraudStats.blockedTransactions / fraudStats.totalFraudAttempts) * 100
      : 0;

    const response = {
      totalFraudAttempts: fraudStats.totalFraudAttempts,
      blockedTransactions: fraudStats.blockedTransactions,
      successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal
      avgRiskScore: fraudStats.avgRiskScore ? Math.round(fraudStats.avgRiskScore * 10) / 10 : 0, // Round to 1 decimal or 0 if null
      totalTransactions: fraudStats.totalTransactions,
      totalAmount: fraudStats.totalAmount
    };

    res.status(200).json({
      success: true,
      data: response,
      metadata: {
        period: `${daysBack} days`,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get fraud stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fraud statistics'
    });
  }
};

// Get recent fraud activity for analytics dashboard
const getRecentFraudActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent blocked/delayed transactions
    const recentActivity = await Transaction.find({
      status: { $in: ['blocked', 'delayed'] }
    })
    .populate('userId', 'name email')
    .select('amount payee payeeUpiId riskScore riskLevel status timestamp blockedReason')
    .sort({ timestamp: -1 })
    .limit(limit);

    // Format the data for frontend
    const formattedActivity = recentActivity.map(item => ({
      id: item._id,
      date: item.timestamp.toISOString().split('T')[0], // YYYY-MM-DD format
      type: 'Blocked Transaction',
      risk: item.riskScore,
      amount: item.amount,
      payee: item.payee || item.payeeUpiId,
      user: item.userId ? item.userId.name : 'Unknown User',
      reason: item.blockedReason || 'High risk detected'
    }));

    res.status(200).json({
      success: true,
      data: formattedActivity,
      metadata: {
        count: formattedActivity.length,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get recent fraud activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent fraud activity'
    });
  }
};

// Get dashboard summary data
const getDashboardSummary = async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });

    // Transaction statistics (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const totalTransactions = await Transaction.countDocuments({
      timestamp: { $gte: thirtyDaysAgo }
    });
    const blockedTransactions = await Transaction.countDocuments({
      status: 'blocked',
      timestamp: { $gte: thirtyDaysAgo }
    });

    // Fraud trends (last 7 days, daily)
    const fraudTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const blockedCount = await Transaction.countDocuments({
        status: 'blocked',
        timestamp: { $gte: startOfDay, $lte: endOfDay }
      });

      fraudTrends.push({
        date: startOfDay.toISOString().split('T')[0],
        blocked: blockedCount
      });
    }

    // Risk level distribution
    const riskLevels = await Transaction.aggregate([
      { $match: { timestamp: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: '$riskLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    const riskDistribution = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0
    };

    riskLevels.forEach(level => {
      riskDistribution[level._id] = level.count;
    });

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          admins: adminUsers,
          recent: recentUsers
        },
        transactions: {
          total: totalTransactions,
          blocked: blockedTransactions
        },
        fraudTrends,
        riskDistribution
      },
      metadata: {
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard summary'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  toggleUserStatus,
  getFraudHotspots,
  getFraudStats,
  getRecentFraudActivity,
  getDashboardSummary
};
