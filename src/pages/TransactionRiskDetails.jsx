import React from "react";
import { Clock, Smartphone, MapPin, UserPlus, BarChart, ChevronRight, ShieldAlert } from "lucide-react";

const TransactionRiskDetails = () => {
  const riskFactors = [
    {
      icon: Clock,
      title: "Time Anomaly",
      description: "Transaction occurred at an unusual time compared to your typical payment patterns."
    },
    {
      icon: Smartphone,
      title: "Device Change",
      description: "Payment initiated from a device that hasn't been used for transactions before."
    },
    {
      icon: MapPin,
      title: "Location Deviation",
      description: "Transaction location differs significantly from your usual payment locations."
    },
    {
      icon: UserPlus,
      title: "New Payee",
      description: "First-time payment to this recipient, increasing potential fraud risk."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Main Content Area - Responsive padding */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12">
        
        {/* Page Header - Responsive text sizes */}
        <header className="mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
                Transaction Risk Details
            </h1>
            <p className="text-slate-500 mt-2 text-sm sm:text-base">
                Internal Security Analysis for Transaction ID: <span className="font-mono font-medium text-slate-700">#TRX-99281</span>
            </p>
        </header>

        {/* Layout Grid: 
            Stacked on Mobile
            2 Columns on Tablet (Risk indicators taking priority)
            3 Columns on Desktop (Sidebar appears)
        */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* LEFT SIDE: Risk Indicators */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                    Detected Risk Indicators
                    <span className="px-2.5 py-0.5 text-[10px] sm:text-xs bg-red-100 text-red-600 rounded-full font-bold uppercase tracking-wider border border-red-200">
                        High Alert
                    </span>
                </h2>
            </div>
            
            {/* Cards Grid: 1 col on mobile, 2 col on tablet/desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {riskFactors.map((factor, index) => (
                <div 
                    key={index} 
                    className="group bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 hover:shadow-md hover:border-blue-400 transition-all duration-300"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                    <factor.icon size={24} className="text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mb-2 text-slate-800">{factor.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-xs sm:text-sm">
                    {factor.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE: AI Score Card */}
          <div className="lg:col-span-1">
            {/* 'sticky' only applied on desktop screens to prevent mobile scroll issues */}
            <div className="lg:sticky lg:top-8 bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-900/5 relative overflow-hidden">
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
              
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 shadow-lg shadow-blue-200 rotate-3">
                  <BarChart size={32} className="text-white sm:w-9 sm:h-9" />
                </div>
                
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
                  AI Risk Probability
                </h3>
                <div className="text-5xl sm:text-6xl font-black text-slate-900 mb-4">92%</div>
                
                {/* Responsive Progress Bar */}
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden mb-6">
                  <div className="h-full bg-red-500 rounded-full transition-all duration-1000" style={{ width: '92%' }}></div>
                </div>
                
                <blockquote className="text-slate-500 leading-relaxed italic text-sm sm:text-base border-l-4 border-blue-100 pl-4 text-left">
                  "This transaction deviates significantly from your established payment patterns and requires immediate manual review."
                </blockquote>
                
                {/* Button Stack: Optimized for mobile thumb reach */}
                <div className="w-full space-y-3 mt-8">
                    <button className="w-full bg-slate-900 text-white py-3.5 sm:py-4 rounded-xl font-bold hover:bg-slate-800 active:scale-95 transition-all shadow-lg text-sm sm:text-base">
                        Flag as Fraud
                    </button>
                    <button className="w-full bg-white text-slate-600 py-3.5 sm:py-4 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all text-sm sm:text-base">
                        I Recognize This
                    </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default TransactionRiskDetails;