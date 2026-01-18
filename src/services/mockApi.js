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
    isNewPayee = false,
    isHighAmount = false,
    isNewDevice = false,
    isUnusualTime = false,
    isNewLocation = false
  } = transactionData;
  
  console.log("🔬 Risk Analysis Calculation:");
  console.log("  - Amount:", amount);
  console.log("  - isNewPayee:", isNewPayee);
  console.log("  - isHighAmount:", isHighAmount);
  console.log("  - isNewDevice:", isNewDevice);
  console.log("  - isUnusualTime:", isUnusualTime);
  console.log("  - isNewLocation:", isNewLocation);
  
  // Calculate risk score based on factors
  let riskScore = 0;
  const detectedFactors = [];
  
  if (isNewPayee) {
    riskScore += 25;
    detectedFactors.push("newPayee");
    console.log("  ➕ New Payee: +25 (Total: " + riskScore + ")");
  }
  
  if (isHighAmount || amount > 10000) {
    riskScore += 30;
    detectedFactors.push("highAmount");
    console.log("  ➕ High Amount: +30 (Total: " + riskScore + ")");
  }
  
  if (isNewDevice) {
    riskScore += 25;
    detectedFactors.push("newDevice");
    console.log("  ➕ New Device: +25 (Total: " + riskScore + ")");
  }
  
  if (isUnusualTime) {
    riskScore += 15;
    detectedFactors.push("unusualTime");
    console.log("  ➕ Unusual Time: +15 (Total: " + riskScore + ")");
  }
  
  if (isNewLocation) {
    riskScore += 15;
    detectedFactors.push("newLocation");
    console.log("  ➕ New Location: +15 (Total: " + riskScore + ")");
  }
  
  console.log("📊 Final Risk Score:", riskScore);
  
  // Add general security recommendations for medium+ risk
  if (riskScore >= 50) {
    detectedFactors.push("enable2FA");
  }
  
  if (riskScore >= 70) {
    detectedFactors.push("blockVPA");
  }
  
  // Determine risk level
  let riskLevel = "LOW";
  if (riskScore >= 70) riskLevel = "HIGH";
  else if (riskScore >= 40) riskLevel = "MEDIUM";
  
  return {
    success: true,
    data: {
      transactionId: `TRX-${Date.now()}`,
      riskScore: Math.min(riskScore, 100),
      riskLevel,
      riskFactors: detectedFactors,
      shouldBlock: riskScore >= 80,
      timestamp: new Date().toISOString(),
      analysis: {
        isNewPayee,
        isHighAmount: amount > 10000,
        isNewDevice,
        isUnusualTime,
        isNewLocation,
        amount
      }
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
