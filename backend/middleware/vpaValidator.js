const VPACacheService = require('../services/VPACacheService');
const BlacklistWhitelist = require('../models/BlacklistWhitelist');

/**
 * Real-time VPA validation middleware
 * Checks VPA against Redis cache + blacklist before transaction
 */
const validateVPABeforePayment = async (req, res, next) => {
  try {
    const { recipientVPA, recipientPhone, payeeUpiId, payee } = req.body;

    // Extract VPA from any field (frontend compatibility)
    const vpaIdentifier = recipientVPA || payeeUpiId || recipientPhone || payee;

    // Skip if no recipient identifier provided
    if (!vpaIdentifier) {
      return next();
    }

    const normalizedIdentifier = vpaIdentifier.toLowerCase().trim();

    console.log(`🔍 Validating VPA/Phone: ${normalizedIdentifier}`);

    // Step 1: Check global blacklist via cache first (highest priority)
    const blacklistResult = await VPACacheService.checkVPA(normalizedIdentifier);

    if (blacklistResult.flagged) {
      console.log(`🚨 VPA BLOCKED: ${normalizedIdentifier} - ${blacklistResult.data.reason}`);
      
      // Store validation result for transaction logging
      req.vpaStatus = {
        checked: true,
        flagged: true,
        blacklistData: blacklistResult.data
      };

      // Block the transaction
      return res.status(403).json({
        success: false,
        blocked: true,
        reason: 'BLACKLISTED_VPA',
        message: `⚠️ Transaction Blocked: This recipient (${normalizedIdentifier}) has been flagged for ${blacklistResult.data.reason}`,
        details: {
          vpa: blacklistResult.data.vpa,
          risk_level: blacklistResult.data.risk_level,
          reason: blacklistResult.data.reason,
          confidence_score: blacklistResult.data.confidence_score,
          reported_at: blacklistResult.data.reported_at
        },
        recommendation: 'Please verify the recipient details. If you believe this is a mistake, contact support.'
      });
    }

    // Step 2: Check global whitelist (banks, trusted merchants)
    // Using direct query instead of isWhitelisted method due to potential bug
    const whitelisted = await BlacklistWhitelist.findOne({
      type: 'whitelist',
      $or: [
        { vpa: normalizedIdentifier },
        { phoneNumber: normalizedIdentifier },
        { accountNumber: normalizedIdentifier }
      ],
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    });

    if (whitelisted) {
      console.log(`✅ VPA whitelisted (trusted): ${normalizedIdentifier}`);
      req.vpaStatus = {
        checked: true,
        flagged: false,
        whitelisted: true,
        message: 'Trusted recipient (whitelisted)'
      };
      return next();
    }


    console.log(`✅ VPA is safe: ${normalizedIdentifier}`);
    req.vpaStatus = {
      checked: true,
      flagged: false,
      whitelisted: false,
      message: 'VPA verified - no flags found'
    };

    next();

  } catch (error) {
    console.error('VPA validation error:', error);
    
    // In production, you may want to fail-open (allow transaction) or fail-closed (block transaction)
    // For fraud prevention, we fail-closed on errors
    
    return res.status(500).json({
      success: false,
      blocked: true,
      reason: 'VALIDATION_ERROR',
      message: 'Unable to verify recipient safety. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Lightweight VPA check (non-blocking)
 * Returns status without blocking transaction
 */
const checkVPAStatus = async (req, res, next) => {
  try {
    const { vpa, phoneNumber } = req.query;
    
    if (!vpa && !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'VPA or phone number required'
      });
    }

    const identifier = vpa || phoneNumber;
    const normalizedIdentifier = identifier.toLowerCase().trim();

    // Check global blacklist first
    const blacklistResult = await VPACacheService.checkVPA(normalizedIdentifier);

    if (blacklistResult.flagged) {
      return res.json({
        success: true,
        safe: false,
        blacklisted: true,
        data: blacklistResult.data,
        message: `Warning: Recipient flagged for ${blacklistResult.data.reason}`
      });
    }

    // Check whitelist
    const isWhitelisted = await BlacklistWhitelist.findOne({
      type: 'whitelist',
      $or: [
        { vpa: normalizedIdentifier },
        { phoneNumber: normalizedIdentifier },
        { accountNumber: normalizedIdentifier }
      ],
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    });

    if (isWhitelisted) {
      return res.json({
        success: true,
        safe: true,
        whitelisted: true,
        message: 'Trusted recipient (whitelisted)'
      });
    }



    return res.json({
      success: true,
      safe: true,
      whitelisted: false,
      blacklisted: false,
      message: 'Recipient verified - no flags found'
    });

  } catch (error) {
    console.error('VPA status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking VPA status',
      error: error.message
    });
  }
};

module.exports = {
  validateVPABeforePayment,
  checkVPAStatus
};
