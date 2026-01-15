/**
 * USAGE EXAMPLES FOR AI RECOMMENDATION ENGINE
 * 
 * This file demonstrates how to use the recommendation engine across different pages
 */

// ========================================
// EXAMPLE 1: Security Recommendations Page
// ========================================
import AIRecommendationPanel from "../components/AIRecommendationPanel";

function SecurityRecommendationsExample() {
  // Define risk factors based on user's security profile
  const riskFactors = ["newPayee", "highAmount", "newDevice", "enable2FA"];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Stay Secure, Always.</h2>
      <p className="text-gray-600 mb-6">
        AI-powered recommendations based on detected risk factors.
      </p>
      
      <AIRecommendationPanel 
        riskFactors={riskFactors} 
        maxRecommendations={4}
        layout="grid"
        onAction={(rec) => console.log('Action clicked:', rec)}
      />
    </div>
  );
}

// ========================================
// EXAMPLE 2: Transaction Risk Details Page
// ========================================
import { getContextualRecommendations } from "../logic/recommendationEngine";

function TransactionRiskDetailsExample() {
  // Analyze transaction and get contextual recommendations
  const transactionContext = {
    isNewPayee: true,
    isHighAmount: true,
    isUnusualTime: false,
    isNewDevice: true,
    isNewLocation: false,
    riskScore: 75
  };

  const recommendations = getContextualRecommendations(transactionContext);

  return (
    <div className="p-6">
      <h3 className="font-bold text-lg mb-4">Recommended Actions</h3>
      
      <AIRecommendationPanel 
        riskFactors={["newPayee", "highAmount", "newDevice"]} 
        maxRecommendations={3}
        layout="list"
      />
    </div>
  );
}

// ========================================
// EXAMPLE 3: Security Warning Page
// ========================================
function SecurityWarningExample() {
  // High-risk transaction detected
  const criticalRiskFactors = ["blockVPA", "enable2FA", "suspiciousPattern"];

  return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <h3 className="text-red-800 font-bold">High Risk Detected!</h3>
        <p className="text-red-600 text-sm">
          This transaction has been flagged. Review these recommendations.
        </p>
      </div>
      
      <AIRecommendationPanel 
        riskFactors={criticalRiskFactors} 
        maxRecommendations={3}
        layout="list"
        onAction={(rec) => {
          // Handle urgent action
          console.log('Urgent action:', rec);
        }}
      />
    </div>
  );
}

// ========================================
// EXAMPLE 4: Chatbot Integration
// ========================================
import { generateRecommendations, analyzeRiskScore } from "../logic/recommendationEngine";

function SecurityChatbotExample() {
  // User asks: "How can I stay safe?"
  const handleSecurityQuery = (userRiskScore = 60) => {
    const factors = analyzeRiskScore(userRiskScore);
    const recommendations = generateRecommendations(factors, 3);
    
    return {
      message: "Based on your activity, here are personalized security tips:",
      recommendations: recommendations.map(rec => ({
        title: rec.title,
        description: rec.description,
        action: rec.action
      }))
    };
  };

  const chatResponse = handleSecurityQuery(75);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-900">{chatResponse.message}</p>
      </div>
      
      {chatResponse.recommendations.map((rec, i) => (
        <div key={i} className="bg-white border rounded-lg p-3">
          <h4 className="font-semibold text-sm">{rec.title}</h4>
          <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
          <button className="mt-2 text-blue-600 text-xs font-medium">
            {rec.action} →
          </button>
        </div>
      ))}
    </div>
  );
}

// ========================================
// EXAMPLE 5: Dynamic Risk-based Recommendations
// ========================================
import { useEffect, useState } from "react";

function DynamicRecommendationsExample() {
  const [userRiskProfile, setUserRiskProfile] = useState({
    riskScore: 0,
    factors: []
  });

  useEffect(() => {
    // Simulate fetching user risk profile from backend
    fetchUserRiskProfile().then(profile => {
      setUserRiskProfile(profile);
    });
  }, []);

  const fetchUserRiskProfile = async () => {
    // This would call your backend API
    // Example response:
    return {
      riskScore: 68,
      factors: ["newDevice", "highAmount", "unusualTime"]
    };
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="font-bold">Your Security Score</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${100 - userRiskProfile.riskScore}%` }}
            />
          </div>
          <span className="text-sm font-medium">
            {100 - userRiskProfile.riskScore}/100
          </span>
        </div>
      </div>

      <AIRecommendationPanel 
        riskFactors={userRiskProfile.factors}
        maxRecommendations={4}
        layout="grid"
        onAction={(rec) => {
          // Track action in analytics
          console.log('User took action:', rec.action);
        }}
      />
    </div>
  );
}

// ========================================
// EXAMPLE 6: Minimal Usage (Simple List)
// ========================================
function MinimalExample() {
  return (
    <AIRecommendationPanel 
      riskFactors={["newPayee", "highAmount"]} 
    />
  );
}

// ========================================
// EXAMPLE 7: Using Individual Engine Functions
// ========================================
import { 
  getRecommendation, 
  getAllRecommendations,
  analyzeRiskScore 
} from "../logic/recommendationEngine.js";

function IndividualFunctionsExample() {
  // Get a single recommendation
  const newPayeeRec = getRecommendation("newPayee");
  console.log(newPayeeRec.title); // "Verify Recipient Identity"

  // Get all available recommendations
  const allRecs = getAllRecommendations();
  console.log(Object.keys(allRecs)); // ["newPayee", "unusualTime", ...]

  // Analyze a risk score
  const riskScore = 85;
  const suggestedFactors = analyzeRiskScore(riskScore);
  console.log(suggestedFactors); // ["enable2FA", "blockVPA", "newDevice", "highAmount"]

  return null;
}

export {
  SecurityRecommendationsExample,
  TransactionRiskDetailsExample,
  SecurityWarningExample,
  SecurityChatbotExample,
  DynamicRecommendationsExample,
  MinimalExample,
  IndividualFunctionsExample
};
