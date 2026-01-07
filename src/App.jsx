import { BrowserRouter, Routes, Route } from "react-router-dom";

// Importing all pages
import SecurityChatbot from "./pages/SecurityChatbot";
import SecurityRecommendations from "./pages/SecurityRecommendations";
import TransactionBlocked from "./pages/TransactionBlocked";
import SecurityWarning from "./pages/SecurityWarning";
import UPIPayment from "./pages/UPIPayment";
import TransactionRiskDetails from "./pages/TransactionRiskDetails";
import Safety from "./pages/Safety";
import PrivacySettings from "./pages/PrivacySettings";
import FraudAnalytics from "./pages/FraudAnalytics";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Landing / Warning */}
        <Route path="/" element={<SecurityWarning />} />
        <Route path="/chatbot" element={<SecurityChatbot />} />
        
        {/* Security & Recommendations */}
        <Route path="/recommendations" element={<SecurityRecommendations />} />
        <Route path="/safety" element={<Safety />} />
        <Route path="/privacy-settings" element={<PrivacySettings />} />
        
        {/* Analytics Section */}
        <Route path="/fraud-analytics" element={<FraudAnalytics />} />
        
        {/* Transaction & Risk Flow */}
        <Route path="/payment" element={<UPIPayment />} />
        <Route path="/blocked" element={<TransactionBlocked />} />
        <Route path="/risk-details" element={<TransactionRiskDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;