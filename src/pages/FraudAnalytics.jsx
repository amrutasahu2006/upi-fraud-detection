import FilterPill from "../components/FilterPill";
import StatCard from "../components/StatCard";
import RecentFraudItem from "../components/RecentFraudItem";
import BottomNavigation from "../components/BottomNavigation";

export default function FraudAnalytics() {
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-screen-lg bg-white flex flex-col">

        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 md:px-6 md:py-4 border-b">
          <button className="text-3xl md:text-4xl lg:text-5xl">←</button>
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
              <FilterPill label="Date range: Last 30 days" />
              <FilterPill label="All" active />
              <FilterPill label="Phishing" />
              <FilterPill label="OTP Fraud" />
              <FilterPill label="Scam" />
              <FilterPill label="Technical" />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title="Total Fraud Attempts"
              value="12,345"
              change="+5.2%"
              positive
            />
            <StatCard
              title="Blocked Transactions"
              value="8,765"
              change="+8.1%"
              positive
            />
            <StatCard
              title="Success Rate (Blocking)"
              value="71.0%"
              change="+1.5%"
              positive
            />
            <StatCard
              title="Average Risk Score"
              value="68.5"
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

            <img
              src="src/public/india-fraud-map.png"
              alt="Fraud hotspots in India"
              className="w-full rounded-md object-contain"
            />
          </div>

          {/* Recent Fraud Activity */}
          <div className="bg-white border rounded-lg p-3 md:p-4 space-y-2">
            <p className="text-sm md:text-base font-semibold text-gray-800">
              Recent Fraud Activity
            </p>

            <RecentFraudItem
              id="UPI12345678"
              date="2023-10-26"
              type="Phishing"
              risk={92}
            />
            <RecentFraudItem
              id="UPI98765432"
              date="2023-10-25"
              type="OTP Fraud"
              risk={88}
            />
            <RecentFraudItem
              id="UPI12233444"
              date="2023-10-24"
              type="Scam"
              risk={75}
            />
            <RecentFraudItem
              id="UPI55667788"
              date="2023-10-23"
              type="Technical"
              risk={68}
            />
          </div>

        </main>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>
    </div>
  );
}
