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
import Header from "./components/Header";

// Import auth pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import UnauthorizedPage from "./pages/auth/UnauthorizedPage";
import ProfilePage from "./pages/auth/ProfilePage";

// Import admin pages
import UserManagementPage from "./pages/admin/UserManagementPage";

// Import context
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <Routes>
          {/* Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagementPage />
              </ProtectedRoute>
            } 
          />
          
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
    </AuthProvider>
  );
}

export default App;