import { generateRecommendations } from "../logic/recommendationEngine";
import { useTranslation } from "react-i18next";

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
  variant = 'default',
  onAction = null 
}) {
  const { t } = useTranslation();
  // Ensure riskFactors is always an array
  const safeRiskFactors = Array.isArray(riskFactors) ? riskFactors : [];
  const recs = generateRecommendations(safeRiskFactors, maxRecommendations);

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

  const featureCardStyles = {
    newPayee: {
      card: 'bg-gradient-to-br from-violet-50 to-violet-50 border border-violet-200 rounded-2xl p-6 md:p-8 shadow-sm',
      iconWrap: 'p-3 md:p-4 bg-violet-100 rounded-lg',
      button: 'w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold cursor-pointer'
    },
    enable2FA: {
      card: 'bg-gradient-to-br from-green-50 to-green-50 border border-green-200 rounded-2xl p-6 md:p-8 shadow-sm',
      iconWrap: 'p-3 md:p-4 bg-green-100 rounded-lg',
      button: 'w-full md:w-auto px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold cursor-pointer'
    },
    newDevice: {
      card: 'bg-gradient-to-br from-red-50 to-red-50 border border-red-200 rounded-2xl p-6 md:p-8 shadow-sm',
      iconWrap: 'p-3 md:p-4 bg-red-100 rounded-lg',
      button: 'w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold cursor-pointer'
    },
    highAmount: {
      card: 'bg-gradient-to-br from-green-50 to-green-50 border border-green-200 rounded-2xl p-6 md:p-8 shadow-sm',
      iconWrap: 'p-3 md:p-4 bg-green-100 rounded-lg',
      button: 'w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold cursor-pointer'
    }
  };

  return (
    <div className={gridClass}>
      {recs.map((rec, i) => {
        const displayTitle = rec.titleKey ? t(rec.titleKey, rec.title) : rec.title;
        const displayDescription = rec.descriptionKey ? t(rec.descriptionKey, rec.description) : rec.description;
        const displayAction = rec.actionKey ? t(rec.actionKey, rec.action) : rec.action;

        return (
        <div
          key={i}
          className={
            variant === 'feature'
              ? (featureCardStyles[rec.key]?.card || 'bg-linear-to-br from-blue-50 to-blue-50 border border-blue-200 rounded-2xl p-6 md:p-8 shadow-sm')
              : 'bg-white border border-gray-200 rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow'
          }
        >
          <div className={variant === 'feature' ? 'flex items-start gap-4 md:gap-6' : 'flex items-start gap-4'}>
            {/* Icon */}
            <div className={
              variant === 'feature'
                ? `${featureCardStyles[rec.key]?.iconWrap || 'p-3 md:p-4 bg-blue-100 rounded-lg'} ${rec.iconColor} shrink-0`
                : `${rec.iconBg} ${rec.iconColor} p-2 md:p-3 rounded-lg shrink-0`
            }>
              {rec.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className={variant === 'feature' ? 'text-xl md:text-2xl font-bold text-gray-900 mb-2' : 'text-base md:text-lg font-bold text-gray-900 mb-2'}>
                {displayTitle}
              </h3>
              <p className={variant === 'feature' ? 'text-gray-700 mb-4' : 'text-sm md:text-base text-gray-600 mb-4 leading-relaxed'}>
                {displayDescription}
              </p>
              <button
                onClick={() => handleActionClick(rec)}
                className={
                  variant === 'feature'
                    ? (featureCardStyles[rec.key]?.button || 'w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold cursor-pointer')
                    : 'w-full bg-blue-600 text-white font-medium py-2.5 md:py-3 px-4 md:px-6 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm md:text-base shadow-sm hover:shadow-md cursor-pointer'
                }
              >
                {displayAction}
              </button>
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
}

export default AIRecommendationPanel;
