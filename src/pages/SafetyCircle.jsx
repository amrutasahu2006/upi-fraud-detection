import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from "../context/AuthContext";
import SyncCircle from '../components/SyncCircle';
import { Shield, Users, Phone, CheckCircle, UserCheck } from 'lucide-react';

const SafetyCircle = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Directly pull the array of IDs from your database object
  const trustedMembers = user?.trustedCircle || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="text-blue-600" size={32} />
          <h1 className="text-2xl font-bold">{t('safety.safetyCircleTitle')}</h1>
        </div>

        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-8">
          <p className="text-blue-800 text-sm">
            <strong>{t('safety.howItWorks')}:</strong> {t('safety.howItWorksDesc')}
          </p>
        </div>

        <SyncCircle />

        <div className="mt-12">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Users size={20} /> {t('safety.trustedMembers')} ({trustedMembers.length})
          </h2>
          
          {trustedMembers.length > 0 ? (
            <div className="grid gap-3">
              {trustedMembers.map((member, index) => {
                // LOGIC: Handle raw IDs from your DB array
                const isIdOnly = typeof member === 'string';
                const displayName = isIdOnly ? `${t('safety.trustedMember')} ${member.slice(-4)}` : member.username;
                const displayPhone = isIdOnly ? t('safety.verifiedMember') : member.phoneNumber;

                return (
                  <div key={isIdOnly ? member : member._id} className="bg-white rounded-xl border border-gray-200 p-4 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                        {isIdOnly ? <UserCheck size={18} /> : displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{displayName}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone size={12} /> {displayPhone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-lg text-xs font-bold border border-green-100">
                      <CheckCircle size={14} /> {t('safety.protected')}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
              {t('safety.noMembers')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SafetyCircle;