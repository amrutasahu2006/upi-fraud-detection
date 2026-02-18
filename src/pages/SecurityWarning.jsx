import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, X, MessageCircle, ShieldAlert, CheckCircle } from "lucide-react";
import { useTransaction } from "../context/TransactionContext";
import { useAuth } from "../context/AuthContext";
import AIRecommendationPanel from "../components/AIRecommendationPanel";
import { submitNotFraudFeedback } from "../services/mockApi";

const SecurityWarning = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { currentTransaction, riskAnalysis } = useTransaction();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Get data from riskAnalysis (preferred) - this is set by setAnalysisResult from UPIPayment
  const result = riskAnalysis;
  
  // Handle proceed anyway - submit feedback and confirm transaction
  const handleProceedAnyway = async () => {
    try {
      setIsSubmitting(true);
      
      if (!result?.transactionId) {
        console.warn('No transaction ID available, proceeding without confirmation');
        navigate('/payment-success');
        return;
      }

      // Submit "Not Fraud" feedback first
      console.log('📤 Submitting "Not Fraud" feedback:', result.transactionId);
      try {
        await submitNotFraudFeedback(result.transactionId, 'User proceeded despite warning');
        console.log('✅ Feedback submitted');
      } catch (feedbackError) {
        console.error('⚠️ Feedback failed:', feedbackError);
      }
      
      // Confirm transaction
      console.log('📤 Confirming transaction:', result.transactionId);
      
      const response = await fetch(`http://localhost:5000/api/transactions/confirm/${result.transactionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        console.error('❌ Failed to confirm transaction:', data.message);
      } else {
        console.log('✅ Transaction confirmed:', data.data);
      }

      navigate('/payment-success');
    } catch (error) {
      console.error('Error:', error);
      navigate('/payment-success');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Convert backend riskFactors (object with weights) to array of factor names
  const backendRiskFactors = result?.riskFactors ?? {};
  const criticalRiskFactors = (() => {
    // If it's already an array, use it
    if (Array.isArray(backendRiskFactors)) return backendRiskFactors;
    
    // Convert object keys to array of factor names, mapping backend names to recommendation keys
    const factorMapping = {
      'amountAnomaly': 'highAmount',
      'timePattern': 'unusualTime',
      'newPayee': 'newPayee',
      'deviceFingerprint': 'newDevice',
      'locationAnomaly': 'newLocation',
      'velocityCheck': 'suspiciousPattern',
      'blacklistHit': 'blockVPA',
      'whitelistHit': 'enable2FA'
    };
    
    const factors = Object.keys(backendRiskFactors)
      .filter(key => backendRiskFactors[key] > 0) // Only include factors with risk
      .map(key => factorMapping[key] || key); // Map to recommendation keys
    
    // Fallback if no factors found
    return factors.length > 0 ? factors : ["blockVPA", "enable2FA", "suspiciousPattern"];
  })();
  
  console.log("🏠 Home Page - Risk Factors for Recommendations:", criticalRiskFactors);
  
  const decision = result?.decision || 'WARN';
  const riskScore = result?.riskScore || 0;
  const amount = currentTransaction?.amount || result?.amount || 0;
  const recipientVPA = currentTransaction?.recipient?.upi || result?.recipientVPA || 'unknown@bank';
  const delayDuration = result?.metadata?.delayDuration || 300; // seconds
  const reasons = result?.detailedReasons || [];

  const handleBlock = () => {
    navigate('/blocked', {
      state: {
        transaction: currentTransaction,
        reason: "Transaction blocked by user from warning screen.",
        riskScore: riskScore,
        decision: 'Blocked'
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8 md:p-12 lg:p-16">
      {/* Responsive Width Strategy: 
        - Default: w-full (mobile)
        - sm: max-w-md (tablet portrait)
        - md: max-w-lg (tablet landscape)
        - lg: max-w-xl (desktop)
      */}
      <div className="relative w-full max-w-md md:max-w-lg lg:max-w-xl bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden transition-all duration-300">
        
        {/* Main Scrollable Content Area */}
        <div className="p-6 sm:p-8 lg:p-10 space-y-6 sm:space-y-8">
          
          {/* Warning Section */}
          <div className="text-center space-y-4">
            <div className="relative inline-block">
                <AlertTriangle size={48} className="sm:w-16 sm:h-16 text-red-500 mx-auto animate-pulse" />
                <div className="absolute inset-0 bg-red-200 blur-2xl opacity-20 -z-10"></div>
            </div>
            
            <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
                  Security Warning
                </h2>
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-50 text-red-700 text-xs sm:text-sm font-semibold border border-red-100">
                  High Fraud Risk Detected
                </div>
            </div>
            
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed max-w-[90%] mx-auto">
              {decision === 'DELAY' 
                ? `This transaction (₹${amount.toLocaleString('en-IN')} to ${recipientVPA}) has been flagged for security review. It will be processed after ${Math.floor(delayDuration / 60)} minutes.`
                : `This transaction to ${recipientVPA} has moderate to high risk factors. Risk score: ${riskScore}%. Please review carefully before proceeding.`
              }
            </p>
          </div>

          {/* AI Insight Box - Show actual reasons */}
          {reasons.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
              <div className="flex gap-4 items-start mb-3">
                <div className="bg-blue-100 p-2 rounded-lg hidden sm:block">
                    <MessageCircle size={18} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-slate-800 block mb-1">AI Risk Analysis:</span>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-2">
                    Our system has identified the following risk factors:
                  </p>
                  <ul className="text-xs sm:text-sm text-slate-600 space-y-1">
                    {reasons.slice(0, 3).map((reason, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Action Area */}
          <div className="space-y-3 sm:space-y-4 pt-2">
            
            <div className="text-left">
              <button onClick={() => navigate('/risk-details')} className="text-red-600 text-sm font-medium hover:underline cursor-pointer">
                Explain why in detail
              </button>
            </div>
            
            {/* Primary Action */}
            <button onClick={handleBlock} className="w-full bg-red-600 text-white py-3.5 sm:py-4 px-4 rounded-xl hover:bg-red-700 active:scale-[0.98] transition-all font-bold text-sm sm:text-base shadow-lg shadow-red-200 cursor-pointer">
              Block & Report VPA
            </button>

            {/* Secondary Actions - Using Grid for Tablet/Desktop to save vertical space */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={() => navigate('/chatbot')} className="w-full flex items-center justify-center space-x-2 bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold cursor-pointer">
                    <MessageCircle size={18} />
                    <span>Ask bot for help</span>
                </button>
                <button onClick={handleProceedAnyway} disabled={isSubmitting} className="w-full bg-transparent border border-transparent text-gray-400 py-3 px-4 rounded-xl hover:text-gray-600 hover:bg-gray-100 transition-colors text-sm font-medium cursor-pointer disabled:opacity-50">
                    {isSubmitting ? 'Processing...' : 'Proceed Anyway'}
                </button>
            </div>
          </div>

          {/* AI Recommendations Section */}
          <div className="mt-6 sm:mt-8">
            <h3 className="font-bold text-lg text-slate-800 mb-3">
              Immediate Actions Required
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Based on this high-risk transaction, take these critical security steps:
            </p>
            
            <AIRecommendationPanel 
              riskFactors={criticalRiskFactors}
              maxRecommendations={3}
              layout="list"
              onAction={(rec) => {
                console.log('Critical action:', rec.action);
                // Handle urgent actions
                if (rec.action === "Block VPA") {
                  handleBlock();
                } else if (rec.action === "Enable 2FA") {
                  navigate('/privacy-settings');
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityWarning;