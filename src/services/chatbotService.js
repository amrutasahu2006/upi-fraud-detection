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

  translate(t, key, fallback, values = {}) {
    if (typeof t === 'function') {
      return t(key, { defaultValue: fallback, ...values });
    }
    return fallback;
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
  generateInitialGreeting(t) {
    if (!this.transactionContext || !this.riskContext) {
      return this.translate(
        t,
        'chatbot.fallbackNoContextGreeting',
        "Hey! I'm SurakshaPay AI, your fraud detection assistant. How can I help you?"
      );
    }

    const { amount, recipient, timestamp } = this.transactionContext;
    const { riskScore, riskLevel, riskFactors, detailedReasons } = this.riskContext;

    // Build greeting based on risk level
    if (riskScore >= 80) {
      return this.translate(
        t,
        'chatbot.initialCriticalAlert',
        "⚠️ Critical Alert! You're trying to send ₹{{amount}} to {{upi}}. This transaction has multiple red flags. I strongly recommend blocking it. Want me to?",
        {
          amount: amount?.toLocaleString(),
          upi: recipient?.upi || this.translate(t, 'chatbot.unknownRecipientUpi', 'unknown')
        }
      );
    }

    if (riskScore >= 60) {
      return this.translate(
        t,
        'chatbot.initialHighRisk',
        "🚨 High Risk Detected! Sending ₹{{amount}} to {{upi}} at an unusual time. This needs your attention. Should I block this?",
        {
          amount: amount?.toLocaleString(),
          upi: recipient?.upi || this.translate(t, 'chatbot.unknownRecipientUpi', 'unknown')
        }
      );
    }

    if (riskScore >= 30) {
      return this.translate(
        t,
        'chatbot.initialMediumRisk',
        "⚠️ I detected some unusual patterns in this transaction. You're sending ₹{{amount}} to {{upi}}. {{reason}}. Want me to delay or block it?",
        {
          amount: amount?.toLocaleString(),
          upi: recipient?.upi || this.translate(t, 'chatbot.unknownRecipientUpi', 'unknown'),
          reason: detailedReasons?.[0] || this.translate(t, 'chatbot.thisLooksRisky', 'This looks risky.')
        }
      );
    }

    return this.translate(
      t,
      'chatbot.initialLowRisk',
      "Hey! You're sending ₹{{amount}} to {{upi}}. Everything looks good, but let me know if you need any help!",
      {
        amount: amount?.toLocaleString(),
        upi: recipient?.upi || this.translate(t, 'chatbot.unknownRecipientUpi', 'unknown')
      }
    );
  }

  /**
   * Detect user intent from message
   */
  detectIntent(message) {
    const msg = message.toLowerCase().trim();

    // Block/Reject intents
    // Added Marathi: बंद, नका, रदद, थांबवा
    if (msg.match(/^(block|ban|reject|stop|don't|no way|absolutely not|ब्लॉक|रोक|मत भेजो|रदद|बंद|नको|थांबवा|नका)/)) {
      return { type: 'BLOCK', confidence: 0.95 };
    }

    // Approve/Safe intents
    // Added Marathi: हो, मान्य, करा, जाऊ द्या, बरोबर
    if (
      msg.match(/^(no|safe|approve|proceed|confirm|yes it's|i know|i trust|it's fine|हाँ|सुरक्षित|स्वीकृत|आगे बढ़ो|ठीक है|करो|हो|मान्य|जाऊ द्या|बरोबर|नक्की)/)
    ) {
      return { type: 'APPROVE', confidence: 0.9 };
    }

    // Delay intents
    // Added Marathi: थांबा, उशीर, वेळ
    if (msg.match(/(delay|wait|5 min|later|give me time|verify|विलंब|रुको|बाद में|इंतज़ार|सत्यापित|थांबा|उशीर|वेळ|नंतर)/i)) {
      return { type: 'DELAY', confidence: 0.85 };
    }

    // Query/Info intents
    // Added Marathi: का, कसं, माहिती, सांगा
    if (msg.match(/(why|explain|what|how|tell me|risk|factor|unusual|क्यों|कैसे|क्या|जोखिम|कारण|का|कसं|कसे|माहिती|सांगा)/i)) {
      return { type: 'QUERY', confidence: 0.8 };
    }

    // Verify intent
    // Added Marathi: कोण, तपास, ओळख
    if (msg.match(/(who|verify|check|is this|know this|contact|person|कौन|जांच|पुष्टि|संपर्क|कोण|तपास|ओळख)/i)) {
      return { type: 'VERIFY', confidence: 0.75 };
    }

    // Help intent
    // Added Marathi: मदत, साहाय्य
    if (msg.match(/(help|tip|guide|how to|secure|safe|मदद|सुरक्षा|टिप्स|साहाय्य)/i)) {
      return { type: 'HELP', confidence: 0.7 };
    }

    return { type: 'GENERAL', confidence: 0.5 };
  }

  /**
   * Generate response based on user intent and context
   */
  generateResponse(userMessage, t) {
    const intent = this.detectIntent(userMessage);
    const msg = userMessage.toLowerCase().trim();

    // Handle BLOCK intent
    if (intent.type === 'BLOCK') {
      return {
        text: this.translate(t, 'chatbot.responseBlock', "🚫 Understood. I'm blocking this transaction and marking it as suspicious. Your account is protected."),
        action: 'BLOCK',
        confidence: intent.confidence
      };
    }

    // Handle APPROVE intent
    if (intent.type === 'APPROVE') {
      if (this.riskContext?.riskScore >= 60) {
        return {
          text: this.translate(t, 'chatbot.responseApproveHighRiskWarning', "⚠️ I must warn you - this is a high-risk transaction. Are you absolutely sure you want to proceed?"),
          action: null,
          confidence: intent.confidence
        };
      }
      return {
        text: this.translate(t, 'chatbot.responseApproveProceed', "✅ Got it! Proceeding with your transaction. Be careful out there!"),
        action: 'APPROVE',
        confidence: intent.confidence
      };
    }

    // Handle DELAY intent
    if (intent.type === 'DELAY') {
      return {
        text: this.translate(t, 'chatbot.responseDelay', "⏳ Smart choice! I'm delaying this transaction by 5 minutes. This gives you time to verify everything. I'll remind you when it's ready."),
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
          text: this.translate(
            t,
            'chatbot.responseVerifyNewPayee',
            'This is your first time sending to {{upi}}. Always verify the UPI ID is correct. Ask them to confirm it directly. Watch out for typosquatting (similar UPI IDs).',
            { upi: recipientUpi }
          ),
          action: null,
          confidence: intent.confidence
        };
      }

      return {
        text: this.translate(
          t,
          'chatbot.responseVerifyKnownPayee',
          '{{upi}} appears in your transaction history. Check your previous messages with this person to confirm the UPI ID matches.',
          { upi: recipientUpi }
        ),
        action: null,
        confidence: intent.confidence
      };
    }

    // Handle QUERY intent
    if (intent.type === 'QUERY') {
      return this.explainRiskFactors(t);
    }

    // Handle HELP intent
    if (intent.type === 'HELP') {
      return {
        text: this.translate(
          t,
          'chatbot.responseHelp',
          '🛡️ Security Tips:\n• Always verify recipient UPI with them first\n• Unusual times/amounts = higher risk\n• Enable 2FA in settings\n• Never share OTP with anyone\n• When in doubt, delay or block\n\nNeed help with anything specific?'
        ),
        action: null,
        confidence: intent.confidence
      };
    }

    // Default: ask for clarification
    return {
      text: this.translate(
        t,
        'chatbot.responseClarify',
        "I didn't quite understand. Are you asking me to:\n• Block this transaction?\n• Delay it for 5 minutes?\n• Approve it?\n\nOr do you want to know more about the risks I detected?"
      ),
      action: null,
      confidence: 0.3
    };
  }

  /**
   * Explain detected risk factors in conversational way
   */
  explainRiskFactors(t) {
    if (!this.riskContext) {
      return {
        text: this.translate(t, 'chatbot.explainNoInfo', "I don't have enough information to explain the risks. Let me analyze this transaction first."),
        action: null,
        confidence: 0.5
      };
    }

    const { riskScore, riskFactors, detailedReasons } = this.riskContext;
    const { amount, recipient, timestamp } = this.transactionContext;

    let explanation = this.translate(t, 'chatbot.explainRiskScore', '📊 Risk Score: {{riskScore}}/100', { riskScore }) + '\n\n';

    // Explain each detected risk
    if (riskFactors.includes('newPayee')) {
      explanation += this.translate(
        t,
        'chatbot.explainNewRecipient',
        '⚠️ New Recipient: This is your first time sending to {{upi}}. New contacts are inherently riskier.',
        { upi: recipient?.upi }
      ) + '\n\n';
    }

    if (riskFactors.includes('highAmount') || amount > 50000) {
      explanation += this.translate(
        t,
        'chatbot.explainHighAmount',
        '📈 High Amount: ₹{{amount}} is significantly above your typical transactions.',
        { amount: amount?.toLocaleString() }
      ) + '\n\n';
    }

    if (riskFactors.includes('unusualTime')) {
      const hour = new Date(timestamp).getHours();
      explanation += this.translate(
        t,
        'chatbot.explainLateNight',
        "🌙 Late Night: You're transacting at {{hour}}:00, outside your normal pattern (9 AM - 8 PM).",
        { hour }
      ) + '\n\n';
    }

    if (riskFactors.includes('newDevice')) {
      explanation += this.translate(t, 'chatbot.explainNewDevice', "📱 New Device: This transaction is coming from a device I haven't seen before.") + '\n\n';
    }

    if (riskFactors.includes('newLocation')) {
      explanation += this.translate(t, 'chatbot.explainNewLocation', '📍 New Location: Your location has changed significantly since last transaction.') + '\n\n';
    }

    if (riskFactors.includes('velocity')) {
      explanation += this.translate(t, 'chatbot.explainRapidTransactions', "⚡ Rapid Transactions: You've made multiple transactions very quickly.") + '\n\n';
    }

    explanation += `${this.translate(t, 'chatbot.explainRecommendationTitle', 'My Recommendation:')}\n${
      riskScore >= 80
        ? this.translate(t, 'chatbot.explainRecommendationBlock', '🚫 BLOCK - This is too risky')
        : riskScore >= 60
        ? this.translate(t, 'chatbot.explainRecommendationDelay', '⏳ DELAY - Wait 5 minutes to reconsider')
        : riskScore >= 30
        ? this.translate(t, 'chatbot.explainRecommendationWarn', '⚠️ WARN - Proceed with caution, verify recipient')
        : this.translate(t, 'chatbot.explainRecommendationSafe', '✅ SAFE - This looks legitimate')
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
  getQuickActions(t) {
    const { riskScore } = this.riskContext || {};

    const actions = [];

    if (riskScore >= 80) {
      return [
        { label: this.translate(t, 'chatbot.quickActionBlock', '🚫 Block It'), action: 'BLOCK' },
        { label: this.translate(t, 'chatbot.quickActionWhy', '❓ Why?'), action: 'QUERY' }
      ];
    }

    if (riskScore >= 60) {
      return [
        { label: this.translate(t, 'chatbot.quickActionDelay', '⏳ Delay 5 min'), action: 'DELAY' },
        { label: this.translate(t, 'chatbot.quickActionBlock', '🚫 Block It'), action: 'BLOCK' },
        { label: this.translate(t, 'chatbot.quickActionWhy', '❓ Why?'), action: 'QUERY' }
      ];
    }

    if (riskScore >= 30) {
      return [
        { label: this.translate(t, 'chatbot.quickActionDelay', '⏳ Delay 5 min'), action: 'DELAY' },
        { label: this.translate(t, 'chatbot.quickActionProceed', '✅ Proceed'), action: 'APPROVE' },
        { label: this.translate(t, 'chatbot.quickActionWhyRisky', '❓ Why risky?'), action: 'QUERY' }
      ];
    }

    return [
      { label: this.translate(t, 'chatbot.quickActionProceed', '✅ Proceed'), action: 'APPROVE' },
      { label: this.translate(t, 'chatbot.quickActionTellMore', '❓ Tell me more'), action: 'QUERY' },
      { label: this.translate(t, 'chatbot.quickActionBlockAnyway', '🚫 Block anyway'), action: 'BLOCK' }
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
