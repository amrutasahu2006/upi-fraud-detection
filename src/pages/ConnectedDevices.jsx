import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Monitor, Smartphone, Laptop, Tablet, MapPin, Clock, Shield, Trash2 } from "lucide-react";

function ConnectedDevices() {
  const { token, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingDevice, setRemovingDevice] = useState(null);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isAuthenticated) {
      fetchDevices();
    }
  }, [isAuthenticated, token]);

  const fetchDevices = async () => {
    try {
      const deviceId = localStorage.getItem('deviceId');
      const response = await fetch('http://localhost:5000/api/auth/devices', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Device-Id': deviceId || ''
        }
      });

      const data = await response.json();

      if (data.success && data.data?.devices) {
        setDevices(data.data.devices);
      } else {
        console.error('Failed to fetch devices:', data.message);
        setDevices([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching devices:', error);
      setDevices([]);
      setLoading(false);
    }
  };

  const handleRemoveDevice = async (deviceId) => {
    const currentDeviceId = localStorage.getItem('deviceId');
    
    if (deviceId === currentDeviceId) {
      setMessage({ type: 'error', text: '❌ Cannot remove current device' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    if (!window.confirm('Are you sure you want to remove this device? You will need to log in again on that device.')) {
      return;
    }

    setRemovingDevice(deviceId);
    try {
      const response = await fetch(`http://localhost:5000/api/auth/devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Device-Id': currentDeviceId || ''
        }
      });

      const data = await response.json();

      if (data.success) {
        setDevices(devices.filter(d => d.deviceId !== deviceId));
        setMessage({ type: 'success', text: '✅ Device removed successfully' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: `❌ ${data.message || 'Failed to remove device'}` });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Error removing device:', error);
      setMessage({ type: 'error', text: '❌ Failed to remove device' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setRemovingDevice(null);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!window.confirm('This will log you out of all devices including this one. You will need to log in again. Continue?')) {
      return;
    }

    setLoggingOutAll(true);
    try {
      // Call backend to invalidate all sessions/tokens
      const response = await fetch('http://localhost:5000/api/auth/logout-all-devices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Even if backend call fails, logout locally
      if (response.ok) {
        console.log('✅ All devices logged out successfully');
      } else {
        console.warn('⚠️ Backend logout failed, but logging out locally');
      }
    } catch (error) {
      console.error('Error logging out all devices:', error);
      // Continue with local logout anyway
    } finally {
      // Clear local storage and state
      logout();
      
      // Show message briefly before redirect
      setMessage({ type: 'success', text: '✅ Logged out from all devices' });
      
      // Redirect to login page after short delay
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1000);
    }
  };

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'smartphone':
        return <Smartphone size={24} />;
      case 'tablet':
        return <Tablet size={24} />;
      case 'laptop':
      default:
        return <Laptop size={24} />;
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-slate-500">Loading devices...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-screen-lg bg-white flex flex-col">
        {/* Page Header */}
        <header className="flex items-center gap-2 md:gap-3 px-4 py-3 md:px-6 md:py-4 border-b">
          <Link to="/recommendations" className="text-2xl cursor-pointer">←</Link>
          <h1 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">Connected Devices</h1>
        </header>

        {/* Main Content */}
        <main className="p-4 md:p-6 lg:p-8">
          
          {/* Message Alert */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          {/* Heading Section */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Your Connected Devices
            </h2>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              Review and manage all devices that have access to your account. Remove any unrecognized devices to keep your account secure.
            </p>
          </div>

          {/* Security Tip */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Shield className="text-blue-600 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold text-blue-900 text-sm mb-1">Security Tip</h3>
              <p className="text-blue-800 text-xs leading-relaxed">
                If you notice a device you don't recognize, remove it immediately and change your password.
              </p>
            </div>
          </div>

          {/* Devices List */}
          <div className="space-y-4">
            {devices.map((device) => (
              <div
                key={device.deviceId || device._id}
                className={`bg-white border rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow ${
                  device.isCurrent ? 'border-green-300 bg-green-50/30' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Device Icon */}
                  <div className={`p-3 rounded-xl flex-shrink-0 ${
                    device.isCurrent ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <div className={device.isCurrent ? 'text-green-600' : 'text-gray-600'}>
                      {getDeviceIcon(device.type)}
                    </div>
                  </div>

                  {/* Device Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                          {device.name}
                          {device.isCurrent && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                              Current Device
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {device.os} • {device.browser}
                        </p>
                      </div>

                      {/* Remove Button */}
                      {!device.isCurrent && (
                        <button
                          onClick={() => handleRemoveDevice(device.deviceId)}
                          disabled={removingDevice === device.deviceId}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-semibold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={16} />
                          {removingDevice === device.deviceId ? 'Removing...' : 'Remove'}
                        </button>
                      )}
                    </div>

                    {/* Additional Info */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={16} className="flex-shrink-0" />
                        <span>{device.location?.city || device.location?.country || 'Unknown Location'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={16} className="flex-shrink-0" />
                        <span>Last active: {getTimeAgo(device.lastActive)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No Devices */}
          {devices.length === 0 && (
            <div className="text-center py-12">
              <Monitor size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No devices connected</p>
            </div>
          )}

          {/* Additional Actions */}
          <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-2">Need more help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              If you believe your account has been compromised, log out of all devices and change your password immediately.
            </p>
            <button
              onClick={handleLogoutAllDevices}
              disabled={loggingOutAll}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loggingOutAll ? 'Logging Out...' : 'Log Out All Devices'}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ConnectedDevices;
