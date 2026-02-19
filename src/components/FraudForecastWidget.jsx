import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  Calendar,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

const FraudForecastWidget = () => {
  const { token } = useAuth();
  const { t, i18n } = useTranslation();
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchForecast();
  }, []);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/analysis/forecast', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch forecast');
      }

      setForecast(data.data);
    } catch (err) {
      console.error('Forecast error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score >= 70) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (score >= 30) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'CRITICAL':
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case 'HIGH':
        return <AlertTriangle className="w-6 h-6 text-orange-600" />;
      case 'MEDIUM':
        return <Info className="w-6 h-6 text-yellow-600" />;
      default:
        return <Shield className="w-6 h-6 text-green-600" />;
    }
  };

  const getLocalizedDayName = (dateString, format = 'short') => {
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return dateString;
    return parsed.toLocaleDateString(i18n.language || 'en', { weekday: format });
  };

  const getLocalizedRiskMessage = (score, dailyData) => {
    const highRiskDays = (dailyData || []).filter((day) => day.riskScore >= 60);
    const dayNames = highRiskDays.map((day) => getLocalizedDayName(day.date, 'long')).join(', ');

    if (score >= 70) {
      return t('fraudForecast.messageCritical', {
        score,
        count: highRiskDays.length,
      });
    }

    if (score >= 50) {
      return t('fraudForecast.messageHigh', {
        score,
        days: dayNames || t('fraudForecast.thisWeek'),
      });
    }

    if (score >= 30) {
      return t('fraudForecast.messageMedium', { score });
    }

    return t('fraudForecast.messageLow', { score });
  };

  const getLocalizedTips = (score) => {
    if (score >= 70) {
      return [
        t('fraudForecast.tips.critical.1'),
        t('fraudForecast.tips.critical.2'),
        t('fraudForecast.tips.critical.3'),
        t('fraudForecast.tips.critical.4'),
      ];
    }

    if (score >= 50) {
      return [
        t('fraudForecast.tips.high.1'),
        t('fraudForecast.tips.high.2'),
        t('fraudForecast.tips.high.3'),
        t('fraudForecast.tips.high.4'),
      ];
    }

    if (score >= 30) {
      return [
        t('fraudForecast.tips.medium.1'),
        t('fraudForecast.tips.medium.2'),
        t('fraudForecast.tips.medium.3'),
        t('fraudForecast.tips.medium.4'),
      ];
    }

    return [
      t('fraudForecast.tips.low.1'),
      t('fraudForecast.tips.low.2'),
      t('fraudForecast.tips.low.3'),
      t('fraudForecast.tips.low.4'),
    ];
  };

  const getFactorLabel = (factor) => {
    const factorMap = {
      transactionVelocity: 'fraudForecast.factors.transactionVelocity',
      amountAnomaly: 'fraudForecast.factors.amountAnomaly',
      timePatternAnomaly: 'fraudForecast.factors.timePatternAnomaly',
      newPayeeRatio: 'fraudForecast.factors.newPayeeRatio',
      weekendFactor: 'fraudForecast.factors.weekendFactor',
      recentFraudReports: 'fraudForecast.factors.recentFraudReports',
    };

    return t(factorMap[factor] || factor, factor.replace(/([A-Z])/g, ' $1').trim());
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-red-600 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span>{t('fraudForecast.unableToLoad')}</span>
        </div>
      </div>
    );
  }

  if (!forecast) return null;

  const { overallRisk, riskLevel, dailyForecast, contributingFactors } = forecast;
  const localizedMessage = getLocalizedRiskMessage(overallRisk, dailyForecast);
  const localizedTips = getLocalizedTips(overallRisk);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className={`p-6 ${getRiskColor(overallRisk)} border-b`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getRiskIcon(riskLevel)}
            <div>
              <h3 className="text-lg font-bold">{t('fraudForecast.title')}</h3>
              <p className="text-sm opacity-80">{t('fraudForecast.next7Days')}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{overallRisk}%</div>
            <div className="text-sm font-medium">{t(`fraudForecast.riskLevels.${String(riskLevel).toLowerCase()}`, `${riskLevel} RISK`)}</div>
          </div>
        </div>
      </div>

      {/* Main Message */}
      <div className="p-6 border-b border-gray-100">
        <p className="text-gray-700 leading-relaxed">{localizedMessage}</p>
      </div>

      {/* Daily Forecast */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-500" />
          <h4 className="font-semibold text-gray-800">{t('fraudForecast.dailyBreakdown')}</h4>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {dailyForecast.map((day, index) => (
            <div 
              key={index}
              className={`text-center p-3 rounded-lg ${
                day.isWeekend ? 'bg-gray-50' : 'bg-white'
              } ${day.riskScore >= 60 ? 'ring-2 ring-red-200' : ''}`}
            >
              <div className="text-xs text-gray-500 mb-1">
                {getLocalizedDayName(day.date, 'short')}
              </div>
              <div className={`text-lg font-bold ${
                day.riskScore >= 70 ? 'text-red-600' :
                day.riskScore >= 50 ? 'text-orange-600' :
                day.riskScore >= 30 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {day.riskScore}
              </div>
              <div className="text-xs text-gray-400">{day.date.slice(5)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Contributing Factors */}
      <div className="p-6 border-b border-gray-100">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-500" />
            <h4 className="font-semibold text-gray-800">{t('fraudForecast.contributingFactors')}</h4>
          </div>
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        
        {expanded && (
          <div className="mt-4 space-y-3">
            {Object.entries(contributingFactors).map(([factor, data]) => (
              <div key={factor} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 capitalize">
                      {getFactorLabel(factor)}
                    </span>
                    <span className="text-sm font-medium">{data.score}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${Math.min(data.score, 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-gray-400 ml-3 w-12 text-right">
                  {(data.weight * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Safety Tips */}
      <div className="p-6 bg-gray-50">
        <h4 className="font-semibold text-gray-800 mb-3">{t('fraudForecast.recommendedActions')}</h4>
        <ul className="space-y-2">
          {localizedTips.map((tip, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
              <Shield className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FraudForecastWidget;
