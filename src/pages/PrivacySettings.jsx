import { useState } from "react";
import SettingToggle from "../components/SettingToggle";
import BottomNavigation from "../components/BottomNavigation";

export default function PrivacySettings() {
  const [anonymousSharing, setAnonymousSharing] = useState(true);
  const [aiDetection, setAiDetection] = useState(true);
  const [behaviorLearning, setBehaviorLearning] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-screen-lg bg-white flex flex-col">

        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 md:px-6 md:py-4 border-b">
          <button className="text-3xl md:text-4xl lg:text-5xl cursor-pointer">←</button>
          <h1 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">
            Privacy & AI Settings
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 md:px-6 lg:px-8 divide-y space-y-6 md:space-y-8 lg:space-y-10">

          <SettingToggle
            title="Anonymous fraud pattern sharing"
            description="Help improve our fraud detection system by anonymously sharing transaction patterns. Your personal data remains private."
            enabled={anonymousSharing}
            onChange={() => setAnonymousSharing(!anonymousSharing)}
          />

          <SettingToggle
            title="AI-based anomaly detection"
            description="Enable real-time AI analysis of your transactions to identify and alert you about unusual or potentially fraudulent activities."
            enabled={aiDetection}
            onChange={() => setAiDetection(!aiDetection)}
          />

          <SettingToggle
            title="Personalized behavior learning"
            description="Allow AI to learn from your unique spending habits to provide more accurate and tailored security insights."
            enabled={behaviorLearning}
            onChange={() => setBehaviorLearning(!behaviorLearning)}
          />

          <div className="pt-6 md:pt-8 lg:pt-10">
            <button className="w-full bg-blue-600 text-white py-3 md:py-4 lg:py-5 rounded-lg text-sm md:text-base lg:text-lg font-medium cursor-pointer">
              View Security Recommendations
            </button>

            <p className="text-xs md:text-sm text-gray-500 text-center mt-2 px-2 md:px-4 lg:px-6">
              Get recommended security steps based on your settings
            </p>
          </div>
        </main>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>
    </div>
  );
}
