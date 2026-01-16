import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, X, MessageCircle, ShieldAlert } from "lucide-react";

const SecurityWarning = () => {
  const navigate = useNavigate();
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
              This VPA has been reported multiple times for fraudulent activities. 
              Proceeding may result in <span className="font-semibold text-red-600">permanent loss of funds</span>.
            </p>
          </div>

          {/* AI Insight Box - Optimized for readability */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex gap-4 items-start">
            <div className="bg-blue-100 p-2 rounded-lg hidden sm:block">
                <MessageCircle size={18} className="text-blue-600" />
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              <span className="font-bold text-slate-800 block mb-1">AI Risk Analysis:</span>
              This transaction deviates from typical payment patterns. Our system has flagged this VPA for unusual rapid-fire transaction history.
            </p>
          </div>

          {/* Action Area */}
          <div className="space-y-3 sm:space-y-4 pt-2">
            
            <div className="text-left">
              <button onClick={() => navigate('/risk-details')} className="text-red-600 text-sm font-medium hover:underline cursor-pointer">
                Explain why in detail
              </button>
            </div>
            
            {/* Primary Action */}
            <button onClick={() => navigate('/blocked')} className="w-full bg-red-600 text-white py-3.5 sm:py-4 px-4 rounded-xl hover:bg-red-700 active:scale-[0.98] transition-all font-bold text-sm sm:text-base shadow-lg shadow-red-200 cursor-pointer">
              Block & Report VPA
            </button>

            {/* Secondary Actions - Using Grid for Tablet/Desktop to save vertical space */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={() => navigate('/chatbot')} className="w-full flex items-center justify-center space-x-2 bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold cursor-pointer">
                    <MessageCircle size={18} />
                    <span>Ask bot for help</span>
                </button>
                <button onClick={() => navigate('/payment')} className="w-full bg-transparent border border-transparent text-gray-400 py-3 px-4 rounded-xl hover:text-gray-600 hover:bg-gray-100 transition-colors text-sm font-medium cursor-pointer">
                    Proceed Anyway
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityWarning;