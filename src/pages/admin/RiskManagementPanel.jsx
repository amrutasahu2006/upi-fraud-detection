import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, AlertTriangle, CheckCircle, XCircle, Settings } from 'lucide-react';

/**
 * Admin Panel for Risk Management
 * - Configure risk thresholds
 * - Manage blacklist/whitelist
 * - View system statistics
 */
export default function RiskManagementPanel() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('thresholds');
  const [thresholds, setThresholds] = useState(null);
  const [blacklist, setBlacklist] = useState([]);
  const [whitelist, setWhitelist] = useState([]);
  const [fraudBlacklist, setFraudBlacklist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Threshold state
  const [blockThreshold, setBlockThreshold] = useState(80);
  const [delayThreshold, setDelayThreshold] = useState(60);
  const [warnThreshold, setWarnThreshold] = useState(30);

  // Blacklist form state
  const [newBlacklistEntry, setNewBlacklistEntry] = useState({
    vpa: '',
    reason: '',
    severity: 'high'
  });

  // Whitelist form state
  const [newWhitelistEntry, setNewWhitelistEntry] = useState({
    vpa: '',
    reason: '',
    severity: 'low',
    override: false
  });
  const [whitelistError, setWhitelistError] = useState(null);
  const [showOverrideOption, setShowOverrideOption] = useState(false);

  useEffect(() => {
    if (activeTab === 'thresholds') {
      fetchThresholds();
    } else if (activeTab === 'blacklist') {
      fetchBlacklist();
    } else if (activeTab === 'whitelist') {
      fetchWhitelist();
    } else if (activeTab === 'fraudBlacklist') {
      fetchFraudBlacklist();
    }
  }, [activeTab]);

  const fetchThresholds = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: t('admin.authRequired', 'Authentication required. Please login first.') });
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/analysis/thresholds', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        const t = result.data.thresholds;
        setThresholds(result.data);
        setBlockThreshold(t.BLOCK);
        setDelayThreshold(t.DELAY);
        setWarnThreshold(t.WARN);
        console.log('✅ Thresholds loaded:', t);
      } else {
        setMessage({ type: 'error', text: result.message || t('admin.thresholdLoadFailed', 'Failed to load thresholds') });
      }
    } catch (error) {
      console.error('Error fetching thresholds:', error);
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    }
  };

  const updateThresholds = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/analysis/thresholds', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          BLOCK: blockThreshold,
          DELAY: delayThreshold,
          WARN: warnThreshold
        })
      });

      const result = await response.json();
      if (result.success) {
        setMessage({ type: 'success', text: t('admin.thresholdUpdateSuccess', 'Thresholds updated successfully!') });
        fetchThresholds();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('admin.thresholdUpdateFailed', 'Failed to update thresholds') });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const fetchBlacklist = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: t('admin.authRequired', 'Authentication required. Please login first.') });
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/lists/blacklist', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setBlacklist(result.data);
        console.log('✅ Blacklist loaded:', result.data.length, 'entries');
      } else {
        setMessage({ type: 'error', text: result.message || t('admin.blacklistLoadFailed', 'Failed to load blacklist') });
      }
    } catch (error) {
      console.error('Error fetching blacklist:', error);
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    }
  };

  const addToBlacklist = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/lists/blacklist', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newBlacklistEntry)
      });

      const result = await response.json();
      if (result.success) {
        setMessage({ type: 'success', text: t('admin.blacklistAddSuccess', 'Added to blacklist successfully!') });
        setNewBlacklistEntry({ vpa: '', reason: '', severity: 'high' });
        fetchBlacklist();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('admin.blacklistAddFailed', 'Failed to add to blacklist') });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const fetchWhitelist = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/lists/whitelist', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setWhitelist(result.data);
        console.log('✅ Whitelist loaded:', result.data.length, 'entries');
      } else {
        setMessage({ type: 'error', text: result.message || t('admin.whitelistLoadFailed', 'Failed to load whitelist') });
      }
    } catch (error) {
      console.error('Error fetching whitelist:', error);
    }
  };

  const addToWhitelist = async (e) => {
    e.preventDefault();
    if (!newWhitelistEntry.vpa || !newWhitelistEntry.reason) {
      setWhitelistError('VPA and reason are required');
      return;
    }

    setLoading(true);
    setWhitelistError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/lists/whitelist', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vpa: newWhitelistEntry.vpa,
          reason: newWhitelistEntry.reason,
          override: newWhitelistEntry.override
        })
      });

      const result = await response.json();
      if (result.success) {
        const successMsg = result.wasOverride 
          ? `✅ ${t('admin.whitelistAddSuccess')} (Admin Override)`
          : t('admin.whitelistAddSuccess');
        setMessage({ type: 'success', text: successMsg });
        setNewWhitelistEntry({ vpa: '', reason: '', severity: 'low', override: false });
        setShowOverrideOption(false);
        fetchWhitelist();
      } else {
        // Handle blacklist error with override option
        if (result.isBlacklisted && result.canOverride) {
          setWhitelistError(`${result.message}. ${result.blacklistReason ? `Reason: ${result.blacklistReason}` : ''}`);
          setShowOverrideOption(true);
          setMessage(null);
        } else {
          setMessage({ type: 'error', text: result.message || t('admin.whitelistAddFailed') });
          setShowOverrideOption(false);
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setLoading(false);
      if (message) {
        setTimeout(() => setMessage(null), 3000);
      }
    }
  };

  const fetchFraudBlacklist = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: t('admin.authRequired', 'Authentication required. Please login first.') });
        return;
      }
      
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/blacklist/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', response.status, errorData);
        throw new Error(errorData.message || `API returned ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setFraudBlacklist(result.data || []);
        console.log('✅ Fraud blacklist loaded:', result.data?.length || 0, 'entries');
        if (result.data?.length === 0) {
          setMessage({ type: 'success', text: 'Fraud blacklist is empty' });
        }
      } else {
        setMessage({ type: 'error', text: result.message || t('admin.fraudBlacklistFailed', 'Failed to load fraud blacklist') });
      }
    } catch (error) {
      console.error('Error fetching fraud blacklist:', error);
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const removeFromWhitelist = async (id) => {
    if (!window.confirm('Remove from whitelist?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/lists/whitelist/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      if (result.success) {
        setMessage({ type: 'success', text: t('admin.whitelistRemoveSuccess', 'Removed from whitelist') });
        fetchWhitelist();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const removeFromBlacklist = async (id) => {
    if (!confirm(t('admin.blacklistRemoveConfirm', 'Are you sure you want to remove this entry from blacklist?'))) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/lists/blacklist/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      if (result.success) {
        setMessage({ type: 'success', text: t('admin.blacklistRemoveSuccess', 'Removed from blacklist') });
        fetchBlacklist();
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('admin.blacklistRemoveFailed', 'Failed to remove from blacklist') });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{t('admin.riskManagement')}</h1>
              <p className="text-gray-600">{t('admin.riskPanelSubtitle', 'Configure risk thresholds and manage blacklist/whitelist')}</p>
              <p className="text-sm text-blue-600 mt-2">✅ Panel loaded successfully</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('thresholds')}
              className={`flex-1 py-4 px-6 font-semibold transition-all ${
                activeTab === 'thresholds'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="inline-block w-5 h-5 mr-2" />
              {t('admin.thresholds', 'Thresholds')}
            </button>
            <button
              onClick={() => setActiveTab('blacklist')}
              className={`flex-1 py-4 px-6 font-semibold transition-all ${
                activeTab === 'blacklist'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <XCircle className="inline-block w-5 h-5 mr-2" />
              {t('admin.blacklist', 'Blacklist')}
            </button>
            <button
              onClick={() => setActiveTab('whitelist')}
              className={`flex-1 py-4 px-6 font-semibold transition-all ${
                activeTab === 'whitelist'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CheckCircle className="inline-block w-5 h-5 mr-2" />
              {t('admin.whitelist', 'Whitelist')}
            </button>
            <button
              onClick={() => setActiveTab('fraudBlacklist')}
              className={`flex-1 py-4 px-6 font-semibold transition-all ${
                activeTab === 'fraudBlacklist'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <AlertTriangle className="inline-block w-5 h-5 mr-2" />
              {t('admin.fraudBlacklist', 'Fraud Blacklist')}
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Threshold Configuration */}
        {activeTab === 'thresholds' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold mb-6 text-gray-800">{t('admin.riskThresholds', 'Risk Score Thresholds')}</h2>
            
            <div className="space-y-6">
              {/* BLOCK Threshold */}
              <div className="p-6 bg-red-50 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-6 h-6 text-red-600" />
                    <div>
                      <h3 className="font-bold text-gray-800">Block Threshold</h3>
                      <p className="text-sm text-gray-600">{t('admin.blockThresholdDesc', 'Transactions with score ≥ this will be blocked')}</p>
                    </div>
                  </div>
                  <span className="text-3xl font-bold text-red-600">{blockThreshold}</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="100"
                  value={blockThreshold}
                  onChange={(e) => setBlockThreshold(parseInt(e.target.value))}
                  className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* DELAY Threshold */}
              <div className="p-6 bg-orange-50 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                    <div>
                      <h3 className="font-bold text-gray-800">Delay Threshold</h3>
                      <p className="text-sm text-gray-600">{t('admin.delayThresholdDesc', 'Transactions between this and block will be delayed')}</p>
                    </div>
                  </div>
                  <span className="text-3xl font-bold text-orange-600">{delayThreshold}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="80"
                  value={delayThreshold}
                  onChange={(e) => setDelayThreshold(parseInt(e.target.value))}
                  className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* WARN Threshold */}
              <div className="p-6 bg-yellow-50 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                    <div>
                      <h3 className="font-bold text-gray-800">Warning Threshold</h3>
                      <p className="text-sm text-gray-600">{t('admin.warnThresholdDesc', 'Transactions between this and delay will show warning')}</p>
                    </div>
                  </div>
                  <span className="text-3xl font-bold text-yellow-600">{warnThreshold}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="60"
                  value={warnThreshold}
                  onChange={(e) => setWarnThreshold(parseInt(e.target.value))}
                  className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Summary */}
              <div className="p-6 bg-blue-50 rounded-xl">
                <h3 className="font-bold mb-3 text-gray-800">{t('admin.decisionSummary', 'Decision Summary')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Score {blockThreshold}-100:</span>
                    <span className="font-bold text-red-600">🚫 BLOCK</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Score {delayThreshold}-{blockThreshold - 1}:</span>
                    <span className="font-bold text-orange-600">⏳ DELAY (5 min)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Score {warnThreshold}-{delayThreshold - 1}:</span>
                    <span className="font-bold text-yellow-600">⚠️ WARN</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Score 0-{warnThreshold - 1}:</span>
                    <span className="font-bold text-green-600">✅ APPROVE</span>
                  </div>
                </div>
              </div>

              <button
                onClick={updateThresholds}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                {loading ? t('common.loading') : t('admin.updateThresholds', 'Update Thresholds')}
              </button>
            </div>
          </div>
        )}

        {/* Blacklist Management */}
        {activeTab === 'blacklist' && (
          <div className="space-y-6">
            {/* Add to Blacklist Form */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-bold mb-6 text-gray-800">{t('admin.addBlacklist', 'Add to Blacklist')}</h2>
              <form onSubmit={addToBlacklist} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">{t('admin.vpaId', 'VPA ID')} *</label>
                  <input
                    type="text"
                    value={newBlacklistEntry.vpa}
                    onChange={(e) => setNewBlacklistEntry({ ...newBlacklistEntry, vpa: e.target.value })}
                    placeholder="fraud@paytm"
                    required
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">{t('admin.reason', 'Reason')} *</label>
                  <textarea
                    value={newBlacklistEntry.reason}
                    onChange={(e) => setNewBlacklistEntry({ ...newBlacklistEntry, reason: e.target.value })}
                    placeholder="Reported for fraudulent activity..."
                    required
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">{t('admin.severity', 'Severity')}</label>
                  <select
                    value={newBlacklistEntry.severity}
                    onChange={(e) => setNewBlacklistEntry({ ...newBlacklistEntry, severity: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 transition-all"
                >
                  {loading ? t('common.loading') : t('admin.addBlacklist', 'Add to Blacklist')}
                </button>
              </form>
            </div>

            {/* Blacklist Entries */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-bold mb-6 text-gray-800">
                {t('admin.blacklistEntries', 'Blacklist Entries')} ({blacklist.length})
              </h2>
              
              {blacklist.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t('admin.noBlacklist', 'No blacklist entries yet')}</p>
              ) : (
                <div className="space-y-3">
                  {blacklist.map((entry) => (
                    <div key={entry._id} className="p-4 bg-red-50 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-800">{entry.vpa || entry.phoneNumber}</p>
                        <p className="text-sm text-gray-600">{entry.reason}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className={`px-2 py-1 rounded ${
                            entry.severity === 'critical' ? 'bg-red-200 text-red-800' :
                            entry.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                            'bg-yellow-200 text-yellow-800'
                          }`}>
                            {entry.severity}
                          </span>
                          <span>Added: {new Date(entry.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromBlacklist(entry._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                      >
                        {t('connectedDevices.remove')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Whitelist Management */}
        {activeTab === 'whitelist' && (
          <div className="space-y-6">
            {/* Add to Whitelist Form */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-bold mb-6 text-gray-800">{t('admin.addWhitelist', 'Add to Whitelist')}</h2>
              
              {whitelistError && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
                  <p className="font-semibold mb-2">⚠️ {whitelistError}</p>
                </div>
              )}

              <form onSubmit={addToWhitelist} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">{t('admin.vpaId', 'VPA ID')} *</label>
                  <input
                    type="text"
                    value={newWhitelistEntry.vpa}
                    onChange={(e) => setNewWhitelistEntry({ ...newWhitelistEntry, vpa: e.target.value })}
                    placeholder="trusted@bank"
                    required
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">{t('admin.reason', 'Reason')} *</label>
                  <textarea
                    value={newWhitelistEntry.reason}
                    onChange={(e) => setNewWhitelistEntry({ ...newWhitelistEntry, reason: e.target.value })}
                    placeholder="Trusted recipient - verified account..."
                    required
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {showOverrideOption && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newWhitelistEntry.override}
                        onChange={(e) => setNewWhitelistEntry({ ...newWhitelistEntry, override: e.target.checked })}
                        className="w-5 h-5 mt-1 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                      />
                      <div>
                        <p className="font-semibold text-orange-900">Admin Override: Force Whitelist</p>
                        <p className="text-sm text-orange-800 mt-1">This VPA is on the global blacklist. By checking this, you are confirming it is safe and should be trusted.</p>
                      </div>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-all"
                >
                  {loading ? t('common.loading') : t('admin.addWhitelist', 'Add to Whitelist')}
                </button>
              </form>
            </div>

            {/* Whitelist Entries */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-bold mb-6 text-gray-800">
                {t('admin.whitelistEntries', 'Whitelist Entries')} ({whitelist.length})
              </h2>
              
              {whitelist.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t('admin.noWhitelist', 'No whitelist entries yet')}</p>
              ) : (
                <div className="space-y-3">
                  {whitelist.map((entry) => (
                    <div key={entry._id} className="p-4 bg-green-50 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-800">{entry.vpa || entry.phoneNumber}</p>
                        <p className="text-sm text-gray-600">{entry.reason}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="px-2 py-1 rounded bg-green-200 text-green-800">Trusted</span>
                          <span>Added: {new Date(entry.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromWhitelist(entry._id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                      >
                        {t('connectedDevices.remove')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fraud Blacklist View */}
        {activeTab === 'fraudBlacklist' && (
          <div className="space-y-6">
            {/* Fraud Blacklist Info */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl shadow-lg p-8 border-2 border-red-200">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2 text-gray-800">{t('admin.fraudBlacklist', 'Fraud Blacklist')}</h2>
                  <p className="text-sm text-gray-700 mb-3">
                    {t('admin.fraudBlacklistDesc', 'VPAs reported by users or community as fraudulent. This list is managed by the system based on user reports and fraud indicators.')}
                  </p>
                  <p className="text-xs text-gray-600 italic">
                    ℹ️ {t('admin.fraudBlacklistReadOnly', 'This is a read-only view. Community-reported entries cannot be manually edited.')}
                  </p>
                </div>
              </div>
            </div>

            {/* Fraud Blacklist Entries */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {t('admin.reportedVPAs', 'Reported VPAs')} ({fraudBlacklist.length})
                </h2>
                <button
                  onClick={fetchFraudBlacklist}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all text-sm font-semibold"
                >
                  {loading ? '🔄 ' + t('common.loading') : '🔄 ' + t('common.refresh', 'Refresh')}
                </button>
              </div>
              
              {fraudBlacklist.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t('admin.noFraudBlacklist', 'No fraudulent VPAs in the list')}</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {fraudBlacklist.map((entry) => (
                    <div key={entry._id} className="p-4 bg-red-50 rounded-xl border border-red-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <p className="font-bold text-gray-800 text-lg">{entry.vpa}</p>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              entry.status === 'confirmed' ? 'bg-red-600 text-white' :
                              entry.status === 'suspected' ? 'bg-orange-600 text-white' :
                              'bg-yellow-600 text-white'
                            }`}>
                              {entry.status ? entry.status.charAt(0).toUpperCase() + entry.status.slice(1) : 'Unknown'}
                            </span>
                            {entry.risk_level && (
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                entry.risk_level === 'critical' ? 'bg-red-600 text-white' :
                                entry.risk_level === 'high' ? 'bg-orange-600 text-white' :
                                entry.risk_level === 'medium' ? 'bg-yellow-600 text-white' :
                                'bg-gray-600 text-white'
                              }`}>
                                {t('admin.risk', 'Risk')}: {entry.risk_level?.toUpperCase()}
                              </span>
                            )}
                          </div>
                          
                          {entry.fraud_type && (
                            <p className="text-sm text-gray-700 mt-2 font-semibold">{t('admin.fraudType', 'Fraud Type')}: {entry.fraud_type}</p>
                          )}
                          
                          {entry.description && (
                            <p className="text-sm text-gray-600 mt-2">{entry.description}</p>
                          )}
                          
                          <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-600">
                            {entry.report_count && (
                              <span className="px-2 py-1 bg-gray-200 rounded">📊 Reports: {entry.report_count}</span>
                            )}
                            {entry.confidence_score && (
                              <span className="px-2 py-1 bg-gray-200 rounded">
                                🎯 Confidence: {(entry.confidence_score * 100).toFixed(0)}%
                              </span>
                            )}
                            {entry.createdAt && (
                              <span className="px-2 py-1 bg-gray-200 rounded">📅 {new Date(entry.createdAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
