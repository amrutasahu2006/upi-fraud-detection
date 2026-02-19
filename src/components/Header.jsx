import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, UserCircle, Shield } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="bg-white border-b">
      <div className="flex items-center pl-6 pr-4 md:pl-8 md:pr-6 py-3 justify-between">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded">
            <Shield className="text-white" size={20} />
          </div>
          <h1 className="text-lg md:text-xl lg:text-2xl font-semibold text-blue-600">
            सुरक्षाPay
          </h1>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Auth Section */}
        {!isAuthenticated ? (
          <div className="flex items-center space-x-4 mr-6">
            <LanguageSwitcher />
            <NavLink
              to="/login"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Login
            </NavLink>
            <NavLink
              to="/register"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Sign Up
            </NavLink>
          </div>
        ) : (
          <div className="flex items-center space-x-4 mr-6">
            <LanguageSwitcher />
            <NavLink
              to="/profile"
              className="flex items-center space-x-2 text-gray-700 hover:text-blue-600"
            >
              <UserCircle size={20} />
              <span className="hidden md:inline">
                {user?.username || "User"}
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                {user?.role || "user"}
              </span>
            </NavLink>

            {user?.role === "admin" && (
              <NavLink
                to="/admin/users"
                className="text-sm bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700"
              >
                Admin Panel
              </NavLink>
            )}

            <button
              onClick={logout}
              className="flex items-center space-x-1 text-red-600 hover:text-red-800"
            >
              <LogOut size={18} />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        )}

        {/* Navigation Tabs - Only show when authenticated */}
        {isAuthenticated && (
          <nav className="mr-4">
            <div className="flex items-center gap-12">
              {user?.role === "admin" ? (
                // Admin navigation
                [
                  { to: "/admin/dashboard", label: "Dashboard", icon: DashboardIcon },
                  { to: "/admin/users", label: "Users", icon: UsersIcon },
                  { to: "/admin/risk-management", label: "Risk", icon: RiskIcon },
                  { to: "/fraud-analytics", label: "Analytics", icon: AnalyticsIcon },
                ].map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex flex-col items-center py-3 ${
                        isActive ? "text-blue-600" : "text-gray-500"
                      }`
                    }
                  >
                    <Icon />
                    <span className="text-xs mt-1">{label}</span>
                  </NavLink>
                ))
              ) : (
                // User navigation
                [
                  { to: "/payment", label: "Pay", icon: PayIcon },
                  { to: "/safety", label: "Safety", icon: SafetyIcon },
                  { to: "/safety-circle", label: "Circle", icon: CircleIcon },
                  { to: "/risk-details", label: "Insights", icon: InsightsIcon },
                  { to: "/transaction-history", label: "History", icon: HistoryIcon },
                  { to: "/privacy-settings", label: "Settings", icon: SettingsIcon },
                ].map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex flex-col items-center py-3 ${
                        isActive ? "text-blue-600" : "text-gray-500"
                      }`
                    }
                  >
                    <Icon />
                    <span className="text-xs mt-1">{label}</span>
                  </NavLink>
                ))
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

/* Icons */
function PayIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18M16 14l-1 3H9l-1-3" />
    </svg>
  );
}

function SafetyIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l8 4v6c0 5-3.582 9.74-8 11-4.418-1.26-8-6-8-11V6l8-4z" />
    </svg>
  );
}

function InsightsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13l4-4 4 4 4-8" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.39 15.5A8 8 0 0112.5 20l-1.77-.35" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  );
}

function RiskIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function CircleIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}