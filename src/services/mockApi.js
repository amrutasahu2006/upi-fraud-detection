/**
 * REAL API SERVICE - Actual Backend Risk Analysis
 * 
 * This service now connects to the real backend API for risk analysis.
 * Uses the new /api/analysis/analyze endpoint with time-based detection.
 */

// Demo Scenario Configuration
export const DEMO_SCENARIO = {
  transaction: {
    amount: 25000,
    recipient: {
      name: "Rajesh Kumar",
      upi: "rajesh.kumar@paytm",
      isNewPayee: true
    },
    device: {
      id: "unknown-device-123",
      isNewDevice: true
    },
    location: "Mumbai",
    time: "23:45", // Late night
    isUnusualTime: true
  }
};

/**
 * Analyzes a transaction and returns risk assessment
 * @param {Object} transactionData - Transaction details
 * @returns {Promise<Object>} Risk analysis result
 */
export async function analyzeTransaction(transactionData) {
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    // const response = await fetch('http://localhost:5000/api/transactions/analyze', {
    const response = await fetch('http://localhost:5000/api/analysis/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(transactionData)
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Analysis failed');
    }
    
    console.log("🔬 Real-time Risk Analysis Result:", result.data);
    
    return result;
    
  } catch (error) {
    console.error('Transaction analysis error:', error);
    
    // Fallback to mock analysis if backend is unavailable
    console.warn('Using fallback mock analysis due to backend error');
    return await mockAnalyzeTransaction(transactionData);
  }
}

/**
 * Mock analysis function as fallback
 * @param {Object} transactionData - Transaction details
 * @returns {Promise<Object>} Mock risk analysis result
 */
async function mockAnalyzeTransaction(transactionData) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const {
    amount,
    recipient,
    location,
    isHighAmount = false,
    isUnusualTime = false,
  } = transactionData;

  const isNewPayee = !recipient.upi.includes('rahul') && !recipient.upi.includes('priya') && !recipient.upi.includes('amit');
  
  console.log("🔬 MOCK Risk Analysis Calculation:");
  console.log("  - Amount:", amount);
  console.log("  - isNewPayee:", isNewPayee);
  
  // --- Mock Geocoding ---
  let city = "Unknown City";
  let state = "Unknown State";
  if (location && location.latitude > 18.9 && location.latitude < 19.2 && location.longitude > 72.8 && location.longitude < 73.0) {
    city = "Mumbai";
    state = "Maharashtra";
  } else if (location && location.latitude > 28.4 && location.latitude < 28.8 && location.longitude > 76.9 && location.longitude < 77.3) {
    city = "Delhi";
    state = "Delhi";
  } else if (location && location.latitude > 12.8 && location.latitude < 13.1 && location.longitude > 77.5 && location.longitude < 77.7) {
    city = "Bangalore";
    state = "Karnataka";
  } else if (location && location.latitude > 12.9 && location.latitude < 13.2 && location.longitude > 80.2 && location.longitude < 80.4) {
    city = "Chennai";
    state = "Tamil Nadu";
  }

  const currentLocation = { ...location, city, state };

  // Calculate risk score based on factors
  let riskScore = 0;
  const detectedFactors = [];
  
  if (isNewPayee) {
    riskScore += 25;
    detectedFactors.push("newPayee");
  }
  
  if (isHighAmount || amount > 10000) {
    riskScore += 30;
    detectedFactors.push("highAmount");
  }
  
  if (isUnusualTime) {
    riskScore += 15;
    detectedFactors.push("unusualTime");
  }
  
  const finalRiskScore = Math.min(riskScore, 100);

  // Determine risk level and decision
  let riskLevel = "LOW";
  let decision = "APPROVE";
  
  if (finalRiskScore >= 80) {
    riskLevel = "CRITICAL";
    decision = "BLOCK";
  } else if (finalRiskScore >= 60) {
    riskLevel = "HIGH";
    decision = "DELAY";
  } else if (finalRiskScore >= 30) {
    riskLevel = "MEDIUM";
    decision = "WARN";
  } else {
    riskLevel = "LOW";
    decision = "APPROVE";
  }

  const riskAnalysis = {
    totalRiskScore: finalRiskScore,
    riskFactors: detectedFactors,
    shouldBlock: finalRiskScore >= 80,
    shouldWarn: finalRiskScore >= 40 && finalRiskScore < 80,
    riskLevel: riskLevel,
    analysis: {
      timeAnalysis: {
        isUnusual: isUnusualTime,
        riskScore: isUnusualTime ? 15 : 0,
        confidence: 0.8,
        reason: isUnusualTime ? "Transaction outside typical hours" : "Normal transaction time",
        typicalHours: [9, 10, 11, 14, 15, 16, 17, 18, 19, 20],
        currentHour: new Date().getHours(),
        dayOfWeekName: new Date().toLocaleDateString('en-US', { weekday: 'long' })
      },
      amountAnalysis: {
        isAnomalous: isHighAmount,
        riskScore: isHighAmount ? 30 : 0,
        confidence: 0.9,
        reason: isHighAmount ? "Amount significantly higher than average" : "Amount within normal range",
        deviation: isHighAmount ? 2.5 : 0.1,
        patterns: {
          hasEnoughData: true,
          averageAmount: 1500,
          medianAmount: 1200
        }
      },
      recipientAnalysis: {
        isNewPayee: isNewPayee,
        isRarePayee: false,
        riskScore: isNewPayee ? 25 : 0,
        reason: isNewPayee ? "First-time recipient" : "Known recipient",
        profile: isNewPayee ? null : {
          transactionCount: 5,
          averageAmount: 800,
          lastTransaction: new Date(Date.now() - 86400000).toISOString()
        }
      },
      device: {
        isNewDevice: false,
        riskScore: 0
      },
      locationAnalysis: {
        isNewLocation: false,
        isLocationUnavailable: false,
        riskScore: 0,
        reason: "Location within typical transaction area",
        currentLocation: currentLocation,
        typicalLocations: [
          { location: "Mumbai-Maharashtra", frequency: 8, percentage: 80 }
        ],
        nearestDistance: 2.5
      }
    }
  };
  
  return {
    success: true,
    data: {
      transactionId: `TRX-MOCK-${Date.now()}`,
      riskScore: finalRiskScore,
      riskLevel: riskLevel,
      decision: decision,
      riskFactors: detectedFactors,
      shouldBlock: finalRiskScore >= 80,
      shouldWarn: finalRiskScore >= 30,
      detailedReasons: [
        isNewPayee && "New recipient - first time sending money to this VPA",
        (isHighAmount || amount > 10000) && `High amount transaction (₹${amount.toLocaleString('en-IN')})`,
        isUnusualTime && "Transaction at unusual time (late night/early morning)"
      ].filter(Boolean),
      metadata: {
        delayDuration: decision === 'DELAY' ? 300 : 0,
        requiresConfirmation: decision === 'WARN'
      },
      timestamp: new Date().toISOString(),
      analysis: riskAnalysis.analysis
    }
  };
}

