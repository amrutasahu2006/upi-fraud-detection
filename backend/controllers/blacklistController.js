const BlacklistVPA = require('../models/BlacklistVPA');
const BlacklistWhitelist = require('../models/BlacklistWhitelist');
const VPACacheService = require('../services/VPACacheService');

/**
 * GET /api/blacklist/check?vpa=xxxxx@paytm
 * Check if a VPA is blacklisted
 */
const checkVPA = async (req, res) => {
  try {
    const { vpa } = req.query;

    if (!vpa) {
      return res.status(400).json({
        success: false,
        message: 'VPA is required'
      });
    }

    const normalizedVPA = vpa.toLowerCase().trim();

    // Step 1: Check whitelist first
    const whitelisted = await BlacklistWhitelist.findOne({
      vpa: normalizedVPA,
      type: 'whitelist',
      isActive: true
    });

    if (whitelisted) {
      return res.json({
        success: true,
        flagged: false,
        whitelisted: true,
        message: 'VPA is whitelisted - trusted account',
        vpa: normalizedVPA
      });
    }

    // Step 2: Check blacklist via cache service
    const result = await VPACacheService.checkVPA(normalizedVPA);

    if (result.flagged) {
      return res.json({
        success: true,
        flagged: true,
        vpa: normalizedVPA,
        risk_level: result.data.risk_level,
        reason: result.data.reason,
        confidence_score: result.data.confidence_score,
        reported_at: result.data.reported_at,
        message: `⚠️ BLOCKED: This VPA has been flagged for ${result.data.reason}`
      });
    }

    // Step 3: VPA is safe
    return res.json({
      success: true,
      flagged: false,
      vpa: normalizedVPA,
      message: 'VPA is safe to use'
    });

  } catch (error) {
    console.error('Check VPA error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking VPA status',
      error: error.message
    });
  }
};

/**
 * POST /api/blacklist/report
 * Report a suspicious VPA (community reporting)
 */
const reportVPA = async (req, res) => {
  try {
    const { vpa, reason, notes } = req.body;
    const userId = req.user?.id;

    if (!vpa || !reason) {
      return res.status(400).json({
        success: false,
        message: 'VPA and reason are required'
      });
    }

    const normalizedVPA = vpa.toLowerCase().trim();

    // Check if VPA is whitelisted (cannot report whitelisted VPAs)
    const whitelisted = await BlacklistWhitelist.findOne({
      identifier: normalizedVPA,
      type: 'whitelist',
      isActive: true
    });

    if (whitelisted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot report a whitelisted VPA'
      });
    }

    // Check if already blacklisted
    let blacklistedVPA = await BlacklistVPA.findOne({ vpa: normalizedVPA });

    if (blacklistedVPA) {
      // Update existing entry
      blacklistedVPA.report_count += 1;
      
      // Increase confidence score based on reports
      blacklistedVPA.confidence_score = Math.min(
        100,
        50 + (blacklistedVPA.report_count * 10)
      );

      // Upgrade risk level based on report count
      if (blacklistedVPA.report_count >= 5 && blacklistedVPA.risk_level !== 'high') {
        blacklistedVPA.risk_level = 'high';
      } else if (blacklistedVPA.report_count >= 3 && blacklistedVPA.risk_level === 'low') {
        blacklistedVPA.risk_level = 'medium';
      }

      // Add reporter info
      if (userId) {
        blacklistedVPA.reporters.push({
          user_id: userId,
          reported_date: new Date(),
          notes: notes || ''
        });
      }

      await blacklistedVPA.save();

      // Invalidate cache
      await VPACacheService.invalidateVPA(normalizedVPA);

      return res.json({
        success: true,
        message: 'Report recorded - VPA already flagged',
        data: {
          vpa: blacklistedVPA.vpa,
          risk_level: blacklistedVPA.risk_level,
          report_count: blacklistedVPA.report_count,
          confidence_score: blacklistedVPA.confidence_score
        }
      });
    }

    // Create new blacklist entry
    blacklistedVPA = new BlacklistVPA({
      vpa: normalizedVPA,
      risk_level: 'low',
      reason: reason,
      report_count: 1,
      confidence_score: 50,
      reporters: userId ? [{
        user_id: userId,
        reported_date: new Date(),
        notes: notes || ''
      }] : [],
      status: 'under_review'
    });

    await blacklistedVPA.save();

    // Invalidate cache
    await VPACacheService.invalidateVPA(normalizedVPA);

    res.status(201).json({
      success: true,
      message: 'VPA reported successfully - under review',
      data: {
        vpa: blacklistedVPA.vpa,
        risk_level: blacklistedVPA.risk_level,
        confidence_score: blacklistedVPA.confidence_score,
        status: blacklistedVPA.status
      }
    });

  } catch (error) {
    console.error('Report VPA error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reporting VPA',
      error: error.message
    });
  }
};

