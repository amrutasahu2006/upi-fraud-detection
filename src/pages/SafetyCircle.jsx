import React from 'react';
import SyncCircle from '../components/SyncCircle';
import { Shield, Users, AlertTriangle } from 'lucide-react';

const SafetyCircle = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="text-blue-600" size={32} />
          <h1 className="text-2xl font-bold">UPI Safety Circle</h1>
        </div>

        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-8">
          <p className="text-blue-800 text-sm">
            <strong>How it works:</strong> When you sync your contacts, we find friends already using this app. If anyone in your circle reports a fraud UPI ID, you'll get an instant warning before you pay them.
          </p>
        </div>

        <SyncCircle />

        <div className="mt-12">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Users size={20} /> Your Trusted Members
          </h2>
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
            No members linked yet. Click the button above to sync with your contacts.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyCircle;