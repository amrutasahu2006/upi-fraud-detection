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

    // Step 1: Check global whitelist (banks, trusted merchants)
    const isWhitelisted = await BlacklistWhitelist.isWhitelisted(normalizedIdentifier);

    if (isWhitelisted) {
      console.log(`✅ VPA whitelisted (trusted): ${normalizedIdentifier}`);
      req.vpaStatus = {
        checked: true,
        flagged: false,
        whitelisted: true,
        message: 'Trusted recipient (whitelisted)'
      };
      return next();
    }

    // Step 2: Check blacklist via cache
    const result = await VPACacheService.checkVPA(normalizedIdentifier);

    if (result.flagged) {
      console.log(`🚨 VPA BLOCKED: ${normalizedIdentifier} - ${result.data.reason}`);
      
      // Store validation result for transaction logging
      req.vpaStatus = {
        checked: true,
        flagged: true,
        blacklistData: result.data
      };

      // Block the transaction
      return res.status(403).json({
        success: false,
        blocked: true,
        reason: 'BLACKLISTED_VPA',
        message: `⚠️ Transaction Blocked: This recipient (${normalizedIdentifier}) has been flagged for ${result.data.reason}`,
        details: {
          vpa: result.data.vpa,
          risk_level: result.data.risk_level,
          reason: result.data.reason,
          confidence_score: result.data.confidence_score,
          reported_at: result.data.reported_at
        },
        recommendation: 'Please verify the recipient details. If you believe this is a mistake, contact support.'
      });
    }

    // Step 3: VPA is safe
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

    // Check whitelist
    const isWhitelisted = await BlacklistWhitelist.isWhitelisted(normalizedIdentifier);

    if (isWhitelisted) {
      return res.json({
        success: true,
        safe: true,
        whitelisted: true,
        message: 'Trusted recipient (whitelisted)'
      });
    }

    // Check blacklist
    const result = await VPACacheService.checkVPA(normalizedIdentifier);

    if (result.flagged) {
      return res.json({
        success: true,
        safe: false,
        blacklisted: true,
        data: result.data,
        message: `Warning: Recipient flagged for ${result.data.reason}`
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
