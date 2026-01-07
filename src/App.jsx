import { BrowserRouter, Routes, Route } from "react-router-dom";
import SecurityChatbot from "./pages/SecurityChatbot";
import SecurityRecommendations from "./pages/SecurityRecommendations";
import TransactionBlocked from "./pages/TransactionBlocked";
import Safety from "./pages/Safety";
import PrivacySettings from "./pages/PrivacySettings";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SecurityChatbot />} />
        <Route path="/recommendations" element={<SecurityRecommendations />} />
        <Route path="/blocked" element={<TransactionBlocked />} />
        <Route path="/safety" element={<Safety />} />
        <Route path="/privacy-settings" element={<PrivacySettings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
