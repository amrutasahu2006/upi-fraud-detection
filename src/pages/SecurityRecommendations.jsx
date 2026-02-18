import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { DollarSign } from "lucide-react";
import AIRecommendationPanel from "../components/AIRecommendationPanel";

function SecurityRecommendations() {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [dailyLimit, setDailyLimit] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const riskFactors = ["newPayee", "highAmount", "newDevice", "enable2FA"];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchDailyLimit();
  }, [isAuthenticated, token]);

  const fetchDailyLimit = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/daily-limit', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success && data.data?.dailyTransactionLimit) {
        setDailyLimit(data.data.dailyTransactionLimit);
      } else {
        setDailyLimit(null);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching daily limit:', error);
      setLoading(false);
    }
  };

  const handleSaveDailyLimit = async () => {
    if (!inputValue || inputValue < 1000) {
      setMessage({ type: 'error', text: '❌ Please enter a limit of at least ₹1000' });
      return;
    }

    setSaving(true);
    try {
      console.log('📤 Sending daily limit:', inputValue, 'Token:', token ? 'Present' : 'Missing');
      const res = await fetch('http://localhost:5000/api/auth/daily-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dailyTransactionLimit: inputValue }),
      });

      const data = await res.json();
      console.log('📥 Backend response:', data);

      if (data.success) {
        setDailyLimit(inputValue);
        setInputValue('');
        setMessage({ type: 'success', text: '✅ Daily limit set successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: `❌ ${data.message || 'Failed to set daily limit'}` });
      }
    } catch (error) {
      console.error('Error saving daily limit:', error);
      setMessage({ type: 'error', text: `❌ ${error.message || 'Error saving daily limit'}` });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveDailyLimit = async () => {
    setSaving(true);
    try {
      console.log('📤 Removing daily limit...');
      const res = await fetch('http://localhost:5000/api/auth/daily-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dailyTransactionLimit: null }),
      });

      const data = await res.json();
      console.log('📥 Backend response:', data);

      if (data.success) {
        setDailyLimit(null);
        setInputValue('');
        setMessage({ type: 'success', text: '✅ Daily limit removed successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: `❌ ${data.message || 'Failed to remove daily limit'}` });
      }
    } catch (error) {
      console.error('Error removing daily limit:', error);
      setMessage({ type: 'error', text: `❌ ${error.message || 'Error removing daily limit'}` });
    } finally {
      setSaving(false);
    }
  };

  const handleRecommendationAction = (recommendation) => {
    console.log(`Action clicked: ${recommendation.action}`, recommendation);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-screen-lg bg-white flex flex-col">
        {/* Page Header */}
        <header className="flex items-center gap-2 md:gap-3 px-4 py-3 md:px-6 md:py-4 border-b">
          <Link to="/" className="text-2xl cursor-pointer">←</Link>
          <h1 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">Security Recommendations</h1>
        </header>

        {/* Main Content */}
        <main className="p-4 md:p-6 lg:p-8">
          
          {/* Message Alert */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          {/* Heading Section */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Recommended Security Actions
            </h2>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              Take these actions to protect your account and reduce loss risk.
            </p>
          </div>

          {/* Daily Transaction Limit Card */}
          <div className="mb-8 bg-gradient-to-br from-green-50 to-green-50 border border-green-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4 md:gap-6">
              <div className="p-3 md:p-4 bg-green-100 rounded-lg">
                <DollarSign size={32} className="text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Set Daily Transaction Limit</h3>
                <p className="text-gray-700 mb-4">
                  Limit how much you can send daily to reduce loss risk.
                </p>
                
                <div className="bg-white rounded-lg p-4 mb-4 border border-green-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Daily Limit (₹)
                  </label>
                  
                  {/* Quick Preset Buttons */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-2">Quick presets:</p>
                    <div className="flex flex-wrap gap-2">
                      {[5000, 10000, 25000, 50000, 100000].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setInputValue(amount)}
                          className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-semibold text-sm border border-blue-200"
                        >
                          ₹{(amount / 1000).toFixed(0)}K
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={inputValue}
                      onChange={(e) => setInputValue(Number(e.target.value) || '')}
                      placeholder="Enter limit amount"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-lg font-semibold"
                      min="1000"
                      step="1000"
                    />
                    <button
                      onClick={handleSaveDailyLimit}
                      disabled={saving || !inputValue}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {saving ? 'Saving...' : 'Set Limits'}
                    </button>
                    {dailyLimit && (
                      <button
                        onClick={handleRemoveDailyLimit}
                        disabled={saving}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {saving ? 'Removing...' : 'Unset'}
                      </button>
                    )}
                  </div>
                  <p className="text-xs mt-2 text-gray-500">
                    Current limit: {dailyLimit ? `₹${dailyLimit.toLocaleString()}` : 'Not Set'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Heading Section */}
          <div className="mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              Stay Secure, Always.
            </h2>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              AI-powered recommendations based on detected risk factors to keep your account safe.
            </p>
          </div>

          {/* AI Recommendation Panel */}
          <AIRecommendationPanel 
            riskFactors={riskFactors} 
            maxRecommendations={4}
            layout="grid"
            onAction={handleRecommendationAction}
          />
        </main>
      </div>
    </div>
  );
}

export default SecurityRecommendations;

