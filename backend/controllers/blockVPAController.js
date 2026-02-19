const User = require('../models/User');
const BlacklistVPA = require('../models/BlacklistVPA');
const VPACacheService = require('../services/VPACacheService');

/**
 * Block a VPA at user level
 * After 3+ unique users block same VPA → auto-add to global blacklist
 * POST /api/block-vpa
 */
exports.blockVPA = async (req, res) => {
  try {
    const { vpa, name, reason } = req.body;
    const userId = req.user._id;

    if (!vpa) {
      return res.status(400).json({
        success: false,
        message: 'VPA is required'
      });
    }

    const normalizedVPA = vpa.toLowerCase().trim();

    // Check if user already blocked this VPA
    const user = await User.findById(userId);
    const alreadyBlocked = user.blockedVPAs?.some(b => b.vpa === normalizedVPA);

    if (alreadyBlocked) {
      return res.status(400).json({
        success: false,
        message: 'You have already blocked this VPA'
      });
    }

    // Add to user's blocked list
    user.blockedVPAs.push({
      vpa: normalizedVPA,
      name: name || '',
      reason: reason || 'User blocked',
      blockedAt: new Date()
    });

    await user.save();

    // Check how many unique users have blocked this VPA
    const blockCount = await User.countDocuments({
      'blockedVPAs.vpa': normalizedVPA
    });

    console.log(`🔒 VPA ${normalizedVPA} blocked by ${blockCount} users`);
    
    // Debug: List all users who blocked this VPA
    const usersWhoBlocked = await User.find({
      'blockedVPAs.vpa': normalizedVPA
    }).select('username email');
    console.log('Users who blocked:', usersWhoBlocked.map(u => u.username || u.email));

    let escalatedToGlobal = false;

    // Auto-escalate to global blacklist if 3+ users block it
    if (blockCount >= 3) {
      console.log(`🚨 Auto-escalating ${normalizedVPA} to global blacklist!`);
      
      // Check if already in global blacklist
      const existingGlobal = await BlacklistVPA.findOne({ vpa: normalizedVPA });
      
      if (!existingGlobal) {
        // Add to global blacklist
        const globalEntry = new BlacklistVPA({
          vpa: normalizedVPA,
          risk_level: 'high',
          reason: 'suspicious_activity', // Valid enum value
          confidence_score: Math.min(50 + (blockCount * 10), 95), // 50 + 10 per user, max 95
          report_count: blockCount,
          status: 'active',
          fraud_type: 'Community Reported',
          description: `Automatically added after ${blockCount} users blocked this VPA`
        });

        await globalEntry.save();
        console.log(`✅ ${normalizedVPA} saved to global blacklist`);
        
        // Invalidate cache (wrap in try-catch in case Redis is down)
        try {
          await VPACacheService.invalidateVPA(normalizedVPA);
          console.log(`🗑️ Cache invalidated for ${normalizedVPA}`);
        } catch (cacheError) {
          console.warn('⚠️ Cache invalidation failed (non-critical):', cacheError.message);
        }
        
        escalatedToGlobal = true;
      }
    }

    res.json({
      success: true,
      message: escalatedToGlobal 
        ? `VPA blocked and added to global blacklist! ${blockCount} users reported it.`
        : `VPA blocked successfully. ${blockCount} user(s) have blocked it.`,
      data: {
        vpa: normalizedVPA,
        blockCount,
        escalatedToGlobal,
        userBlockedList: user.blockedVPAs
      }
    });

  } catch (error) {
    console.error('❌ Block VPA error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to block VPA',
      error: error.message,
      stack: error.stack
    });
  }
};

/**
 * Unblock a VPA at user level
 * DELETE /api/block-vpa/:vpa
 */
exports.unblockVPA = async (req, res) => {
  try {
    const { vpa } = req.params;
    const userId = req.user._id;

    const normalizedVPA = vpa.toLowerCase().trim();

    const user = await User.findById(userId);
    
    // Remove from blocked list
    user.blockedVPAs = user.blockedVPAs.filter(b => b.vpa !== normalizedVPA);
    await user.save();

    res.json({
      success: true,
      message: 'VPA unblocked successfully',
      data: {
        vpa: normalizedVPA,
        userBlockedList: user.blockedVPAs
      }
    });

  } catch (error) {
    console.error('Unblock VPA error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock VPA',
      error: error.message
    });
  }
};

/**
 * Get user's blocked VPAs
 * GET /api/block-vpa/my-blocks
 */
exports.getMyBlockedVPAs = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('blockedVPAs');

    res.json({
      success: true,
      data: user.blockedVPAs || []
    });

  } catch (error) {
    console.error('Get blocked VPAs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blocked VPAs',
      error: error.message
    });
  }
};

/**
 * Check if VPA is blocked by current user
 * GET /api/block-vpa/check/:vpa
 */
exports.checkUserBlock = async (req, res) => {
  try {
    const { vpa } = req.params;
    const userId = req.user._id;

    const normalizedVPA = vpa.toLowerCase().trim();

    const user = await User.findById(userId).select('blockedVPAs');
    const isBlocked = user.blockedVPAs?.some(b => b.vpa === normalizedVPA);

    res.json({
      success: true,
      data: {
        vpa: normalizedVPA,
        isBlockedByUser: isBlocked || false
      }
    });

  } catch (error) {
    console.error('Check user block error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check block status',
      error: error.message
    });
  }
};

/**
 * Get block statistics for a VPA (admin only)
 * GET /api/block-vpa/stats/:vpa
 */
exports.getVPAStats = async (req, res) => {
  try {
    const { vpa } = req.params;
    const normalizedVPA = vpa.toLowerCase().trim();

    // Count unique users who blocked this VPA
    const blockCount = await User.countDocuments({
      'blockedVPAs.vpa': normalizedVPA
    });

    // Check if in global blacklist
    const globalEntry = await BlacklistVPA.findOne({ vpa: normalizedVPA });

    res.json({
      success: true,
      data: {
        vpa: normalizedVPA,
        userBlockCount: blockCount,
        inGlobalBlacklist: !!globalEntry,
        globalBlacklistData: globalEntry
      }
    });

  } catch (error) {
    console.error('Get VPA stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get VPA stats',
      error: error.message
    });
  }
};
