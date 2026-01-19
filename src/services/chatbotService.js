/**
 * Chatbot Service - Intelligent fraud prevention assistant
 * 
 * Generates context-aware responses based on:
 * - Transaction details (amount, recipient, time)
 * - Risk analysis (score, factors, reasons)
 * - User messages and intent detection
 */

class ChatbotService {
  constructor() {
    this.conversationHistory = [];
    this.riskContext = null;
    this.transactionContext = null;
  }

  /**
   * Initialize chatbot with transaction and risk data
   */
  setContext(transaction, riskAnalysis) {
    this.transactionContext = transaction;

    // Normalize riskFactors to an array (backend sends object of weights)
    const backendRiskFactors = riskAnalysis?.riskFactors ?? {};
    const factorMapping = {
      amountAnomaly: 'highAmount',
      timePattern: 'unusualTime',
      newPayee: 'newPayee',
      deviceFingerprint: 'newDevice',
      locationAnomaly: 'newLocation',
      velocityCheck: 'suspiciousPattern',
      blacklistHit: 'blockVPA',
      whitelistHit: 'enable2FA'
    };

    const normalizedRiskFactors = Array.isArray(backendRiskFactors)
      ? backendRiskFactors
      : Object.keys(backendRiskFactors)
          .filter(key => backendRiskFactors[key] > 0)
          .map(key => factorMapping[key] || key);

    this.riskContext = {
      ...riskAnalysis,
      riskFactors: normalizedRiskFactors
    };

    this.conversationHistory = [];
  }

  /**
   * Generate initial greeting based on risk factors
   */
  generateInitialGreeting() {
    if (!this.transactionContext || !this.riskContext) {
      return "Hey! I'm SurakshaPay AI, your fraud detection assistant. How can I help you?";
    }

    const { amount, recipient, timestamp } = this.transactionContext;
    const { riskScore, riskLevel, riskFactors, detailedReasons } = this.riskContext;

    // Build greeting based on risk level
    if (riskScore >= 80) {
      return `⚠️ Critical Alert! You're trying to send ₹${amount?.toLocaleString()} to ${
        recipient?.upi || 'unknown'
      }. This transaction has multiple red flags. I strongly recommend blocking it. Want me to?`;
    }

    if (riskScore >= 60) {
      return `🚨 High Risk Detected! Sending ₹${amount?.toLocaleString()} to ${
        recipient?.upi || 'unknown'
      } at an unusual time. This needs your attention. Should I block this?`;
    }

    if (riskScore >= 30) {
      return `⚠️ I detected some unusual patterns in this transaction. You're sending ₹${amount?.toLocaleString()} to ${
        recipient?.upi || 'unknown'
      }. ${detailedReasons?.[0] || 'This looks risky.'}. Want me to delay or block it?`;
    }

    return `Hey! You're sending ₹${amount?.toLocaleString()} to ${
      recipient?.upi || 'unknown'
    }. Everything looks good, but let me know if you need any help!`;
  }

