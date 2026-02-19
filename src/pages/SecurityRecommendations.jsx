import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { DollarSign, Monitor, Shield, Lock } from "lucide-react";
import AIRecommendationPanel from "../components/AIRecommendationPanel";
import PasswordConfirmModal from "../components/PasswordConfirmModal";
import { useTranslation } from 'react-i18next';

function SecurityRecommendations() {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [dailyLimit, setDailyLimit] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyVpa, setVerifyVpa] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  const riskFactors = ["newPayee"];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchDailyLimit();
    fetch2FAStatus();
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

  const fetch2FAStatus = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/2fa-status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success) {
        setTwoFactorEnabled(data.data.twoFactorEnabled);
      }
      setLoadingStatus(false);
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
      setLoadingStatus(false);
    }
  };

  const handleDisable2FA = async (password) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/disable-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (data.success) {
        setTwoFactorEnabled(false);
        setShowPasswordModal(false);
        setMessage({ type: 'success', text: `✅ ${t('twoFactor.disableSuccess')}` });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        throw new Error(data.message || 'Failed to disable 2FA');
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      throw error;
    }
  };

  const handleSaveDailyLimit = async () => {
    if (!inputValue || inputValue < 1000) {
      setMessage({ type: 'error', text: `❌ ${t('security.dailyLimitMin')}` });
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
        setMessage({ type: 'success', text: `✅ ${t('security.dailyLimitSetSuccess')}` });
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
        setMessage({ type: 'success', text: `✅ ${t('security.dailyLimitRemovedSuccess')}` });
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
    if (recommendation?.key === 'newPayee') {
      setVerifyResult(null);
      setVerifyVpa('');
      setShowVerifyModal(true);
      return;
    }

    if (recommendation?.key === 'newDevice') {
      navigate('/connected-devices');
      return;
    }

    if (recommendation?.key === 'enable2FA') {
      navigate('/setup-2fa');
      return;
    }

    if (recommendation?.key === 'highAmount') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setMessage({ type: 'success', text: `✅ ${t('security.dailyLimitDescription')}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 2500);
      return;
    }

    console.log(`Action clicked: ${recommendation.action}`, recommendation);
  };

  const handleVerifyRecipient = async () => {
    if (!verifyVpa.trim()) {
      setVerifyResult({
        success: false,
        message: t('security.verifyEnterVpa', 'Please enter a VPA to verify.'),
      });
      return;
    }

    setVerifyLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/blacklist/check?vpa=${encodeURIComponent(verifyVpa.trim())}`
      );
      const data = await response.json();
      setVerifyResult(data);
    } catch (error) {
      setVerifyResult({
        success: false,
        message: error?.message || t('common.error'),
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-slate-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-screen-lg bg-white flex flex-col">
        {/* Page Header */}
        <header className="flex items-center gap-2 md:gap-3 px-4 py-3 md:px-6 md:py-4 border-b">
          <Link to="/" className="text-2xl cursor-pointer">←</Link>
          <h1 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">{t('security.title')}</h1>
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
              {t('security.recommendations')}
            </h2>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              {t('security.subtitle')}
            </p>
          </div>

          {/* Daily Transaction Limit Card */}
          <div className="mb-8 bg-gradient-to-br from-green-50 to-green-50 border border-green-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4 md:gap-6">
              <div className="p-3 md:p-4 bg-green-100 rounded-lg">
                <DollarSign size={32} className="text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{t('security.dailyLimitTitle')}</h3>
                <p className="text-gray-700 mb-4">
                  {t('security.dailyLimitDescription')}
                </p>
                
                <div className="bg-white rounded-lg p-4 mb-4 border border-green-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {t('security.dailyLimitLabel')}
                  </label>
                  
                  {/* Quick Preset Buttons */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-2">{t('security.quickPresets')}</p>
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
                      placeholder={t('security.dailyLimitLabel')}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-lg font-semibold"
                      min="1000"
                      step="1000"
                    />
                    <button
                      onClick={handleSaveDailyLimit}
                      disabled={saving || !inputValue}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {saving ? t('common.saving') : t('security.setLimits')}
                    </button>
                    {dailyLimit && (
                      <button
                        onClick={handleRemoveDailyLimit}
                        disabled={saving}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {saving ? t('common.removing') : t('security.unset')}
                      </button>
                    )}
                  </div>
                  <p className="text-xs mt-2 text-gray-500">
                    {t('security.currentLimit')}: {dailyLimit ? `₹${dailyLimit.toLocaleString()}` : t('security.notSet')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Two-Factor Authentication Card */}
          <div className="mb-8 bg-gradient-to-br from-green-50 to-green-50 border border-green-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4 md:gap-6">
              <div className="p-3 md:p-4 bg-green-100 rounded-lg">
                <Shield size={32} className="text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900">{t('twoFactor.title')}</h3>
                  {twoFactorEnabled && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      {t('security.twoFactorCard.statusEnabled')}
                    </span>
                  )}
                </div>
                <p className="text-gray-700 mb-4">
                  {twoFactorEnabled
                    ? t('security.twoFactorEnabledDesc')
                    : t('security.twoFactorDisabledDesc')}
                </p>
                
                {twoFactorEnabled ? (
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="w-full md:w-auto px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                  >
                    {t('twoFactor.disable')}
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/setup-2fa')}
                    className="w-full md:w-auto px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    {t('twoFactor.enable')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Review Connected Devices Card */}
          <div className="mb-8 bg-gradient-to-br from-red-50 to-red-50 border border-red-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4 md:gap-6">
              <div className="p-3 md:p-4 bg-red-100 rounded-lg">
                <Monitor size={32} className="text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{t('security.reviewDevicesTitle')}</h3>
                <p className="text-gray-700 mb-4">
                  {t('security.reviewDevicesDesc')}
                </p>
                
                <button
                  onClick={() => navigate('/connected-devices')}
                  className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  {t('security.reviewDevicesAction')}
                </button>
              </div>
            </div>
          </div>

          {/* AI Recommendation Panel */}
          <AIRecommendationPanel 
            riskFactors={riskFactors} 
            maxRecommendations={1}
            layout="list"
            variant="feature"
            onAction={handleRecommendationAction}
          />
        </main>
      </div>

      {/* Password Confirmation Modal for Disabling 2FA */}
      {showPasswordModal && (
        <PasswordConfirmModal
          title={t('twoFactor.disableTitle')}
          message={t('twoFactor.enterPassword')}
          onConfirm={handleDisable2FA}
          onCancel={() => setShowPasswordModal(false)}
        />
      )}

      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {t('security.verifyRecipientTitle', 'Verify Recipient Identity')}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('security.verifyRecipientDesc', 'Enter the recipient VPA to check if it is safe, whitelisted, or flagged.')}
            </p>

            <input
              type="text"
              value={verifyVpa}
              onChange={(e) => setVerifyVpa(e.target.value)}
              placeholder={t('payment.upiIdPlaceholder')}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4"
            />

            {verifyResult && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm border ${
                  verifyResult.flagged
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : verifyResult.whitelisted
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : verifyResult.unknown
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {verifyResult.message}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleVerifyRecipient}
                disabled={verifyLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {verifyLoading
                  ? t('common.loading')
                  : t('security.verifyAction', 'Verify Contact')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SecurityRecommendations;

