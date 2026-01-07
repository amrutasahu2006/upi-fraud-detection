import { useState } from "react";
import { 
  Shield, Paperclip, CreditCard, ShieldCheck, 
  ChevronRight, User, Info 
} from "lucide-react";

function UPIPaymentClean() {
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [upiId, setUpiId] = useState("");
  const [note, setNote] = useState("");

  const amounts = [500, 1000, 2000, 5000];
  const quickContacts = [
    { name: "Rahul", upi: "rahul@okaxis", color: "bg-orange-100 text-orange-700" },
    { name: "Priya", upi: "priya@okicici", color: "bg-purple-100 text-purple-700" },
    { name: "Amit", upi: "amit@oksbi", color: "bg-blue-100 text-blue-700" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100">
      
      {/* 1. Main Content Wrapper - Responsive vertical padding */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-16 lg:py-24">
        
        {/* Page Heading Section - Scaled text for mobile */}
        <div className="mb-8 lg:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-2 sm:mb-4 tracking-tight">
            Send Money
          </h1>
          <p className="text-base sm:text-xl text-slate-500 max-w-2xl font-medium">
            Complete your transaction securely. Funds are transferred instantly.
          </p>
        </div>

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: Payment Form (8 Columns) */}
          <div className="lg:col-span-8">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 lg:p-12 shadow-sm">
              
              {/* Amount Entry Area - Key fix: Font size scaling */}
              <section className="mb-8 sm:mb-12">
                <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] block mb-4 sm:mb-8">
                  Transaction Amount
                </label>
                <div className="flex items-center space-x-3 sm:space-x-4 border-b-2 border-slate-100 pb-4 sm:pb-6 focus-within:border-blue-500 transition-all mb-6 sm:mb-8">
                  <span className="text-3xl sm:text-5xl font-light text-slate-300">₹</span>
                  <input 
                    type="number" 
                    value={selectedAmount || ""} 
                    onChange={(e) => setSelectedAmount(Number(e.target.value))}
                    className="text-4xl sm:text-6xl lg:text-7xl font-bold text-slate-900 border-none p-0 focus:ring-0 w-full placeholder:text-slate-100"
                    placeholder="0"
                  />
                </div>
                
                {/* Amount Chips - Grid for mobile consistency */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4">
                  {amounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setSelectedAmount(amount)}
                      className={`px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 font-bold transition-all text-sm sm:text-lg ${
                        selectedAmount === amount
                          ? "border-blue-600 bg-blue-50 text-blue-600 shadow-lg shadow-blue-100"
                          : "border-slate-100 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      ₹{amount}
                    </button>
                  ))}
                </div>
              </section>

              {/* Recipient Details Area */}
              <section className="space-y-6 sm:space-y-8">
                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] block mb-3 sm:mb-4">Recipient VPA (UPI ID)</label>
                  <div className="relative group">
                    <User className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. username@bank"
                      className="w-full pl-12 sm:pl-16 pr-6 sm:pr-8 py-4 sm:py-6 bg-slate-50 border border-slate-200 rounded-2xl sm:rounded-3xl focus:bg-white focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 transition-all text-base sm:text-xl font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] block mb-3 sm:mb-4">Transaction Message</label>
                  <div className="relative group">
                    <Paperclip className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Optional note"
                      className="w-full pl-12 sm:pl-16 pr-6 sm:pr-8 py-4 sm:py-6 bg-slate-50 border border-slate-200 rounded-2xl sm:rounded-3xl focus:bg-white focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 transition-all text-base sm:text-xl font-medium"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 sm:py-6 rounded-2xl sm:rounded-3xl font-bold text-xl sm:text-2xl shadow-[0_20px_50px_rgba(37,99,235,0.2)] transition-all active:scale-[0.98]">
                    Send ₹{selectedAmount?.toLocaleString()}
                  </button>
                  
                  <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo.png" alt="UPI" className="h-4 sm:h-5 opacity-40 grayscale" />
                      <div className="hidden sm:block h-4 w-px bg-slate-200"></div>
                      <p className="text-slate-400 text-xs sm:text-sm font-medium flex items-center">
                        <ShieldCheck size={16} className="mr-2 text-green-500" />
                        Secure Encrypted Transaction
                      </p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar (4 Columns) */}
          <div className="lg:col-span-4 space-y-6 sm:space-y-8">
            
            {/* Recent Recipients - Horizontal scroll on mobile for better UX */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 shadow-sm">
              <h3 className="font-bold text-slate-900 text-lg sm:text-xl mb-4 sm:mb-6">Recent Recipients</h3>
              <div className="space-y-2 sm:space-y-3">
                {quickContacts.map((contact) => (
                  <button key={contact.name} className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-slate-50 rounded-xl sm:rounded-2xl transition-all group border border-transparent hover:border-slate-100">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-lg sm:text-xl ${contact.color}`}>
                        {contact.name[0]}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-900 text-sm sm:text-base">{contact.name}</p>
                        <p className="text-[10px] sm:text-xs text-slate-400 font-semibold">{contact.upi}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-200 group-hover:text-blue-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* Safety Card */}
            <div className="bg-orange-50/30 border border-orange-100 rounded-[2rem] p-6 sm:p-8">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <Info size={20} className="text-orange-500 shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-orange-900 text-sm sm:text-base mb-1">Security Advice</h4>
                  <p className="text-orange-800/70 text-xs sm:text-sm leading-relaxed">
                    Always verify the receiver's name before entering your secret UPI PIN. 
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default UPIPaymentClean;