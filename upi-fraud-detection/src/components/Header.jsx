import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, LogOut, UserCircle } from 'lucide-react';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white border-b">
      <div className="flex items-center pl-6 pr-4 md:pl-8 md:pr-6 py-3 justify-between">
        {/* Left: Logo + Icon */}
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1 rounded">
            <i className="fa-solid fa-shield text-white text-base md:text-lg lg:text-xl"></i>
          </div>

          <h1 className="text-lg md:text-xl lg:text-2xl font-semibold text-blue-600">
            सुरक्षाPay
          </h1>
        </div>

        {/* Spacer to push tabs right */}
        <div className="flex-1" />

        {/* Navigation for non-authenticated users */}
        {!isAuthenticated ? (
          <div className="flex items-center space-x-4">
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
          /* User menu for authenticated users */
          <div className="flex items-center space-x-4">
            <NavLink 
              to="/profile"
              className="flex items-center space-x-2 text-gray-700 hover:text-blue-600"
            >
              <UserCircle size={20} />
              <span className="hidden md:inline">{user?.username || 'User'}</span>
              <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                {user?.role || 'user'}
              </span>
            </NavLink>
            
            {/* Show admin link if user is admin */}
            {user?.role === 'admin' && (
              <NavLink 
                to="/admin/users"
                className="text-sm bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700"
              >
                Admin Panel
              </NavLink>
            )}
            
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-1 text-red-600 hover:text-red-800"
            >
              <LogOut size={18} />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        )}

        {/* Tabs aligned to right with increased spacing */}
        <nav className="mr-4">
          <div className="flex items-center gap-12">
            <NavLink
              to="/payment"
              className={({ isActive }) =>
                `flex flex-col items-center py-3 ${isActive ? "text-blue-600" : "text-gray-500"}`
              }
              aria-label="Pay"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18M16 14l-1 3H9l-1-3" />
              </svg>
              <span className="text-xs mt-1">Pay</span>
            </NavLink>

            <NavLink
              to="/safety"
              className={({ isActive }) =>
                `flex flex-col items-center py-3 ${isActive ? "text-blue-600" : "text-gray-500"}`
              }
              aria-label="Safety"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l8 4v6c0 5-3.582 9.74-8 11-4.418-1.26-8-6-8-11V6l8-4z" />
              </svg>
              <span className="text-xs mt-1">Safety</span>
            </NavLink>

            <NavLink
            to="/risk-details"
              className={({ isActive }) =>
                `flex flex-col items-center py-3 ${isActive ? "text-blue-600" : "text-gray-500"}`
              }
              aria-label="Insights"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13l4-4 4 4 4-8" />
              </svg>
              <span className="text-xs mt-1">Insights</span>
            </NavLink>

            <NavLink
              to="/privacy-settings"
              className={({ isActive }) =>
                `flex flex-col items-center py-3 ${isActive ? "text-blue-600" : "text-gray-500"}`
              }
              aria-label="Settings"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.39 15.5A8 8 0 0112.5 20l-1.77-.35" />
              </svg>
              <span className="text-xs mt-1">Settings</span>
            </NavLink>
          </div>
        </nav>

        <div className="w-6" />
      </div>
    </header>
  );
}
