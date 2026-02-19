import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTransaction } from "../context/TransactionContext";
import { ShieldAlert, AlertTriangle, Home } from "lucide-react";
import { translateBackendReasons } from "../utils/translateBackendReason";

function TransactionBlocked() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentTransaction: transaction, riskAnalysis: analysisResult } = useTransaction();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 1. Get data from Navigation State (Priority) OR Context (Fallback) OR Analysis Result
  const stateData = location.state || {};
  
  console.log('🔍 TransactionBlocked - Location State amount:', stateData.amount);
  console.log('🔍 TransactionBlocked - Location State recipientVPA:', stateData.recipientVPA);
  console.log('🔍 TransactionBlocked - Location State recipientName:', stateData.recipientName);
  console.log('🔍 TransactionBlocked - Transaction Context:', transaction);
  console.log('🔍 TransactionBlocked - Analysis Result:', analysisResult);
  
  // Priority: State > Analysis Result > Transaction Context
  const amount = stateData.amount || analysisResult?.amount || transaction?.amount || 0;
  const recipientVPA = stateData.recipientVPA || analysisResult?.recipientVPA || transaction?.payeeUpiId || transaction?.recipient?.upi || 'Unknown Recipient';
  const recipientName = stateData.recipientName || analysisResult?.recipientName || transaction?.recipient?.name || 'Unknown Recipient';
  
  console.log('📊 Final Resolved Values - Amount:', amount, 'VPA:', recipientVPA, 'Name:', recipientName);
  
  // Data passed from UPIPaymentClean.jsx
  const riskScore = stateData.riskScore || analysisResult?.riskScore || 80;
  const reason = stateData.reason || "High Security Risk Detected";
  // Always show BLOCK decision on this page since transaction is blocked
  const decision = 'BLOCK';
  
  // Ensure reasons is always an array for mapping
  const reasonsList = Array.isArray(stateData.reasons) ? stateData.reasons : [reason];
  const localizedReasons = translateBackendReasons(reasonsList, t);

  return (
    <div className="min-h-screen bg-red-50 flex justify-center p-4">
      <div className="w-full max-w-md bg-white flex flex-col rounded-3xl shadow-xl overflow-hidden border border-red-100 my-auto">

        {/* Header */}
        <div className="bg-red-600 p-6 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <ShieldAlert className="text-white w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-white">{t('transactionBlocked.title')}</h1>
            <p className="text-red-100 mt-1 text-sm">{t('transactionBlocked.subtitle')}</p>
        </div>

        {/* Main Content */}
        <main className="p-6 md:p-8 flex flex-col items-center">

          {/* Risk Score Indicator */}
          <div className="text-center mb-8">
             <div className="text-5xl font-bold text-slate-800 mb-2">
                {riskScore}<span className="text-2xl text-slate-400">/100</span>
             </div>
             <div className="inline-block bg-red-100 text-red-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
               {t('transactionBlocked.criticalRiskLevel')}
             </div>
          </div>

          {/* Details Card */}
<div className="w-full bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden mb-6">
  {/* Transaction Details */}
  <div className="p-4 border-b border-slate-100 flex justify-between items-center">
    <span className="text-sm text-slate-500">{t('transactions.amount')}</span>
    <span className="text-lg font-bold text-slate-900">
      ₹{amount.toLocaleString('en-IN')}
    </span>
  </div>

  <div className="p-4 border-b border-slate-100 flex justify-between items-center">
    <span className="text-sm text-slate-500">{t('paymentSuccess.to')}</span>
    <div className="text-right">
      <p className="text-sm font-medium text-slate-900">{recipientName}</p>
      <p className="text-xs text-slate-500">{recipientVPA}</p>
    </div>
  </div>

  {/* Blocking Reasons */}
  <div className="p-4 bg-red-50/50">
    <div className="flex items-start gap-3">
      <AlertTriangle className="text-red-600 mt-0.5" size={18} />
      <div>
        <h3 className="font-bold text-red-900 text-sm mb-1">{t('transactionBlocked.blockingReason')}</h3>
        <ul className="space-y-1">
          {localizedReasons.map((r, i) => (
            <li key={i} className="text-sm text-red-800/80">
              {r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
</div>

{/* Transaction Summary Card */}
<div className="w-full max-w-xl mx-auto mb-6">
  <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
    <div className="px-4 py-3 border-b">
      <h4 className="font-semibold text-gray-800">{t('transactionBlocked.transactionSummary')}</h4>
    </div>

    <div className="divide-y">
      <div className="flex justify-between px-4 py-3 text-sm">
        <span className="text-gray-500">{t('transactionBlocked.receiverVPA')}</span>
        <span className="font-medium">{recipientVPA}</span>
      </div>

      <div className="flex justify-between px-4 py-3 text-sm">
        <span className="text-gray-500">{t('transactions.amount')}</span>
        <span className="font-semibold">₹{amount.toLocaleString('en-IN')}</span>
      </div>

      <div className="flex justify-between px-4 py-3 text-sm">
        <span className="text-gray-500">{t('transactions.riskScore')}</span>
        <span className="font-semibold text-red-600">{riskScore}%</span>
      </div>

      <div className="flex justify-between px-4 py-3 text-sm">
        <span className="text-gray-500">{t('transactionBlocked.decision')}</span>
        <span className="font-semibold text-red-600">{decision}</span>
      </div>
    </div>
  </div>
</div>

          {/* Actions */}
          <div className="w-full space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-white border border-slate-200 text-slate-600 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <Home size={18} />
              {t('transactionBlocked.returnToHome')}
            </button>
          </div>

        </main>
      </div>
    </div>
  );
}

export default TransactionBlocked;