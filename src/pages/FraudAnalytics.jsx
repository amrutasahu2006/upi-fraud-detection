import { useState, useEffect } from "react";
import FilterPill from "../components/FilterPill";
import StatCard from "../components/StatCard";
import RecentFraudItem from "../components/RecentFraudItem";
import FraudHeatmap from "../components/FraudHeatmap";

export default function FraudAnalytics() {
  const [stats, setStats] = useState({
    totalFraudAttempts: 0,
    blockedTransactions: 0,
    successRate: 0,
    avgRiskScore: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState("Last 30 days");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

        // Build query parameters based on filters
        const daysMap = {
          "Last 7 days": 7,
          "Last 30 days": 30,
          "Last 90 days": 90
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
            Fraud Analytics
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-5 overflow-y-auto">

          {/* Filters */}
          <div className="space-y-2">
            <p className="text-xs md:text-sm font-semibold text-gray-700">Filters</p>
            <div className="flex gap-2 flex-wrap">
              <FilterPill
                label="Date range: Last 30 days"
                active={selectedDateRange === "Last 30 days"}
                onClick={() => setSelectedDateRange("Last 30 days")}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title="Total Fraud Attempts"
              value={stats.totalFraudAttempts?.toLocaleString() || "0"}
              change="+5.2%"
              positive
            />
            <StatCard
              title="Blocked Transactions"
              value={stats.blockedTransactions?.toLocaleString() || "0"}
              change="+8.1%"
              positive
            />
            <StatCard
              title="Success Rate (Blocking)"
              value={`${stats.successRate || 0}%`}
              change="+1.5%"
              positive
            />
            <StatCard
              title="Average Risk Score"
              value={stats.avgRiskScore?.toString() || "0"}
              change="-0.3%"
              positive={false}
            />
          </div>

          {/* Map Section */}
          <div className="bg-white border rounded-lg p-3 md:p-4 space-y-2">
            <p className="text-sm md:text-base font-semibold text-gray-800">
              Fraud Hotspots in India
            </p>
            <p className="text-xs md:text-sm text-gray-500">
              Regions with highest reported UPI fraud activity.
            </p>

            <FraudHeatmap selectedDateRange={selectedDateRange} />
          </div>

          {/* Recent Fraud Activity */}
          <div className="bg-white border rounded-lg p-3 md:p-4 space-y-2">
            <p className="text-sm md:text-base font-semibold text-gray-800">
              Recent Fraud Activity
            </p>

            {loading ? (
              <div className="text-center py-4">Loading...</div>
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
              <div className="text-center py-4 text-gray-500">No recent fraud activity</div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
