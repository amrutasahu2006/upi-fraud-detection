import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, IndianRupee, User, ShieldCheck, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import axios from 'axios'; // Ensure axios is imported

const formatINR = (n) => new Intl.NumberFormat('en-IN').format(Number(n || 0));

export default function TransactionHistory() {
  const { t } = useTranslation();
  const { token, loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, error: null, items: [], pagination: null });
  const [reportingId, setReportingId] = useState(null); // Track which item is being reported
  const [blacklistReportingId, setBlacklistReportingId] = useState(null); // Track blacklist report

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !token) {
      navigate('/login');
      return;
    }

    const fetchTx = async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await fetch('http://localhost:5000/api/transactions?limit=50', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch transactions');
        const txList = data.data.transactions || [];
        setState({ loading: false, error: null, items: txList, pagination: data.data.pagination });
      } catch (err) {
        console.error('❌ Transaction fetch error:', err);
        setState({ loading: false, error: err.message, items: [], pagination: null });
      }
    };

    fetchTx();
  }, [authLoading, isAuthenticated, token, navigate]);

  // --- Report to Circle Function ---
  const handleReportToCircle = async (e, tx) => {
    e.stopPropagation(); // Prevent card click
    const vpa = tx.recipientVPA || tx.payeeUpiId;
    const name = tx.payee || t('common.unknownPayee', 'Unknown Payee');

    if (!window.confirm(t('transactions.reportConfirm', { vpa }))) return;

    setReportingId(tx._id);
    try {
      await axios.post('http://localhost:5000/api/circle/report', {
        payeeUpiId: vpa,
        payeeName: name
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(t('transactions.reportSuccess'));
    } catch (err) {
      alert(t('transactions.reportFailure'));
    } finally {
      setReportingId(null);
    }
  };

  // --- Block VPA Function (User-level with auto-escalation) ---
  const handleBlockVPA = async (e, tx) => {
    e.stopPropagation();
    const vpa = tx.recipientVPA || tx.payeeUpiId;
    const name = tx.payee || t('common.unknownPayee', 'Unknown Payee');

    if (!vpa || vpa === 'unknown@bank') {
      alert('Invalid VPA');
      return;
    }

    const reason = window.prompt(
      `Block ${vpa}?\n\nThis will prevent you from paying this VPA in the future.\n\nEnter reason (optional):`,
      'Suspicious activity'
    );
    
    // User cancelled
    if (reason === null) return;

    setBlacklistReportingId(tx._id);
    try {
      const res = await axios.post('http://localhost:5000/api/block-vpa', {
        vpa: vpa,
        name: name,
        reason: reason || 'User blocked'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        const { blockCount, escalatedToGlobal } = res.data.data;
        let message = `✅ ${vpa} blocked successfully!\n\n${blockCount} user(s) have blocked this VPA.`;
        
        if (escalatedToGlobal) {
          message += `\n\n🚨 AUTO-ESCALATED to global blacklist!\nThis VPA is now blocked for ALL users.`;
        } else if (blockCount >= 2) {
          message += `\n\n⚠️ 1 more report needed to add to global blacklist.`;
        }
        
        alert(message);
      } else {
        alert(`⚠️ ${res.data.message || 'Block failed'}`);
      }
    } catch (err) {
      console.error('Block VPA error:', err);
      alert(`❌ Failed to block: ${err.response?.data?.message || err.message}`);
    } finally {
      setBlacklistReportingId(null);
    }
  };

  const { loading, error, items } = state;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-screen-lg bg-white flex flex-col">
        <header className="flex items-center gap-2 md:gap-3 px-4 py-3 md:px-6 md:py-4 border-b">
          <Clock className="text-blue-600" size={24} />
          <h1 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">{t('transactions.title')}</h1>
        </header>

        <main className="p-4 md:p-6 lg:p-8">
          <div className="mb-8 lg:mb-12">
            <p className="text-base sm:text-xl text-slate-500 max-w-2xl font-medium">
              {t('transactions.review')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
            <div className="lg:col-span-12">
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 lg:p-12 shadow-sm">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">{t('transactions.recent')}</h2>
                  <div className="hidden sm:flex items-center text-slate-500 text-sm gap-2">
                    <ShieldCheck size={16} className="text-green-500" />
                    {t('common.secureEncrypted')}
                  </div>
                </div>

                {loading && <div className="text-center text-slate-500 py-10">{t('transactions.loadingTransactions')}</div>}
                {error && <div className="text-red-700 p-5">{error}</div>}

                {!loading && !error && items.length > 0 && (
                  <div className="space-y-3 sm:space-y-4">
                    {items.map((tx) => {
                      const vpa = tx.recipientVPA || tx.payeeUpiId || 'unknown@bank';
                      const timeStr = new Date(tx.createdAt || tx.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
                      const risk = typeof tx.riskScore === 'number' ? Math.round(tx.riskScore) : null;
                      
                      // Status Badge Logic
                      let statusBadge = 'bg-slate-100 text-slate-700', statusLabel = t('transactions.processing');
                      if (tx.status === 'completed') {
                        statusBadge = (tx.decision === 'DELAY' || tx.decision === 'WARN') ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';
                        statusLabel = (tx.decision === 'DELAY' || tx.decision === 'WARN') ? t('securityWarning.title') : t('transactions.completed');
                      } else if (tx.status === 'blocked') {
                        statusBadge = 'bg-red-100 text-red-700';
                        statusLabel = t('transactions.blocked');
                      }

                      return (
                        <div
                          key={tx._id || tx.transactionId}
                          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 rounded-2xl transition-all border border-slate-200 cursor-pointer group"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                              <IndianRupee size={18} className="text-slate-600" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">₹{formatINR(tx.amount)}</div>
                              <div className="text-slate-500 text-xs sm:text-sm flex items-center gap-2">
                                <User size={14} />
                                <span className="font-medium">{vpa}</span>
                                <span className="opacity-60">• {timeStr}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* --- Report to Circle Button --- */}
                            <button
                              onClick={(e) => handleReportToCircle(e, tx)}
                              disabled={reportingId === tx._id}
                              className="hidden group-hover:flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <AlertTriangle size={14} />
                              {reportingId === tx._id ? t('common.loading') : t('transactions.reportToCircle')}
                            </button>

                            {/* --- Block VPA Button --- */}
                            <button
                              onClick={(e) => handleBlockVPA(e, tx)}
                              disabled={blacklistReportingId === tx._id}
                              className="hidden group-hover:flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-200"
                            >
                              <AlertTriangle size={14} />
                              {blacklistReportingId === tx._id ? t('common.loading') : 'Block this VPA'}
                            </button>

                            <div className="text-right flex flex-col items-end gap-2">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusBadge}`}>
                                {statusLabel}
                              </span>
                              {risk !== null && (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100`}>
                                  {t('transactions.riskScore')} {risk}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!loading && !error && items.length === 0 && (
                  <div className="text-center text-slate-500 py-10">{t('transactions.noTransactions')}</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}