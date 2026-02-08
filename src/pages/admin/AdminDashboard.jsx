import { Link } from "react-router-dom";
import { Users, Shield, BarChart3 } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Management */}
          <Link
            to="/admin/users"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <Users className="text-blue-600 mr-3" size={32} />
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            </div>
            <p className="text-gray-600">Manage user accounts, roles, and permissions.</p>
          </Link>

          {/* Risk Management */}
          <Link
            to="/admin/risk-management"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <Shield className="text-red-600 mr-3" size={32} />
              <h2 className="text-xl font-semibold text-gray-900">Risk Management</h2>
            </div>
            <p className="text-gray-600">Monitor and manage fraud risks and alerts.</p>
          </Link>

          {/* Fraud Analytics */}
          <Link
            to="/fraud-analytics"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <BarChart3 className="text-green-600 mr-3" size={32} />
              <h2 className="text-xl font-semibold text-gray-900">Fraud Analytics</h2>
            </div>
            <p className="text-gray-600">View detailed fraud detection analytics and reports.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
