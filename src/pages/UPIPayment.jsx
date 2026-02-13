import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Shield, Paperclip, CreditCard, ShieldCheck, 
  ChevronRight, User, Info, Wallet
} from "lucide-react";
import { useTransaction } from "../context/TransactionContext";
import { analyzeTransaction } from "../services/mockApi";
import { useAuth } from "../context/AuthContext";

function UPIPaymentClean() {
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [upiId, setUpiId] = useState("");
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { startTransaction, setAnalysisResult, setIsAnalyzing, setUserLocation } = useTransaction();
  const { token } = useAuth();

  const amounts = [500, 1000, 2000, 5000];
  const quickContacts = [
    { name: "Rahul", upi: "rahul@okaxis", color: "bg-orange-100 text-orange-700" },
    { name: "Priya", upi: "priya@okicici", color: "bg-purple-100 text-purple-700" },
    { name: "Amit", upi: "amit@oksbi", color: "bg-blue-100 text-blue-700" },
  ];

  // Get user's current location
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          });
        },
        (error) => {
          console.warn('Location access denied or failed:', error);
          resolve(null); // Resolve with null instead of rejecting
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  };

  // Handle payment submission with risk analysis
  // Handle payment submission with risk analysis
  const handlePayment = async () => {
    if (!upiId || !selectedAmount) {
      alert("Please enter UPI ID and amount");
      return;
    }

    setIsProcessing(true);
    setIsAnalyzing(true);
    
    try {
      // Step 0: Check VPA blacklist
      console.log('🔍 Checking VPA blacklist for:', upiId);
      const blacklistResponse = await fetch(`http://localhost:5000/api/blacklist/check?vpa=${encodeURIComponent(upiId)}`);
      const blacklistData = await blacklistResponse.json();
      
      if (blacklistData.flagged) {
        setIsAnalyzing(false);
        setIsProcessing(false);
        
        // SAVE AS BLOCKED immediately
        startTransaction({
            amount: selectedAmount,
            payeeUpiId: upiId,
            recipient: { name: upiId.split('@')[0], upi: upiId, isNewPayee: true },
            timestamp: new Date().toISOString(),
            status: 'blocked', // <--- IMPORTANT
            isBlocked: true,
            riskScore: 100
        });

        alert(`⚠️ TRANSACTION BLOCKED\n\nRecipient flagged: ${blacklistData.reason}`);
        return;
      }

      // Prepare Data
      const userLocation = await getCurrentLocation();
      if (userLocation) setUserLocation(userLocation);

      const isNewPayee = !quickContacts.some(c => c.upi === upiId);
      const isHighAmount = selectedAmount > 10000;
      const currentHour = new Date().getHours();
      const isUnusualTime = currentHour < 6 || currentHour > 22;

      const transactionData = {
        amount: selectedAmount,
        payeeUpiId: upiId,
        recipient: {
          name: upiId.split('@')[0],
          upi: upiId,
          isNewPayee: isNewPayee
        },
        location: userLocation,
        note,
        timestamp: new Date().toISOString(),
        isNewPayee,
        isHighAmount,
        isNewDevice: false,
        isUnusualTime,
        isNewLocation: false
      };

      // ❌ DELETED: startTransaction(transactionData); 
      // We removed the line above so we don't save it too early!

      console.log("📤 Sending transaction for analysis:", transactionData);
      const result = await analyzeTransaction(transactionData);

      setIsAnalyzing(false);
      setIsProcessing(false);

      if (result.success) {
        setAnalysisResult(result.data);
        
        setTimeout(() => {
          const decision = result.data.decision;
          const riskScore = result.data.riskScore || 0;
          console.log('🎯 Routing based on decision:', decision, 'Risk score:', riskScore);

          // 1. BLOCK Logic
          if (decision === 'BLOCK' || riskScore >= 80) {
            console.log('🛑 Critical Risk - Blocking Transaction');
            
            // ✅ SAVE AS BLOCKED HERE
            startTransaction({
                ...transactionData,
                status: 'blocked', // This makes it red in history
                riskScore: riskScore,
                isBlocked: true
            });

            navigate('/blocked', { 
                state: { 
                    reason: result.data.detailedReasons?.[0] || "High Risk Detected",
                    riskScore: riskScore
                } 
            });
            return;
          }

          // 2. WARNING Logic
          if ((decision && decision !== 'APPROVE') || riskScore >= 30) {
            console.log('➡️ Navigating to /security-warning');
            
            // Optional: Save as pending or warning
            startTransaction({
                ...transactionData,
                status: 'pending',
                riskScore: riskScore,
                isBlocked: false
            });

            navigate('/security-warning');
            return;
          }

          // 3. SUCCESS Logic
          console.log('✅ Payment approved');
          
          // ✅ SAVE AS COMPLETED HERE
          startTransaction({
            ...transactionData,
            status: 'completed', // This makes it green in history
            riskScore: riskScore,
            isBlocked: false
          });

          navigate('/payment-success');
        }, 100);
      } else {
        alert(result.message || 'Risk analysis failed.');
      }
    } catch (error) {
      console.error("Error:", error);
      setIsProcessing(false);
      setIsAnalyzing(false);
      alert("Something went wrong: " + error.message);
    }
  };

  const selectQuickContact = (contact) => {
    setUpiId(contact.upi);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-screen-lg bg-white flex flex-col">
        {/* Page Header */}
        <header className="flex items-center gap-2 md:gap-3 px-4 py-3 md:px-6 md:py-4 border-b">
          <Wallet className="text-blue-600" size={24} />
          <h1 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">Send Money</h1>
        </header>

        {/* Main Content */}
        <main className="p-4 md:p-6 lg:p-8">
        
        {/* Page Heading Section - Scaled text for mobile */}
        <div className="mb-8 lg:mb-12">
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
                      className={`px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 font-bold transition-all text-sm sm:text-lg cursor-pointer ${
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
                  <button 
                    onClick={handlePayment}
                    disabled={isProcessing || !upiId || !selectedAmount}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-5 sm:py-6 rounded-2xl sm:rounded-3xl font-bold text-xl sm:text-2xl shadow-[0_20px_50px_rgba(37,99,235,0.2)] transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {isProcessing ? "Analyzing..." : `Send ₹${selectedAmount?.toLocaleString()}`}
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
          <div className="lg:col-span-4 space-y-4 sm:space-y-8">
            
            {/* Recent Recipients - Horizontal scroll on mobile for better UX */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 shadow-sm">
              <h3 className="font-bold text-slate-900 text-lg sm:text-xl mb-4 sm:mb-6">Recent Recipients</h3>
              <div className="space-y-2 sm:space-y-3">
                {quickContacts.map((contact) => (
                  <button 
                    key={contact.name} 
                    onClick={() => selectQuickContact(contact)}
                    className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-slate-50 rounded-xl sm:rounded-2xl transition-all group border border-transparent hover:border-slate-100 cursor-pointer"
                  >
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
    </div>
  );
}

export default UPIPaymentClean;