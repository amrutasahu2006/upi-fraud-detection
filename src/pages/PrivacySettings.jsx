import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";

export default function PrivacySettings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [settings, setSettings] = useState({
    anonymousSharing: true,
    aiDetection: true,
    behaviorLearning: false
  });

  // 1. Fetch settings from Database on load
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token'); 
        
        if (!token) {
           console.warn("No token found. User might not be logged in.");
           setLoading(false);
           return;
        }

        const res = await axios.get('http://localhost:5000/api/auth/privacy-settings', {
          headers: { 
            // --- FIXED: Updated to match your backend 'authenticate' middleware ---
            'Authorization': `Bearer ${token}` 
          }
        });
        
        if(res.data) {
           setSettings(res.data);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching settings:", err);
        if (err.response && err.response.status === 401) {
          alert(t('privacySettings.sessionExpired'));
            navigate('/login'); // Optional: redirect to login
        }
        setLoading(false);
      }
    };

    fetchSettings();
  }, [navigate]);

  // 2. Handle Toggle & Save to Database
  const handleToggle = async (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);

    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/auth/privacy-settings', newSettings, {
        headers: { 
          // --- FIXED: Updated to match your backend ---
          'Authorization': `Bearer ${token}` 
        }
      });
    } catch (err) {
      console.error("Error saving settings:", err);
      setSettings({ ...settings, [key]: settings[key] }); // Revert on error
      alert(t('privacySettings.saveFailed'));
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{t('privacySettings.loadingSettings')}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-screen-lg bg-white flex flex-col">

        {/* Header */}
        <header className="flex items-center gap-2 md:gap-3 px-4 py-3 md:px-6 md:py-4 border-b">
          <button onClick={() => navigate('/security-warning')} aria-label="Go back" className="text-2xl cursor-pointer">←</button>
          <h1 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">
            {t('privacySettings.privacyAiTitle')}
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 md:px-6 lg:px-8 divide-y space-y-6 md:space-y-8 lg:space-y-10">

          <SettingToggle
            title={t('privacySettings.anonymousFraudSharing')}
            description={t('privacySettings.anonymousFraudSharingDesc')}
            enabled={settings.anonymousSharing}
            onChange={() => handleToggle('anonymousSharing')}
          />

          <SettingToggle
            title={t('privacySettings.aiAnomalyDetection')}
            description={t('privacySettings.aiAnomalyDetectionDesc')}
            enabled={settings.aiDetection}
            onChange={() => handleToggle('aiDetection')}
          />

          <SettingToggle
            title={t('privacySettings.behaviorLearning')}
            description={t('privacySettings.behaviorLearningDesc')}
            enabled={settings.behaviorLearning}
            onChange={() => handleToggle('behaviorLearning')}
          />

          <div className="pt-6 md:pt-8 lg:pt-10">
            <button 
              className="w-full bg-blue-600 text-white py-3 md:py-4 lg:py-5 rounded-lg text-sm md:text-base lg:text-lg font-medium cursor-pointer"
              onClick={() => navigate("/recommendations")}
            >
              {t('privacySettings.viewRecommendations')}
            </button>

            <p className="text-xs md:text-sm text-gray-500 text-center mt-2 px-2 md:px-4 lg:px-6">
              {t('privacySettings.viewRecommendationsDesc')}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

// Subcomponent
function SettingToggle({ title, description, enabled, onChange }) {
  return (
    <div className="w-full flex items-start justify-between gap-4 py-8">
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          {description}
        </p>
      </div>

      <button
        onClick={onChange}
        className={`shrink-0 relative inline-flex h-6 w-16 items-center rounded-full transition cursor-pointer
        ${enabled ? "bg-blue-500" : "bg-gray-300"}`}
      >
        <span
          className={`absolute left-1 h-5 w-5 rounded-full bg-white transition transform
          ${enabled ? "translate-x-9" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}