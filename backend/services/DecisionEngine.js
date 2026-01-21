// backend/services/DecisionEngine.js
/**
 * Decision Engine - Determines transaction actions based on risk score
 * Actions: APPROVE, WARN, DELAY, BLOCK
 */
class DecisionEngine {
  constructor() {
    // Configurable decision thresholds
    this.thresholds = {
      BLOCK: 80,     // Auto-block if score >= 80
      DELAY: 60,     // Delay confirmation if 60-79
      WARN: 30,      // Show warning if 30-59
      APPROVE: 0     // Approve if < 30
    };

    // Delay durations (in seconds)
    this.delayDurations = {
      HIGH_RISK: 300,    // 5 minutes for HIGH risk (60-79)
      CRITICAL_RISK: 600 // 10 minutes for CRITICAL risk (80+, if not blocked)
    };

    // Action descriptions for UI
    this.actionMessages = {
      APPROVE: {
        title: '✅ Transaction Approved',
        message: 'Transaction has been processed successfully',
        color: 'green',
        icon: 'check-circle'
      },
      WARN: {
        title: '⚠️ Warning - Review Transaction',
        message: 'This transaction has moderate risk factors. Please review before proceeding.',
        color: 'yellow',
        icon: 'alert-triangle',
        requiresConfirmation: true
      },
      DELAY: {
        title: '⏳ Transaction Delayed',
        message: 'High risk detected. Transaction will be processed after a security delay.',
        color: 'orange',
        icon: 'clock',
        canCancel: true
      },
      BLOCK: {
        title: '🚫 Transaction Blocked',
        message: 'Critical risk detected. Transaction has been blocked for your security.',
        color: 'red',
        icon: 'x-circle',
        isFinal: true
      }
    };
  }

  /**
   * Make decision based on risk score and factors
   * @param {Object} riskAnalysis - Output from RiskScoringEngine
   * @param {Object} options - Additional options (e.g., force approve)
   * @returns {Object} Decision with action, message, and metadata
   */
  makeDecision(riskAnalysis, options = {}) {
    const { totalScore, riskLevel, riskFactors, detailedReasons, decision: suggestedDecision, amount } = riskAnalysis;

    console.log('🎯 Decision Engine: Score', totalScore, '→ Suggested:', suggestedDecision, '→ Amount:', amount);

    // Check for overrides
    if (options.forceApprove && options.approvedBy) {
      console.log('✅ Override: Force approved by', options.approvedBy);
      return this._buildDecision('APPROVE', totalScore, riskLevel, {
        ...riskFactors,
        override: true,
        approvedBy: options.approvedBy,
        reasons: detailedReasons
      });
    }

    // Blacklist/Whitelist overrides (highest priority)
    if (riskFactors.blacklistHit) {
      return this._buildDecision('BLOCK', 100, 'CRITICAL', {
        ...riskFactors,
        permanent: true,
        reason: 'Recipient on blacklist',
        reasons: detailedReasons
      });
    }

    if (riskFactors.whitelistHit) {
      return this._buildDecision('APPROVE', 0, 'LOW', {
        ...riskFactors,
        trusted: true,
        reason: 'Recipient on whitelist',
        reasons: detailedReasons
      });
    }

    // Auto-approve low amount transactions (< 1000)
    if (amount && amount < 1000) {
      console.log('✅ Auto-approve: Amount below 1000');
      return this._buildDecision('APPROVE', totalScore, riskLevel, {
        ...riskFactors,
        autoApproveReason: 'Amount below 1000',
        reasons: ['Amount is below 1000 rupees - automatically approved']
      });
    }

    // Auto-approve low risk score (< 30)
    if (totalScore < 30) {
      console.log('✅ Auto-approve: Risk score below 30');
      return this._buildDecision('APPROVE', totalScore, riskLevel, {
        ...riskFactors,
        autoApproveReason: 'Risk score below 30',
        reasons: detailedReasons.length > 0 ? detailedReasons : ['Risk score below 30 - automatically approved']
      });
    }

    // Standard threshold-based decisions
    if (totalScore >= this.thresholds.BLOCK) {
      return this._buildDecision('BLOCK', totalScore, riskLevel, {
        ...riskFactors,
        reasons: detailedReasons,
        canAppeal: true,
        appealWindow: 24 // hours
      });
    }

    if (totalScore >= this.thresholds.DELAY) {
      const delaySeconds = this.delayDurations.HIGH_RISK;
      return this._buildDecision('DELAY', totalScore, riskLevel, {
        ...riskFactors,
        reasons: detailedReasons,
        delaySeconds,
        delayMinutes: Math.round(delaySeconds / 60),
        canCancel: true,
        expiresAt: new Date(Date.now() + delaySeconds * 1000)
      });
    }

    if (totalScore >= this.thresholds.WARN) {
      return this._buildDecision('WARN', totalScore, riskLevel, {
        ...riskFactors,
        reasons: detailedReasons,
        requiresConfirmation: true,
        confirmationMessage: 'I understand the risks and want to proceed'
      });
    }

    // Low risk - approve immediately
    return this._buildDecision('APPROVE', totalScore, riskLevel, {
      ...riskFactors,
      reasons: detailedReasons.length > 0 ? detailedReasons : ['No significant risk factors detected']
    });
  }