/**
 * Gets user's current risk profile
 * @param {string} userId - User identifier
 * @returns {Promise<Object>} User risk profile
 */
export async function getUserRiskProfile(userId = "user123") {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock user profile with moderate risk
  return {
    success: true,
    data: {
      userId,
      overallRiskScore: 45,
      activeRiskFactors: ["newDevice", "highAmount"],
      recentTransactions: 15,
      suspiciousActivityCount: 2,
      lastUpdated: new Date().toISOString()
    }
  };
}

/**
 * Records user action on a recommendation
 * @param {Object} actionData - Action details
 * @returns {Promise<Object>} Action result
 */
export async function recordRecommendationAction(actionData) {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  console.log("📊 Recommendation action recorded:", actionData);
  
  return {
    success: true,
    data: {
      actionId: `ACT-${Date.now()}`,
      recorded: true,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Simulates blocking a VPA
 * @param {string} vpa - VPA to block
 * @returns {Promise<Object>} Block result
 */
export async function blockSuspiciousVPA(vpa) {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return {
    success: true,
    data: {
      vpa,
      blocked: true,
      message: "VPA has been added to your blocked list"
    }
  };
}

/**
 * Gets chatbot response with recommendations
 * @param {string} message - User message
 * @param {number} userRiskScore - User's current risk score
 * @returns {Promise<Object>} Chatbot response
 */
export async function getChatbotResponse(message, userRiskScore = 50) {
  await new Promise(resolve => setTimeout(resolve, 700));
  
  const lowerMessage = message.toLowerCase();
  
  // Security-related queries
  if (lowerMessage.includes("safe") || lowerMessage.includes("secure") || lowerMessage.includes("protect")) {
    let factors = [];
    
    if (userRiskScore >= 70) {
      factors = ["enable2FA", "blockVPA", "newDevice"];
    } else if (userRiskScore >= 40) {
      factors = ["highAmount", "newPayee", "enable2FA"];
    } else {
      factors = ["newLocation", "suspiciousPattern"];
    }
    
    return {
      success: true,
      data: {
        message: "Based on your recent activity, here are personalized security recommendations:",
        type: "recommendations",
        riskFactors: factors,
        userRiskScore
      }
    };
  }
  
  // Transaction help
  if (lowerMessage.includes("transaction") || lowerMessage.includes("payment")) {
    return {
      success: true,
      data: {
        message: "I can help you understand transaction risks. What would you like to know?",
        type: "text"
      }
    };
  }
  
  // Default response
  return {
    success: true,
    data: {
      message: "I'm here to help with security questions. Try asking 'How can I stay safe?' or 'Tell me about my security'.",
      type: "text"
    }
  };
}

// Export demo scenario for consistent testing
export { DEMO_SCENARIO as demoScenario };
