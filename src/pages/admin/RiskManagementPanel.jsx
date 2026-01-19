import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Settings } from 'lucide-react';

/**
 * Admin Panel for Risk Management
 * - Configure risk thresholds
 * - Manage blacklist/whitelist
 * - View system statistics
 */
export default function RiskManagementPanel() {
  const [activeTab, setActiveTab] = useState('thresholds');
  const [thresholds, setThresholds] = useState(null);
  const [blacklist, setBlacklist] = useState([]);
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

  useEffect(() => {
    if (activeTab === 'thresholds') {
      fetchThresholds();
    } else if (activeTab === 'blacklist') {
      fetchBlacklist();
    }
  }, [activeTab]);

  const fetchThresholds = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: 'Authentication required. Please login first.' });
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
        setMessage({ type: 'error', text: result.message || 'Failed to load thresholds' });
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
        setMessage({ type: 'success', text: 'Thresholds updated successfully!' });
        fetchThresholds();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update thresholds' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const fetchBlacklist = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: 'Authentication required. Please login first.' });
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
        setMessage({ type: 'error', text: result.message || 'Failed to load blacklist' });
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
        setMessage({ type: 'success', text: 'Added to blacklist successfully!' });
        setNewBlacklistEntry({ vpa: '', reason: '', severity: 'high' });
        fetchBlacklist();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add to blacklist' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const removeFromBlacklist = async (id) => {
    if (!confirm('Are you sure you want to remove this entry from blacklist?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/lists/blacklist/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      if (result.success) {
        setMessage({ type: 'success', text: 'Removed from blacklist' });
        fetchBlacklist();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove from blacklist' });
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
              <h1 className="text-2xl font-bold text-gray-800">Risk Management Panel</h1>
              <p className="text-gray-600">Configure risk thresholds and manage blacklist/whitelist</p>
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
              Thresholds
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
              Blacklist
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
            <h2 className="text-xl font-bold mb-6 text-gray-800">Risk Score Thresholds</h2>
            
            <div className="space-y-6">
              {/* BLOCK Threshold */}
              <div className="p-6 bg-red-50 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-6 h-6 text-red-600" />
                    <div>
                      <h3 className="font-bold text-gray-800">Block Threshold</h3>
                      <p className="text-sm text-gray-600">Transactions with score ≥ this will be blocked</p>
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
                      <p className="text-sm text-gray-600">Transactions between this and block will be delayed</p>
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
                      <p className="text-sm text-gray-600">Transactions between this and delay will show warning</p>
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
                <h3 className="font-bold mb-3 text-gray-800">Decision Summary</h3>
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
                {loading ? 'Updating...' : 'Update Thresholds'}
              </button>
            </div>
          </div>
        )}

        {/* Blacklist Management */}
        {activeTab === 'blacklist' && (
          <div className="space-y-6">
            {/* Add to Blacklist Form */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-bold mb-6 text-gray-800">Add to Blacklist</h2>
              <form onSubmit={addToBlacklist} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">VPA ID *</label>
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
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Reason *</label>
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
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Severity</label>
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
                  {loading ? 'Adding...' : 'Add to Blacklist'}
                </button>
              </form>
            </div>

            {/* Blacklist Entries */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-bold mb-6 text-gray-800">
                Blacklist Entries ({blacklist.length})
              </h2>
              
              {blacklist.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No blacklist entries yet</p>
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
                        Remove
                      </button>
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
