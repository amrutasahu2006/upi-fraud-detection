import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import FilterPill from "../components/FilterPill";
import StatCard from "../components/StatCard";
import RecentFraudItem from "../components/RecentFraudItem";
import FraudHeatmap from "../components/FraudHeatmap";
import FraudForecastWidget from "../components/FraudForecastWidget";

export default function FraudAnalytics() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalFraudAttempts: 0,
    blockedTransactions: 0,
    successRate: 0,
    avgRiskScore: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState("last30Days");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

        // Build query parameters based on filters
        const daysMap = {
          last7Days: 7,
          last30Days: 30,
          last90Days: 90
        };

        const days = daysMap[selectedDateRange] || 30;

        const [statsResponse, activityResponse] = await Promise.all([
          fetch(`http://localhost:5000/api/admin/fraud-stats?days=${days}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('http://localhost:5000/api/admin/recent-fraud-activity', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.data);
        }

        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          setRecentActivity(activityData.data);
        }
      } catch (error) {
        console.error('Error fetching fraud analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDateRange]);
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-screen-lg bg-white flex flex-col">

        {/* Header */}
        <header className="flex items-center gap-2 md:gap-3 px-4 py-3 md:px-6 md:py-4 border-b">
          <button className="text-3xl md:text-4xl lg:text-5xl cursor-pointer">←</button>
          <h1 className="text-lg md:text-xl lg:text-2xl font-semibold">
            {t('fraudAnalytics.title')}
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-5 overflow-y-auto">

          {/* Filters */}
          <div className="space-y-2">
            <p className="text-xs md:text-sm font-semibold text-gray-700">{t('fraudAnalytics.filters')}</p>
            <div className="flex gap-2 flex-wrap">
              <FilterPill
                label={`${t('fraudAnalytics.dateRange')}: ${t('fraudAnalytics.last30Days')}`}
                active={selectedDateRange === "last30Days"}
                onClick={() => setSelectedDateRange("last30Days")}
              />
              <FilterPill
                label={`${t('fraudAnalytics.dateRange')}: ${t('fraudAnalytics.last7Days')}`}
                active={selectedDateRange === "last7Days"}
                onClick={() => setSelectedDateRange("last7Days")}
              />
              <FilterPill
                label={`${t('fraudAnalytics.dateRange')}: ${t('fraudAnalytics.last90Days')}`}
                active={selectedDateRange === "last90Days"}
                onClick={() => setSelectedDateRange("last90Days")}
              />
            </div>
          </div>

          {/* Fraud Forecast Widget */}
          <FraudForecastWidget />

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title={t('fraudAnalytics.totalFraudAttempts')}
              value={stats.totalFraudAttempts?.toLocaleString() || "0"}
              change="+5.2%"
              positive
            />
            <StatCard
              title={t('fraudAnalytics.blockedTransactions')}
              value={stats.blockedTransactions?.toLocaleString() || "0"}
              change="+8.1%"
              positive
            />
            <StatCard
              title={t('fraudAnalytics.successRate')}
              value={`${stats.successRate || 0}%`}
              change="+1.5%"
              positive
            />
            <StatCard
              title={t('fraudAnalytics.avgRiskScore')}
              value={stats.avgRiskScore?.toString() || "0"}
              change="-0.3%"
              positive={false}
            />
          </div>

          {/* Map Section */}
          <div className="bg-white border rounded-lg p-3 md:p-4 space-y-2">
            <p className="text-sm md:text-base font-semibold text-gray-800">
              {t('fraudAnalytics.fraudHotspots')}
            </p>
            <p className="text-xs md:text-sm text-gray-500">
              {t('fraudAnalytics.fraudHotspotsDesc')}
            </p>

            <FraudHeatmap selectedDateRange={selectedDateRange} />
          </div>

          {/* Recent Fraud Activity */}
          <div className="bg-white border rounded-lg p-3 md:p-4 space-y-2">
            <p className="text-sm md:text-base font-semibold text-gray-800">
              {t('fraudAnalytics.recentFraudActivity')}
            </p>

            {loading ? (
              <div className="text-center py-4">{t('common.loading')}</div>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((item, index) => (
                <RecentFraudItem
                  key={index}
                  id={item.id}
                  date={item.date}
                  type={item.type}
                  risk={item.risk}
                />
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">{t('fraudAnalytics.noActivityYet')}</div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
