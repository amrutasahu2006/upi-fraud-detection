import { BrowserRouter, Routes, Route } from "react-router-dom";
import SecurityChatbot from "./pages/SecurityChatbot";
import SecurityRecommendations from "./pages/SecurityRecommendations";
import TransactionBlocked from "./pages/TransactionBlocked";
import SecurityWarning from "./pages/SecurityWarning";
import UPIPayment from "./pages/UPIPayment";
import TransactionRiskDetails from "./pages/TransactionRiskDetails";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SecurityChatbot />} />
        <Route path="/recommendations" element={<SecurityRecommendations />} />
        <Route path="/blocked" element={<TransactionBlocked />} />
        <Route path="/warning" element={<SecurityWarning />} />
        <Route path="/payment" element={<UPIPayment />} />
        <Route path="/risk-details" element={<TransactionRiskDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