/**
 * GET /api/blacklist/all
 * Get all blacklisted VPAs (admin only)
 */
const getAllBlacklisted = async (req, res) => {
  try {
    const { status, risk_level, limit = 100 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (risk_level) query.risk_level = risk_level;

    const blacklistedVPAs = await BlacklistVPA.find(query)
      .sort({ confidence_score: -1, report_count: -1 })
      .limit(parseInt(limit))
      .select('-reporters');

    res.json({
      success: true,
      count: blacklistedVPAs.length,
      data: blacklistedVPAs
    });

  } catch (error) {
    console.error('Get blacklist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blacklist',
      error: error.message
    });
  }
};

/**
 * PUT /api/blacklist/:id/status
 * Update blacklist status (admin only)
 */
const updateBlacklistStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, risk_level } = req.body;

    const blacklistedVPA = await BlacklistVPA.findById(id);

    if (!blacklistedVPA) {
      return res.status(404).json({
        success: false,
        message: 'Blacklisted VPA not found'
      });
    }

    if (status) blacklistedVPA.status = status;
    if (risk_level) blacklistedVPA.risk_level = risk_level;

    await blacklistedVPA.save();

    // Invalidate cache
    await VPACacheService.invalidateVPA(blacklistedVPA.vpa);

    res.json({
      success: true,
      message: 'Blacklist entry updated',
      data: blacklistedVPA
    });

  } catch (error) {
    console.error('Update blacklist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating blacklist',
      error: error.message
    });
  }
};

/**
 * DELETE /api/blacklist/:id
 * Remove VPA from blacklist (admin only)
 */
const removeFromBlacklist = async (req, res) => {
  try {
    const { id } = req.params;

    const blacklistedVPA = await BlacklistVPA.findById(id);

    if (!blacklistedVPA) {
      return res.status(404).json({
        success: false,
        message: 'Blacklisted VPA not found'
      });
    }

    const vpa = blacklistedVPA.vpa;

    await BlacklistVPA.findByIdAndDelete(id);

    // Invalidate cache
    await VPACacheService.invalidateVPA(vpa);

    res.json({
      success: true,
      message: 'VPA removed from blacklist',
      vpa: vpa
    });

  } catch (error) {
    console.error('Remove blacklist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from blacklist',
      error: error.message
    });
  }
};

/**
 * POST /api/blacklist/batch
 * Add multiple VPAs to blacklist (NPCI feed simulation)
 */
const batchAddBlacklist = async (req, res) => {
  try {
    const { vpas } = req.body;

    if (!Array.isArray(vpas) || vpas.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'VPAs array is required'
      });
    }

    const results = {
      added: [],
      updated: [],
      errors: []
    };

    for (const item of vpas) {
      try {
        const normalizedVPA = item.vpa.toLowerCase().trim();

        let blacklistedVPA = await BlacklistVPA.findOne({ vpa: normalizedVPA });

        if (blacklistedVPA) {
          // Update existing
          blacklistedVPA.risk_level = item.risk_level || blacklistedVPA.risk_level;
          blacklistedVPA.reason = item.reason || blacklistedVPA.reason;
          blacklistedVPA.status = 'active';
          await blacklistedVPA.save();
          results.updated.push(normalizedVPA);
        } else {
          // Create new
          blacklistedVPA = new BlacklistVPA({
            vpa: normalizedVPA,
            risk_level: item.risk_level || 'medium',
            reason: item.reason || 'fraud',
            confidence_score: item.confidence_score || 75,
            status: 'active'
          });
          await blacklistedVPA.save();
          results.added.push(normalizedVPA);
        }

        // Invalidate cache
        await VPACacheService.invalidateVPA(normalizedVPA);

      } catch (error) {
        results.errors.push({ vpa: item.vpa, error: error.message });
      }
    }

    res.json({
      success: true,
      message: 'Batch blacklist operation completed',
      results
    });

  } catch (error) {
    console.error('Batch blacklist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in batch operation',
      error: error.message
    });
  }
};

module.exports = {
  checkVPA,
  reportVPA,
  getAllBlacklisted,
  updateBlacklistStatus,
  removeFromBlacklist,
  batchAddBlacklist
};
