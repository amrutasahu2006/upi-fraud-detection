import { Link } from "react-router-dom";
import AIRecommendationPanel from "../components/AIRecommendationPanel";

function SecurityRecommendations() {
  // AI-driven risk factors - can be dynamically generated based on user behavior, transaction history, or backend analysis
  const riskFactors = ["newPayee", "highAmount", "newDevice", "enable2FA"];

  // Callback for when user clicks on a recommendation action
  const handleRecommendationAction = (recommendation) => {
    console.log(`Action clicked: ${recommendation.action}`, recommendation);
    // Here you can add navigation, API calls, or other actions based on the recommendation
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-screen-lg bg-white flex flex-col">
        {/* Page Header */}
        <header className="flex items-center gap-2 md:gap-3 px-4 py-3 md:px-6 md:py-4 border-b">
          <Link to="/" className="text-2xl cursor-pointer">←</Link>
          <h1 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">Security Recommendations</h1>
        </header>

        {/* Main Content */}
        <main className="p-4 md:p-6 lg:p-8">
          {/* Heading Section */}
          <div className="mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              Stay Secure, Always.
            </h2>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              AI-powered recommendations based on detected risk factors to keep your account safe.
            </p>
          </div>

          {/* AI Recommendation Panel */}
          <AIRecommendationPanel 
            riskFactors={riskFactors} 
            maxRecommendations={4}
            layout="grid"
            onAction={handleRecommendationAction}
          />
        </main>
      </div>
    </div>
  );
}

export default SecurityRecommendations;

