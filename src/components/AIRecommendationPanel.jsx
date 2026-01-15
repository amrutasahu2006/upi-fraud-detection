import { generateRecommendations } from "../logic/recommendationEngine";

/**
 * AIRecommendationPanel - Reusable component for displaying AI-driven security recommendations
 * @param {Array<string>} riskFactors - Array of risk factor identifiers
 * @param {number} maxRecommendations - Maximum number of recommendations to display (default: 3)
 * @param {string} layout - Layout style: 'grid' or 'list' (default: 'list')
 * @param {Function} onAction - Callback function when action button is clicked
 */
function AIRecommendationPanel({ 
  riskFactors = [], 
  maxRecommendations = 3, 
  layout = 'list',
  onAction = null 
}) {
  const recs = generateRecommendations(riskFactors, maxRecommendations);

  if (recs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No recommendations available at this time.</p>
      </div>
    );
  }

  const handleActionClick = (rec) => {
    if (onAction) {
      onAction(rec);
    } else {
      console.log(`Action clicked: ${rec.action}`);
    }
  };

  const gridClass = layout === 'grid' 
    ? 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5' 
    : 'space-y-3';

  return (
    <div className={gridClass}>
      {recs.map((rec, i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`${rec.iconBg} ${rec.iconColor} p-2 md:p-3 rounded-lg flex-shrink-0`}>
              {rec.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">
                {rec.title}
              </h3>
              <p className="text-sm md:text-base text-gray-600 mb-4 leading-relaxed">
                {rec.description}
              </p>
              <button
                onClick={() => handleActionClick(rec)}
                className="w-full bg-blue-600 text-white font-medium py-2.5 md:py-3 px-4 md:px-6 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm md:text-base shadow-sm hover:shadow-md cursor-pointer"
              >
                {rec.action}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AIRecommendationPanel;