  /**
   * Build standardized decision object
   */
  _buildDecision(action, score, riskLevel, metadata) {
    const actionInfo = this.actionMessages[action];

    return {
      action,
      score,
      riskLevel,
      ...actionInfo,
      metadata,
      timestamp: new Date(),
      actionRequired: ['WARN', 'DELAY'].includes(action),
      canProceed: ['APPROVE', 'WARN'].includes(action),
      isBlocked: action === 'BLOCK'
    };
  }

  /**
   * Check if delayed transaction can now proceed
   * @param {Object} transaction - Transaction with delay info
   * @returns {Boolean} Can proceed now
   */
  canProceedAfterDelay(transaction) {
    if (!transaction.metadata?.expiresAt) {
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(transaction.metadata.expiresAt);

    return now >= expiresAt;
  }

  /**
   * Get human-readable action description
   * @param {String} action - APPROVE, WARN, DELAY, BLOCK
   * @param {Object} metadata - Additional context
   * @returns {String} Description
   */
  getActionDescription(action, metadata = {}) {
    switch (action) {
      case 'BLOCK':
        return metadata.permanent 
          ? '🚫 Permanently blocked - recipient on blacklist'
          : '🚫 Blocked due to high risk - contact support to appeal';
      
      case 'DELAY':
        const minutes = metadata.delayMinutes || 5;
        return `⏳ Processing delayed by ${minutes} minutes for security verification`;
      
      case 'WARN':
        return '⚠️ Please review risk factors and confirm to proceed';
      
      case 'APPROVE':
        return metadata.trusted 
          ? '✅ Approved instantly - trusted recipient'
          : '✅ Approved - low risk transaction';
      
      default:
        return 'Processing transaction';
    }
  }

  /**
   * Update decision thresholds (admin function)
   * @param {Object} newThresholds - New threshold values
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    console.log('🔧 Updated Decision Thresholds:', this.thresholds);
    return this.thresholds;
  }

  /**
   * Get current threshold configuration
   */
  getThresholds() {
    return {
      thresholds: this.thresholds,
      delayDurations: this.delayDurations,
      descriptions: {
        BLOCK: `Score ≥ ${this.thresholds.BLOCK}: Auto-block transaction`,
        DELAY: `Score ${this.thresholds.DELAY}-${this.thresholds.BLOCK - 1}: Delay confirmation`,
        WARN: `Score ${this.thresholds.WARN}-${this.thresholds.DELAY - 1}: Show warning, require confirmation`,
        APPROVE: `Score < ${this.thresholds.WARN}: Approve immediately`
      }
    };
  }

  /**
   * Validate if an action can be overridden
   * @param {String} action - Current action
   * @param {String} userRole - User's role (user, admin, superadmin)
   * @returns {Boolean} Can override
   */
  canOverride(action, userRole) {
    const overridePermissions = {
      BLOCK: ['superadmin'], // Only superadmin can override blocks
      DELAY: ['admin', 'superadmin'], // Admin can skip delays
      WARN: ['user', 'admin', 'superadmin'] // Anyone can confirm warnings
    };

    return overridePermissions[action]?.includes(userRole) || false;
  }

  /**
   * Generate fraud alert message for notifications
   * @param {Object} decision - Decision object
   * @param {Object} transaction - Transaction details
   * @returns {String} Alert message
   */
  generateAlertMessage(decision, transaction) {
    const { action, score, metadata } = decision;
    const { amount, recipientVPA } = transaction;

    const reasonsText = metadata.reasons?.slice(0, 2).join(', ') || 'Multiple risk factors';

    switch (action) {
      case 'BLOCK':
        return `🚫 BLOCKED: ₹${amount.toLocaleString()} to ${recipientVPA}. Reason: ${reasonsText}`;
      
      case 'DELAY':
        return `⏳ DELAYED: ₹${amount.toLocaleString()} to ${recipientVPA} for ${metadata.delayMinutes} min. ${reasonsText}`;
      
      case 'WARN':
        return `⚠️ WARNING: ₹${amount.toLocaleString()} to ${recipientVPA}. ${reasonsText}`;
      
      default:
        return `Transaction processed: ₹${amount.toLocaleString()} to ${recipientVPA}`;
    }
  }
}

module.exports = new DecisionEngine();
