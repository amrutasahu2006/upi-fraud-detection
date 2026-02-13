import { useNavigate, useLocation } from "react-router-dom";
import { useTransaction } from "../context/TransactionContext";
import { ShieldAlert, AlertTriangle, XCircle, Home } from "lucide-react";

function TransactionBlocked() {
  const navigate = useNavigate();
  const location = useLocation();
  const { transaction } = useTransaction();
  
  // 1. Get data from Navigation State (Priority) OR Context (Fallback)
  const stateData = location.state || {};
  
  const amount = transaction?.amount || 0;
  const recipientVPA = transaction?.payeeUpiId || transaction?.recipient?.upi || 'Unknown Recipient';
  
  // Data passed from UPIPaymentClean.jsx
  const riskScore = stateData.riskScore || 99;
  const reason = stateData.reason || "High Security Risk Detected";
  
  // Ensure reasons is always an array for mapping
  const reasonsList = Array.isArray(stateData.reasons) ? stateData.reasons : [reason];

  return (
    <div className="min-h-screen bg-red-50 flex justify-center p-4">
      <div className="w-full max-w-md bg-white flex flex-col rounded-3xl shadow-xl overflow-hidden border border-red-100 my-auto">

        {/* Header */}
        <div className="bg-red-600 p-6 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <ShieldAlert className="text-white w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-white">Transaction Blocked</h1>
            <p className="text-red-100 mt-1 text-sm">Security protocols engaged</p>
        </div>

        {/* Main Content */}
        <main className="p-6 md:p-8 flex flex-col items-center">

          {/* Risk Score Indicator */}
          <div className="text-center mb-8">
             <div className="text-5xl font-bold text-slate-800 mb-2">
                {riskScore}<span className="text-2xl text-slate-400">/100</span>
             </div>
             <div className="inline-block bg-red-100 text-red-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
               Critical Risk Level
             </div>
          </div>

          {/* Details Card */}
          <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden mb-6">
            
            {/* Transaction Details */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <span className="text-sm text-slate-500">Amount</span>
                <span className="text-lg font-bold text-slate-900">₹{amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <span className="text-sm text-slate-500">To</span>
                <span className="text-sm font-medium text-slate-900">{recipientVPA}</span>
            </div>

            {/* Reason Section */}
            <div className="p-4 bg-red-50/50">
               <div className="flex items-start gap-3">
                 <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
                 <div>
                   <h3 className="font-bold text-red-900 text-sm mb-1">Blocking Reason</h3>
                   <ul className="space-y-1">
                     {reasonsList.map((r, i) => (
                       <li key={i} className="text-sm text-red-800/80 leading-snug">
                         {r}
                       </li>
                     ))}
                   </ul>
                 </div>
               </div>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full space-y-3">
            <button
              onClick={() => navigate('/payment')}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <XCircle size={20} />
              Cancel Transaction
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full bg-white border border-slate-200 text-slate-600 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <Home size={18} />
              Return to Home
            </button>
          </div>

        </main>
      </div>
    </div>
  );
}

export default TransactionBlocked;