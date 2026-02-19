import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SafetyAlert from "../components/SafetyAlert";
import UserCard from "../components/UserCard";
import ExpandCircle from "../components/ExpandCircle";
import FraudForecastWidget from "../components/FraudForecastWidget";
import { users } from "../data/users";

export default function Safety() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-screen-lg bg-white flex flex-col">

        {/* Page Header */}
        <header className="flex items-center gap-3 px-4 py-3 md:px-6 md:py-4 border-b">
          <button onClick={() => navigate('/security-warning')} aria-label="Go back" className="text-2xl cursor-pointer">←</button>
          <h1 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">{t('safety.title')}</h1>
        </header>

        {/* Main Content */}
        <main className="p-4 md:p-6 lg:p-8 space-y-6">

          {/* Fraud Forecast Widget */}
          <FraudForecastWidget />

          {/* Safety Alert */}
          <SafetyAlert />

          {/* Circle Heading */}
          <h2 className="text-base md:text-lg lg:text-xl font-semibold">
            {t('safety.upiCircle')}
          </h2>

          {/* Users List */}
          <div className="space-y-3 md:space-y-4 lg:space-y-5">
            {users.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>

          {/* Expand Circle */}
          <ExpandCircle />
        </main>
      </div>
    </div>
  );
}