  /**
   * Detect user intent from message
   */
  detectIntent(message) {
    const msg = message.toLowerCase().trim();

    // Block/Reject intents
    if (msg.match(/^(yes|block|ban|reject|stop|don't|no way|absolutely not)/)) {
      return { type: 'BLOCK', confidence: 0.95 };
    }

    // Approve/Safe intents
    if (
      msg.match(/^(no|safe|approve|proceed|confirm|yes it's|i know|i trust|it's fine)/) ||
      msg === 'yes' && this.conversationHistory.slice(-1)[0]?.type === 'bot' && this.conversationHistory.slice(-1)[0]?.content.includes('safe')
    ) {
      return { type: 'APPROVE', confidence: 0.9 };
    }

    // Delay intents
    if (msg.match(/(delay|wait|5 min|later|give me time|verify)/i)) {
      return { type: 'DELAY', confidence: 0.85 };
    }

    // Query/Info intents
    if (msg.match(/(why|explain|what|how|tell me|risk|factor|unusual)/i)) {
      return { type: 'QUERY', confidence: 0.8 };
    }

    // Verify intent
    if (msg.match(/(who|verify|check|is this|know this|contact|person)/i)) {
      return { type: 'VERIFY', confidence: 0.75 };
    }

    // Help intent
    if (msg.match(/(help|tip|guide|how to|secure|safe)/i)) {
      return { type: 'HELP', confidence: 0.7 };
    }

    return { type: 'GENERAL', confidence: 0.5 };
  }

  /**
   * Generate response based on user intent and context
   */
  generateResponse(userMessage) {
    const intent = this.detectIntent(userMessage);
    const msg = userMessage.toLowerCase().trim();

    // Handle BLOCK intent
    if (intent.type === 'BLOCK') {
      return {
        text: "🚫 Understood. I'm blocking this transaction and marking it as suspicious. Your account is protected.",
        action: 'BLOCK',
        confidence: intent.confidence
      };
    }

    // Handle APPROVE intent
    if (intent.type === 'APPROVE') {
      if (this.riskContext?.riskScore >= 60) {
        return {
          text: "⚠️ I must warn you - this is a high-risk transaction. Are you absolutely sure you want to proceed?",
          action: null,
          confidence: intent.confidence
        };
      }
      return {
        text: "✅ Got it! Proceeding with your transaction. Be careful out there!",
        action: 'APPROVE',
        confidence: intent.confidence
      };
    }

    // Handle DELAY intent
    if (intent.type === 'DELAY') {
      return {
        text: "⏳ Smart choice! I'm delaying this transaction by 5 minutes. This gives you time to verify everything. I'll remind you when it's ready.",
        action: 'DELAY',
        confidence: intent.confidence
      };
    }

    // Handle VERIFY intent
    if (intent.type === 'VERIFY') {
      const recipientUpi = this.transactionContext?.recipient?.upi;
      const riskFactors = this.riskContext?.riskFactors || [];
      const isNewPayee = riskFactors.includes('newPayee');

      if (isNewPayee) {
        return {
          text: `This is your **first time** sending to ${recipientUpi}. Always verify the UPI ID is correct. Ask them to confirm it directly. Watch out for typosquatting (similar UPI IDs).`,
          action: null,
          confidence: intent.confidence
        };
      }

      return {
        text: `${recipientUpi} appears in your transaction history. Check your previous messages with this person to confirm the UPI ID matches.`,
        action: null,
        confidence: intent.confidence
      };
    }

    // Handle QUERY intent
    if (intent.type === 'QUERY') {
      return this.explainRiskFactors();
    }

    // Handle HELP intent
    if (intent.type === 'HELP') {
      return {
        text: `🛡️ **Security Tips:**\n• Always verify recipient UPI with them first\n• Unusual times/amounts = higher risk\n• Enable 2FA in settings\n• Never share OTP with anyone\n• When in doubt, delay or block\n\nNeed help with anything specific?`,
        action: null,
        confidence: intent.confidence
      };
    }

    // Default: ask for clarification
    return {
      text: `I didn't quite understand. Are you asking me to:\n• **Block** this transaction?\n• **Delay** it for 5 minutes?\n• **Approve** it?\n\nOr do you want to know more about the **risks** I detected?`,
      action: null,
      confidence: 0.3
    };
  }

  /**
   * Explain detected risk factors in conversational way
   */
  explainRiskFactors() {
    if (!this.riskContext) {
      return {
        text: "I don't have enough information to explain the risks. Let me analyze this transaction first.",
        action: null,
        confidence: 0.5
      };
    }

    const { riskScore, riskFactors, detailedReasons } = this.riskContext;
    const { amount, recipient, timestamp } = this.transactionContext;

    let explanation = `📊 **Risk Score: ${riskScore}/100**\n\n`;

    // Explain each detected risk
    if (riskFactors.includes('newPayee')) {
      explanation += `⚠️ **New Recipient**: This is your first time sending to ${recipient?.upi}. New contacts are inherently riskier.\n\n`;
    }

    if (riskFactors.includes('highAmount') || amount > 50000) {
      explanation += `📈 **High Amount**: ₹${amount?.toLocaleString()} is significantly above your typical transactions.\n\n`;
    }

    if (riskFactors.includes('unusualTime')) {
      const hour = new Date(timestamp).getHours();
      explanation += `🌙 **Late Night**: You're transacting at ${hour}:00, outside your normal pattern (9 AM - 8 PM).\n\n`;
    }

    if (riskFactors.includes('newDevice')) {
      explanation += `📱 **New Device**: This transaction is coming from a device I haven't seen before.\n\n`;
    }

    if (riskFactors.includes('newLocation')) {
      explanation += `📍 **New Location**: Your location has changed significantly since last transaction.\n\n`;
    }

    if (riskFactors.includes('velocity')) {
      explanation += `⚡ **Rapid Transactions**: You've made multiple transactions very quickly.\n\n`;
    }

    explanation += `**My Recommendation:**\n${
      riskScore >= 80
        ? '🚫 **BLOCK** - This is too risky'
        : riskScore >= 60
        ? '⏳ **DELAY** - Wait 5 minutes to reconsider'
        : riskScore >= 30
        ? '⚠️ **WARN** - Proceed with caution, verify recipient'
        : '✅ **SAFE** - This looks legitimate'
    }`;

    return {
      text: explanation,
      action: null,
      confidence: 0.85
    };
  }

  /**
   * Add message to conversation history
   */
  addMessage(content, type = 'user') {
    this.conversationHistory.push({
      content,
      type,
      timestamp: new Date()
    });
  }

  /**
   * Get conversation history
   */
  getHistory() {
    return this.conversationHistory;
  }

  /**
   * Get quick action suggestions based on current state
   */
  getQuickActions() {
    const { riskScore } = this.riskContext || {};

    const actions = [];

    if (riskScore >= 80) {
      return [
        { label: '🚫 Block It', action: 'BLOCK' },
        { label: '❓ Why?', action: 'QUERY' }
      ];
    }

    if (riskScore >= 60) {
      return [
        { label: '⏳ Delay 5 min', action: 'DELAY' },
        { label: '🚫 Block It', action: 'BLOCK' },
        { label: '❓ Why?', action: 'QUERY' }
      ];
    }

    if (riskScore >= 30) {
      return [
        { label: '⏳ Delay 5 min', action: 'DELAY' },
        { label: '✅ Proceed', action: 'APPROVE' },
        { label: '❓ Why risky?', action: 'QUERY' }
      ];
    }

    return [
      { label: '✅ Proceed', action: 'APPROVE' },
      { label: '❓ Tell me more', action: 'QUERY' },
      { label: '🚫 Block anyway', action: 'BLOCK' }
    ];
  }

  /**
   * Reset conversation for new transaction
   */
  reset() {
    this.conversationHistory = [];
    this.riskContext = null;
    this.transactionContext = null;
  }
}

export const chatbot = new ChatbotService();
