import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTransaction } from "../context/TransactionContext";
import { ShieldX, AlertTriangle, CheckCircle } from "lucide-react";
import { submitNotFraudFeedback } from "../services/mockApi";

function TransactionBlocked() {
  const navigate = useNavigate();
  const { transaction, analysisResult } = useTransaction();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get transaction data from context or use defaults
  const amount = transaction?.amount || analysisResult?.amount || 25000;
  const recipientVPA = transaction?.recipient?.upi || analysisResult?.recipientVPA || 'unknown@bank';
  const riskScore = analysisResult?.riskScore || 92;
  const decision = analysisResult?.decision || 'BLOCK';
  const reasons = analysisResult?.detailedReasons || [];

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-screen-lg bg-white flex flex-col">

        {/* Page Header */}
        <header className="flex items-center gap-3 px-4 py-3 md:px-6 md:py-4 border-b">
          <button onClick={() => navigate('/security-warning')} aria-label="Go back" className="text-2xl cursor-pointer">←</button>
          <h1 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">Transaction Blocked</h1>
        </header>

        {/* Main Content */}
        <main className="p-4 md:p-6 lg:p-8 flex flex-col items-center text-center">

          {/* status (centered) */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-gray-100 flex items-center justify-center">
              {/* check icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 md:h-14 md:w-14 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="9" strokeWidth={2} stroke="currentColor" className="text-green-600" />
              </svg>
            </div>

            <h3 className="text-xl md:text-2xl font-semibold text-gray-800">Transaction blocked successfully!</h3>

            <p className="text-sm md:text-base text-gray-500 text-center md:max-w-md">We've successfully blocked the suspicious transaction and recorded your report. Your funds are secure.</p>
          </div>

          {/* summary and action (stacked, centered) */}
          <div className="w-full max-w-xl mx-auto">
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden mb-8">
              <div className="px-4 py-3 border-b">
                <h4 className="font-semibold text-gray-800">Transaction Summary</h4>
              </div>

              <div className="divide-y divide-gray-100">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="text-sm text-gray-500">Receiver VPA</div>
                  <div className="text-sm font-medium text-gray-700">{recipientVPA}</div>
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                  <div className="text-sm text-gray-500">Amount</div>
                  <div className="text-sm font-semibold text-gray-700">₹ {amount.toLocaleString('en-IN')}</div>
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                  <div className="text-sm text-gray-600">Risk Score</div>
                  <div className="text-sm font-semibold text-red-600">{riskScore}%</div>
                </div>
                
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="text-sm text-gray-600">Decision</div>
                  <div className="text-sm font-semibold text-red-600">{decision}</div>
                </div>
              </div>
              
              {/* Show reasons if available */}
              {reasons.length > 0 && (
                <div className="px-4 py-3 bg-red-50 border-t">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Reasons for blocking:</div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {reasons.slice(0, 3).map((reason, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle size={12} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={async () => {
                try {
                  setIsSubmitting(true);
                  const txId = analysisResult?.transactionId || transaction?.transactionId;
                  if (txId) {
                    await submitNotFraudFeedback(txId, 'User overrode block decision');
                  }
                  navigate('/payment-success');
                } catch (error) {
                  console.error('Feedback error:', error);
                  navigate('/payment-success');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              className="w-full mb-4 flex items-center justify-center space-x-2 bg-green-50 border border-green-200 text-green-700 py-3 rounded-lg hover:bg-green-100 transition-colors text-sm font-semibold cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Processing...</span>
              ) : (
                <>
                  <CheckCircle size={18} />
                  <span>This is not fraud - Approve Anyway</span>
                </>
              )}
            </button>

            <button
              onClick={() => navigate('/payment')}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg shadow-md text-sm md:text-base tracking-wide cursor-pointer"
            >
              Return to Home Page
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default TransactionBlocked;

