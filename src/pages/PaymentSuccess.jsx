import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight, FileText, Home } from "lucide-react";
import { useTransaction } from "../context/TransactionContext";

function PaymentSuccess() {
  const navigate = useNavigate();
  const { currentTransaction, riskAnalysis } = useTransaction();

  const amount = currentTransaction?.amount || 0;
  const recipientVPA = currentTransaction?.recipient?.upi || 'unknown@bank';
  const recipientName = currentTransaction?.recipient?.name || recipientVPA.split('@')[0];
  const transactionId = riskAnalysis?.transactionId || 'TXN-' + Date.now();
  const timestamp = new Date(currentTransaction?.timestamp || Date.now());

  useEffect(() => {
    // Auto-redirect to home after 10 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Success Animation Section */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white opacity-10">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/3 translate-y-1/3"></div>
          </div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-4 animate-bounce">
              <CheckCircle className="text-green-600" size={56} strokeWidth={2.5} />
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2">
              Payment Successful!
            </h1>
            <p className="text-green-100 text-sm">
              Your money has been transferred securely
            </p>
          </div>
        </div>

        {/* Transaction Details Section */}
        <div className="p-6 space-y-6">
          
          {/* Amount Display */}
          <div className="text-center border-b border-gray-100 pb-6">
            <p className="text-sm text-gray-500 mb-1">Amount Sent</p>
            <p className="text-4xl font-bold text-gray-900">₹{amount.toLocaleString('en-IN')}</p>
          </div>

          {/* Transaction Info */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">To</span>
              <span className="text-base font-semibold text-gray-900">{recipientName}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">UPI ID</span>
              <span className="text-sm font-medium text-gray-700">{recipientVPA}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Transaction ID</span>
              <span className="text-xs font-mono text-gray-600">{transactionId.slice(-12)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Date & Time</span>
              <span className="text-sm text-gray-700">
                {timestamp.toLocaleString('en-IN', { 
                  dateStyle: 'medium', 
                  timeStyle: 'short' 
                })}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Status</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                <CheckCircle size={14} className="mr-1" />
                Completed
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 cursor-pointer"
            >
              <Home size={20} />
              Make Another Payment
            </button>

            <button
              onClick={() => navigate('/transaction-history')}
              className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText size={20} />
              View Transaction History
            </button>
          </div>

          {/* Auto-redirect Notice */}
          <p className="text-center text-xs text-gray-400 pt-2">
            You'll be redirected to home in 10 seconds
          </p>
        </div>

      </div>
    </div>
  );
}

export default PaymentSuccess;
