import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Shield,
  BarChart3,
  TrendingUp,
  Activity,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  UserX,
  DollarSign,
  Clock
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/dashboard-summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setDashboardData(data.data);
        setLastUpdated(new Date());
        setError('');
      } else {
        setError(data.message || t('admin.fetchFailed', 'Failed to fetch dashboard data'));
      }
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);

    return () => clearInterval(interval);
  }, [token]);

  const refreshData = () => {
    fetchDashboardData();
  };

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const fraudTrendData = dashboardData?.fraudTrends ? {
    labels: dashboardData.fraudTrends.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Blocked Transactions',
        data: dashboardData.fraudTrends.map(item => item.blocked),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  } : null;

  const riskDistributionData = dashboardData?.riskDistribution ? {
    labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk'],
    datasets: [
      {
        data: [
          dashboardData.riskDistribution.LOW || 0,
          dashboardData.riskDistribution.MEDIUM || 0,
          dashboardData.riskDistribution.HIGH || 0,
          dashboardData.riskDistribution.CRITICAL || 0,
        ],
        backgroundColor: [
          'rgb(34, 197, 94)', // green
          'rgb(251, 191, 36)', // yellow
          'rgb(239, 68, 68)', // red
          'rgb(139, 69, 19)', // dark red
        ],
        borderWidth: 2,
      },
    ],
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t('admin.dashboard')}
            </h1>
            <p className="mt-2 text-gray-600">
              {t('admin.overview', 'Real-time fraud detection and user management overview')}
            </p>
          </div>
          <button
            onClick={refreshData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('common.retry')}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-sm font-medium text-gray-600">{t('admin.totalUsers')}</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData?.users?.total || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('admin.activeUsers')}</p>
                <p className="text-3xl font-bold text-green-600">{dashboardData?.users?.active || 0}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('transactions.title')}</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData?.transactions?.total || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('fraudAnalytics.blockedTransactions')}</p>
                <p className="text-3xl font-bold text-red-600">{dashboardData?.transactions?.blocked || 0}</p>
              </div>
              <Shield className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Fraud Trends Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">{t('admin.fraudTrends', 'Fraud Trends (7 Days)')}</h3>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            {fraudTrendData && (
              <Line
                data={fraudTrendData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                      },
                    },
                  },
                }}
              />
            )}
          </div>

          {/* Risk Distribution Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">{t('admin.riskDistribution', 'Risk Distribution (30 Days)')}</h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            {riskDistributionData && (
              <Doughnut
                data={riskDistributionData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            )}
          </div>
        </div>

        {/* Quick Actions & Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">{t('admin.quickActions', 'Quick Actions')}</h3>
            <div className="space-y-4">
              <Link
                to="/admin/users"
                className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
              >
                <Users className="h-5 w-5 text-blue-600 mr-3 group-hover:scale-110 transition-transform" />
                <span className="text-blue-700 font-medium">{t('admin.userManagement')}</span>
              </Link>

              <Link
                to="/fraud-analytics"
                className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
              >
                <BarChart3 className="h-5 w-5 text-green-600 mr-3 group-hover:scale-110 transition-transform" />
                <span className="text-green-700 font-medium">{t('navigation.analytics')}</span>
              </Link>

              <Link
                to="/admin/risk-management"
                className="flex items-center p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors group"
              >
                <Shield className="h-5 w-5 text-red-600 mr-3 group-hover:scale-110 transition-transform" />
                <span className="text-red-700 font-medium">{t('admin.riskManagement')}</span>
              </Link>
            </div>
          </div>

          {/* User Statistics */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">{t('admin.userStats', 'User Statistics')}</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('admin.admins', 'Administrators')}</span>
                <span className="font-semibold text-blue-600">{dashboardData?.users?.admins || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('admin.inactiveUsers', 'Inactive Users')}</span>
                <span className="font-semibold text-red-600">
                  {(dashboardData?.users?.total || 0) - (dashboardData?.users?.active || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('admin.newUsers', 'New Users (7d)')}</span>
                <span className="font-semibold text-green-600">{dashboardData?.users?.recent || 0}</span>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">{t('admin.systemHealth')}</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  {t('admin.systemHealth')}
                </span>
                <span className="font-semibold text-green-600">{t('admin.online', 'Online')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  {t('admin.lastUpdated', 'Last Updated')}
                </span>
                <span className="font-semibold text-gray-900">
                  {lastUpdated ? lastUpdated.toLocaleTimeString() : t('admin.never', 'Never')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('admin.blockRate', 'Block Rate')}</span>
                <span className="font-semibold text-red-600">
                  {dashboardData?.transactions?.total ?
                    Math.round((dashboardData.transactions.blocked / dashboardData.transactions.total) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
