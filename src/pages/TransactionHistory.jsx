import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Clock, IndianRupee, User, ShieldCheck } from 'lucide-react';

const formatINR = (n) => new Intl.NumberFormat('en-IN').format(Number(n || 0));

export default function TransactionHistory() {
  const { token, loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, error: null, items: [], pagination: null });

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
        console.log('📋 Transaction History API Response:', { status: res.ok, data });
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch transactions');
        const txList = data.data.transactions || [];
        console.log('✅ Loaded', txList.length, 'transactions:', txList);
        setState({ loading: false, error: null, items: txList, pagination: data.data.pagination });
      } catch (err) {
        console.error('❌ Transaction fetch error:', err);
        setState({ loading: false, error: err.message, items: [], pagination: null });
      }
    };

    fetchTx();
  }, [authLoading, isAuthenticated, token, navigate]);

  const { loading, error, items } = state;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-screen-lg bg-white flex flex-col">
        {/* Page Header */}
        <header className="flex items-center gap-2 md:gap-3 px-4 py-3 md:px-6 md:py-4 border-b">
          <Clock className="text-blue-600" size={24} />
          <h1 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">Transaction History</h1>
        </header>

        {/* Main Content */}
        <main className="p-4 md:p-6 lg:p-8">
          {/* Page Intro */}
          <div className="mb-8 lg:mb-12">
            <p className="text-base sm:text-xl text-slate-500 max-w-2xl font-medium">
              Review your recent transactions and risk summaries.
            </p>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
            {/* History List */}
            <div className="lg:col-span-12">
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 lg:p-12 shadow-sm">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">Recent Transactions</h2>
                  <div className="hidden sm:flex items-center text-slate-500 text-sm gap-2">
                    <ShieldCheck size={16} className="text-green-500" />
                    Secure & Encrypted
                  </div>
                </div>

                {loading && (
                  <div className="text-center text-slate-500 py-10">Loading transactions…</div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-4 sm:p-5 text-red-700">
                    <div className="font-semibold mb-1">Unable to load transactions</div>
                    <div className="text-sm opacity-90">{error}</div>
                  </div>
                )}

                {!loading && !error && items.length === 0 && (
                  <div className="text-center text-slate-500 py-10">No transactions found.</div>
                )}

                {!loading && !error && items.length > 0 && (
                  <div className="space-y-3 sm:space-y-4">
                    {items.map((tx) => {
                      const vpa = tx.recipientVPA || tx.payeeUpiId || 'unknown@bank';
                      const timeStr = new Date(tx.createdAt || tx.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
                      const risk = typeof tx.riskScore === 'number' ? Math.round(tx.riskScore) : null;
                      const riskBadge = risk === null
                        ? null
                        : risk >= 80
                          ? 'bg-red-100 text-red-700'
                          : risk >= 60
                            ? 'bg-orange-100 text-orange-700'
                            : risk >= 30
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700';

                      return (
                        <div
                          key={tx._id || tx.transactionId}
                          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 rounded-2xl transition-all border border-slate-200 cursor-pointer"
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
                          <div className="text-right">
                            {risk !== null && (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${riskBadge}`}>
                                Risk {risk}%
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
