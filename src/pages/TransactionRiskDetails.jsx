import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Clock, Smartphone, MapPin, UserPlus, BarChart, ChevronRight, ShieldAlert, Calendar, TrendingUp, Activity, Globe, Monitor } from "lucide-react";
import { useTransaction } from "../context/TransactionContext";
import AIRecommendationPanel from "../components/AIRecommendationPanel";
import { translateBackendReason } from "../utils/translateBackendReason";

const TransactionRiskDetails = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentTransaction, riskAnalysis, userLocation } = useTransaction();

  // Use location from transaction data if available, otherwise from context
  const effectiveUserLocation = currentTransaction?.location || userLocation;

  // Debug: Log the data with timestamp
  console.log("==================================================");
  console.log("⏰ Risk Details Page Loaded at:", new Date().toISOString());
  console.log("🔍 Risk Analysis from Context:", JSON.stringify(riskAnalysis, null, 2));
  console.log("💳 Transaction from Context:", JSON.stringify(currentTransaction, null, 2));
  console.log("📍 User Location from Context:", JSON.stringify(userLocation, null, 2));
  console.log("==================================================");

  // Use actual data from backend - always trust backend calculations
  const displayRiskScore = riskAnalysis?.riskScore ?? 0;
  const displayRiskLevel = riskAnalysis?.riskLevel ?? "UNKNOWN";
  
  // Convert backend riskFactors (object with weights) to array of factor names for recommendations
  const backendRiskFactors = riskAnalysis?.riskFactors ?? {};
  const displayRiskFactors = (() => {
    // If it's already an array, use it
    if (Array.isArray(backendRiskFactors)) return backendRiskFactors;
    
    // Convert object keys to array of factor names, mapping backend names to recommendation keys
    const factorMapping = {
      'amountAnomaly': 'highAmount',
      'timePattern': 'unusualTime',
      'newPayee': 'newPayee',
      'deviceFingerprint': 'newDevice',
      'locationAnomaly': 'newLocation',
      'velocityCheck': 'suspiciousPattern',
      'blacklistHit': 'blockVPA',
      'whitelistHit': 'enable2FA'
    };
    
    return Object.keys(backendRiskFactors)
      .filter(key => backendRiskFactors[key] > 0) // Only include factors with risk
      .map(key => factorMapping[key] || key); // Map to recommendation keys
  })();
  
  console.log("🎯 Risk Factors for Recommendations:", displayRiskFactors);
  
  const decision = riskAnalysis?.decision ?? 'UNKNOWN';
  const delayMinutes = (riskAnalysis?.metadata?.delayMinutes)
    ?? (riskAnalysis?.metadata?.delayDuration ? Math.round(riskAnalysis.metadata.delayDuration / 60) : undefined)
    ?? 5;
  const transactionAmount = currentTransaction?.amount ?? 0;
  const transactionId = riskAnalysis?.transactionId ?? currentTransaction?.transactionId ?? "UNKNOWN";

  // Extract detailed analysis data from backend
  const analysis = riskAnalysis?.analysis ?? {};

  // Time analysis - backend uses 'timeAnalysis'
  const timeAnalysis = analysis?.timeAnalysis;
  const hasTimeRisk = displayRiskFactors.includes('unusualTime') || timeAnalysis?.isUnusual;

  // Amount analysis - backend uses 'amountAnalysis'
  const amountAnalysis = analysis?.amountAnalysis;
  const hasAmountRisk = displayRiskFactors.includes('highAmount') || displayRiskFactors.includes('amountAnomaly') || amountAnalysis?.isAnomalous;

  // Recipient analysis - backend uses 'recipientAnalysis'
  const recipientAnalysis = analysis?.recipientAnalysis;
  const hasRecipientRisk = displayRiskFactors.includes('newPayee') || displayRiskFactors.includes('rarePayee') || recipientAnalysis?.isNewPayee || recipientAnalysis?.isRarePayee;

  // Device analysis - backend uses 'device'
  const deviceAnalysis = analysis?.device;
  const hasDeviceRisk = displayRiskFactors.includes('newDevice') || deviceAnalysis?.isNewDevice;

  // Location analysis - backend uses 'locationAnalysis'
  const locationAnalysis = analysis?.locationAnalysis;
  const hasLocationRisk = displayRiskFactors.includes('newLocation') || displayRiskFactors.includes('locationUnavailable') || locationAnalysis?.isNewLocation || locationAnalysis?.isLocationUnavailable;

  // Transaction details
  const transactionTime = new Date(currentTransaction?.timestamp || Date.now());
  const indianLocale = 'en-IN';
  const timeZone = 'Asia/Kolkata';

  const transactionHour = new Intl.DateTimeFormat(indianLocale, {
    hour: 'numeric',
    hour12: false,
    timeZone,
  }).format(transactionTime);

  // Helper function to convert 24-hour format to 12-hour format
  const formatHourTo12Hour = (hour24) => {
    const hour = parseInt(hour24);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:00 ${period}`;
  };
  
  const transactionDate = new Intl.DateTimeFormat(indianLocale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone,
  }).format(transactionTime);

  const transactionDayName = new Intl.DateTimeFormat(indianLocale, {
    weekday: 'long',
    timeZone,
  }).format(transactionTime);

  const transactionTimeString = new Intl.DateTimeFormat(indianLocale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone,
    hour12: false,
  }).format(transactionTime);

  // Device information
  const deviceInfo = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    deviceType: /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
    browser: navigator.userAgent.includes('Chrome') ? 'Chrome' :
             navigator.userAgent.includes('Firefox') ? 'Firefox' :
             navigator.userAgent.includes('Safari') ? 'Safari' :
             navigator.userAgent.includes('Edge') ? 'Edge' : 'Unknown',
    isNewDevice: deviceAnalysis?.isNewDevice || displayRiskFactors.includes('newDevice')
  };

  // Location details with reverse geocoding - use transaction location first, then context
  const locationData = currentTransaction?.location || effectiveUserLocation;
  
  // Helper function to build detailed address string
  const buildDetailedAddress = (loc) => {
    if (!loc) return "Unknown Location";
    
    // If formattedAddress is available from geocoding, use it
    if (loc.formattedAddress) {
      return loc.formattedAddress;
    }
    
    // Otherwise, build from individual components
    const parts = [];
    if (loc.road) parts.push(loc.road);
    if (loc.suburb || loc.neighbourhood) parts.push(loc.suburb || loc.neighbourhood);
    if (loc.city) parts.push(loc.city);
    if (loc.district && loc.district !== loc.city) parts.push(loc.district);
    if (loc.state) parts.push(loc.state);
    if (loc.postcode) parts.push(loc.postcode);
    if (loc.country) parts.push(loc.country);
    
    return parts.length > 0 ? parts.join(', ') : `${loc.city || 'Unknown City'}, ${loc.state || 'Unknown State'}, India`;
  };
  
  const currentLocation = locationData ? {
    latitude: locationData.latitude,
    longitude: locationData.longitude,
    accuracy: locationData.accuracy,
    // Detailed address components from geocoding
    city: locationAnalysis?.location?.city || locationData.city || "Unknown City",
    state: locationAnalysis?.location?.state || locationData.state || "Unknown State",
    country: locationAnalysis?.location?.country || locationData.country || "India",
    suburb: locationAnalysis?.location?.suburb || locationData.suburb || "",
    district: locationAnalysis?.location?.district || locationData.district || "",
    road: locationAnalysis?.location?.road || locationData.road || "",
    neighbourhood: locationAnalysis?.location?.neighbourhood || locationData.neighbourhood || "",
    postcode: locationAnalysis?.location?.postcode || locationData.postcode || "",
    formattedAddress: locationAnalysis?.location?.formattedAddress || locationData.formattedAddress || "",
    // Display address
    displayAddress: buildDetailedAddress(locationAnalysis?.location || locationData)
  } : null;

  // Get detailed risk information
  const timeRiskDetails = timeAnalysis ? {
    isUnusual: timeAnalysis.isUnusual,
    confidence: timeAnalysis.confidence,
    reason: timeAnalysis.reason,
    typicalHours: timeAnalysis.typicalHours || [],
    currentHour: timeAnalysis.currentHour,
    dayOfWeekName: timeAnalysis.dayOfWeekName,
    riskScore: timeAnalysis.riskScore
  } : null;

  const amountRiskDetails = amountAnalysis ? {
    isAnomalous: amountAnalysis.isAnomalous,
    confidence: amountAnalysis.confidence,
    reason: amountAnalysis.reason,
    deviation: amountAnalysis.deviation,
    patterns: amountAnalysis.patterns
  } : null;

  const recipientRiskDetails = recipientAnalysis ? {
    isNewPayee: recipientAnalysis.isNewPayee,
    isRarePayee: recipientAnalysis.isRarePayee,
    riskScore: recipientAnalysis.riskScore,
    reason: recipientAnalysis.reason,
    profile: recipientAnalysis.profile
  } : null;

  console.log("📊 Displaying to User:");
  console.log("  Risk Score:", displayRiskScore + "%");
  console.log("  Risk Level:", displayRiskLevel);
  console.log("  Risk Factors:", displayRiskFactors);
  console.log("  Location:", currentLocation);
  console.log("  Device:", deviceInfo);

  // Prepare text for Amount Analysis to be consistent with time analysis
  const amountPatterns = amountRiskDetails?.patterns;
  let amountDetailsText = t('riskDetails.amountAnalyzingPatterns');
  
  // Check if amount history is established.
  const hasAmountHistory = amountPatterns?.hasEnoughData && typeof amountPatterns?.averageAmount === 'number';

  if (amountRiskDetails) {
    // If there IS enough data for amount patterns, show the detailed average comparison.
    if (hasAmountHistory) {
      const averageAmount = amountPatterns.averageAmount;
      const multiplier = (transactionAmount / averageAmount).toFixed(1);
      
      if (hasAmountRisk) {
        amountDetailsText = t('riskDetails.amountHigherThanUsualAverage', {
          multiplier,
          averageAmount: averageAmount.toFixed(0),
        });
      } else {
        amountDetailsText = t('riskDetails.averageTransactionAmount', {
          averageAmount: averageAmount.toFixed(0),
        });
      }
    }
    // If there is a risk but no established amount history, use a generic message.
    else if (hasAmountRisk) {
      amountDetailsText = t('riskDetails.amountUnusualNewPattern');
    }
    // If there's not enough data for amount patterns, it's the first transaction.
    else if (amountPatterns && !amountPatterns.hasEnoughData) {
      amountDetailsText = t('riskDetails.firstTransactionBuildingHistory');
    }
    // Fallback to a generic reason if one exists.
    else if (amountRiskDetails.reason) {
      amountDetailsText = translateBackendReason(amountRiskDetails.reason, t);
    }
  } else if (hasAmountHistory) {
    // Fallback to direct amountAnalysis data if amountRiskDetails is not available but amount history exists
    const averageAmount = amountPatterns.averageAmount;
    const multiplier = (transactionAmount / averageAmount).toFixed(1);
    amountDetailsText = t('riskDetails.amountHigherThanAverage', {
      multiplier,
      averageAmount: averageAmount.toFixed(0),
    });
  }

  // Prepare text for Recipient Analysis to avoid showing "unknown"
  let recipientDetailsText = t('riskDetails.recipientAnalyzingPatterns');
  if (recipientRiskDetails) {
    if (recipientRiskDetails.isNewPayee) {
      recipientDetailsText = t('riskDetails.firstTimeRecipient');
    } else if (recipientRiskDetails.profile) {
      const transactionCount = recipientRiskDetails.profile.transactionCount || 0;
      if (typeof recipientRiskDetails.profile.averageAmount === 'number') {
        recipientDetailsText = t('riskDetails.recipientHistoryWithAverage', {
          count: transactionCount,
          averageAmount: recipientRiskDetails.profile.averageAmount.toFixed(0),
        });
      } else {
        recipientDetailsText = t('riskDetails.recipientHistoryOnly', { count: transactionCount });
      }
    }
  }

  // Always show all analysis categories with detailed information
  const analysisCategories = [
    // Time Analysis - Always show current timing info
    {
      icon: Clock,
      title: t('riskDetails.timeAnalysis'),
      description: `${t('riskDetails.transactionInitiatedAt', { hour: transactionHour, day: transactionDayName, date: transactionDate })} ${hasTimeRisk ? t('riskDetails.timingFlaggedUnusual') : t('riskDetails.timingAppearsNormal')} ${timeRiskDetails ? t('riskDetails.typicalHoursDescription', { hours: timeRiskDetails.typicalHours.length > 0 ? timeRiskDetails.typicalHours.map(hour => formatHourTo12Hour(hour)).join(', ') : t('riskDetails.notEstablishedYet') }) : ''}`,
      isRisk: hasTimeRisk,
      type: 'timing',
      details: {
        currentTime: `${transactionHour}:00`,
        dayOfWeek: transactionDayName,
        date: transactionDate,
        typicalHours: timeRiskDetails?.typicalHours || [],
        confidence: timeRiskDetails?.confidence || 0
      }
    },

    // Amount Analysis - Always show amount details
    {
      icon: TrendingUp,
      title: t('riskDetails.amountAnalysis'),
      description: `${t('riskDetails.transactionAmountValue', { amount: transactionAmount.toLocaleString() })} ${hasAmountRisk ? t('riskDetails.amountAnomalous') : t('riskDetails.amountWithinNormalRange')} ${amountDetailsText}`,
      isRisk: hasAmountRisk,
      type: 'amount',
      details: {
        amount: transactionAmount,
        averageAmount: amountRiskDetails?.patterns?.averageAmount || 0,
        deviation: amountRiskDetails?.deviation || 0,
        confidence: amountRiskDetails?.confidence || 0
      }
    },

    // Recipient Analysis - Always show recipient info
    {
      icon: UserPlus,
      title: t('riskDetails.recipientAnalysis'),
      description: `${t('riskDetails.recipientDetailsSummary', {
        name: currentTransaction?.recipient?.name || t('riskDetails.unknown'),
        upi: currentTransaction?.recipient?.upi || t('riskDetails.unknownUpiId'),
      })} ${hasRecipientRisk ? t('riskDetails.recipientFlaggedHighRisk') : t('riskDetails.recipientStatusVerified')} ${recipientDetailsText}`,
      isRisk: hasRecipientRisk,
      type: 'recipient',
      details: {
        name: currentTransaction?.recipient?.name || t('riskDetails.unknown'),
        upiId: currentTransaction?.recipient?.upi || t('riskDetails.unknown'),
        isNewPayee: recipientRiskDetails?.isNewPayee || false,
        transactionCount: recipientRiskDetails?.profile?.transactionCount || 0,
        averageAmount: recipientRiskDetails?.profile?.averageAmount || 0
      }
    },

    // Device Information - Always show device details
    {
      icon: Monitor,
      title: t('security.reviewDevicesTitle'),
      description: `${t('riskDetails.deviceSummary', {
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        platform: deviceInfo.platform,
      })} ${hasDeviceRisk ? t('riskDetails.newOrUnrecognizedDeviceDetected') : t('riskDetails.deviceFingerprintVerified')} ${t('riskDetails.userAgentPrefix')} ${deviceInfo.userAgent.substring(0, 50)}...`,
      isRisk: hasDeviceRisk,
      type: 'device',
      details: {
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        platform: deviceInfo.platform,
        userAgent: deviceInfo.userAgent,
        isNewDevice: deviceInfo.isNewDevice
      }
    },

    // Location Information - Always show location details
    {
      icon: Globe,
      title: t('riskDetails.locationAnalysis'),
      description: `${t('riskDetails.locationWithAddress', { address: currentLocation?.displayAddress || t('riskDetails.unknownLocation') })} ${translateBackendReason(locationAnalysis?.reason, t) || (hasLocationRisk ? t('riskDetails.locationAnalysisIndicatesRisk') : t('riskDetails.locationVerified'))}`,
      isRisk: hasLocationRisk,
      type: 'location',
      details: locationAnalysis ? {
        formattedAddress: currentLocation?.displayAddress,
        city: locationAnalysis.location?.city,
        state: locationAnalysis.location?.state,
        latitude: locationAnalysis.location?.latitude,
        longitude: locationAnalysis.location?.longitude,
        accuracy: locationAnalysis.location?.accuracy,
        typicalLocations: locationAnalysis.typicalLocations,
        nearestDistance: locationAnalysis.nearestDistance,
      } : null
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-screen-lg bg-white flex flex-col">

        {/* Page Header */}
        <header className="flex items-center gap-3 px-4 py-3 md:px-6 md:py-4 border-b">
          <button onClick={() => navigate('/security-warning')} aria-label="Go back" className="text-2xl cursor-pointer">←</button>
          <h1 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">{t('riskDetails.title')}</h1>
        </header>

        {/* Main Content */}
        <main className="p-4 md:p-6 lg:p-8">

          {/* Transaction Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">{t('riskDetails.transactionSummary')}</span>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                {transactionDate} at {transactionTimeString}
              </span>
            </div>
            <div className="text-lg font-bold text-blue-900">
              ₹{transactionAmount.toLocaleString()} {t('riskDetails.toRecipient')} {currentTransaction?.recipient?.name || t('riskDetails.unknownRecipient')}
            </div>
            <div className="text-sm text-blue-700 mt-1">
              {t('riskDetails.upiIdLabel')}: {currentTransaction?.recipient?.upi || t('riskDetails.unknown')}
            </div>
          </div>

          <p className="text-slate-500 mt-2 text-sm sm:text-base">
            {t('riskDetails.riskAnalysis')}: <span className="font-mono font-medium text-slate-700">#{transactionId}</span>
          </p>

          {/* Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

            {/* LEFT SIDE: Comprehensive Analysis */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  {t('riskDetails.riskAnalysis')}
                  <span className="px-2.5 py-0.5 text-[10px] sm:text-xs bg-blue-100 text-blue-600 rounded-full font-bold uppercase tracking-wider border border-blue-200">
                    AI-Powered
                  </span>
                </h2>
              </div>

              {/* Analysis Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {analysisCategories.map((category, index) => (
                  <div
                    key={`${category.title}-${index}`}
                    className={`group bg-white border rounded-2xl p-5 sm:p-6 hover:shadow-md transition-all duration-300 ${
                      category.isRisk
                        ? 'border-red-300 hover:border-red-400 bg-red-50/30'
                        : 'border-slate-200 hover:border-blue-400'
                    }`}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                      category.isRisk
                        ? 'bg-red-100 group-hover:bg-red-600'
                        : 'bg-blue-50 group-hover:bg-blue-600'
                    }`}>
                      <category.icon size={24} className={`transition-colors ${
                        category.isRisk
                          ? 'text-red-600 group-hover:text-white'
                          : 'text-blue-600 group-hover:text-white'
                      }`} />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base sm:text-lg font-bold text-slate-800">{category.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        category.isRisk
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {category.isRisk ? `⚠️ ${t('securityWarning.riskDetected')}` : `✅ ${t('common.success')}`}
                      </span>
                    </div>
                    <p className="text-slate-500 leading-relaxed text-xs sm:text-sm mb-3">
                      {category.description}
                    </p>

                    {/* Additional Details */}
                    <div className="border-t border-slate-100 pt-3 mt-3">
                      <div className="text-xs text-slate-400 space-y-1">
                        {category.type === 'timing' && (
                          <>
                            <div>{t('riskDetails.detailTime')}: {category.details.currentTime}</div>
                            <div>{t('riskDetails.detailDay')}: {category.details.dayOfWeek}</div>
                            {category.details.typicalHours.length > 0 && (
                              <div>{t('riskDetails.detailTypicalHours')}: {category.details.typicalHours.map(hour => formatHourTo12Hour(hour)).join(', ')}</div>
                            )}
                          </>
                        )}
                        {category.type === 'amount' && (
                          <>
                            <div>{t('riskDetails.detailAmount')}: ₹{category.details.amount.toLocaleString()}</div>
                            {/* Only show historical comparisons if amount history is established */}
                            {hasAmountHistory && category.details.averageAmount > 0 && (
                              <>
                                <div>{t('riskDetails.detailAverage')}: ₹{category.details.averageAmount.toFixed(0)}</div>
                                <div>
                                  {t('riskDetails.amountRatioVsAverage', { ratio: (category.details.amount / category.details.averageAmount).toFixed(1) })}
                                </div>
                                {category.details.deviation !== 0 && (
                                  <div>
                                    {t('riskDetails.standardDeviationFromAverage', { deviation: category.details.deviation.toFixed(1) })}
                                  </div>
                                )}
                              </>
                            )}
                          </>
                        )}
                        {category.type === 'recipient' && (
                          <>
                            <div>{t('riskDetails.detailName')}: {category.details.name}</div>
                            <div>{t('riskDetails.detailUpi')}: {category.details.upiId}</div>
                            <div>{t('riskDetails.detailStatus')}: {category.details.isNewPayee ? t('riskDetails.newRecipient') : (category.details.transactionCount > 0 ? t('riskDetails.transactionCount', { count: category.details.transactionCount }) : t('riskDetails.noPreviousTransactionsWithRecipient'))}</div>
                          </>
                        )}
                        {category.type === 'device' && (
                          <>
                            <div>{t('riskDetails.detailDevice')}: {category.details.deviceType}</div>
                            <div>{t('riskDetails.detailBrowser')}: {category.details.browser}</div>
                            <div>{t('riskDetails.detailPlatform')}: {category.details.platform}</div>
                          </>
                        )}
                        {category.type === 'location' && category.details && (
                          <>
                            <div>{t('riskDetails.detailLocation')}: {category.details.formattedAddress || `${category.details.city}, ${category.details.state}`}</div>
                            {category.details.latitude && <div>{t('riskDetails.detailCoordinates')}: {category.details.latitude.toFixed(4)}, {category.details.longitude.toFixed(4)}</div>}
                            {typeof category.details.nearestDistance === 'number' && <div>{t('riskDetails.detailDistanceFromTypical', { distance: category.details.nearestDistance.toFixed(1) })}</div>}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT SIDE: AI Score Card */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-20 mt-8 lg:mt-20 bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-900/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-blue-50 rounded-full blur-3xl opacity-50"></div>

                <div className="flex flex-col items-start text-left relative z-10">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 rounded-2xl flex items-center justify-start mb-4 sm:mb-5 shadow-lg shadow-blue-200 rotate-3 pl-3">
                    <BarChart size={20} className="text-white" />
                  </div>

                  <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
                    {t('riskDetails.recommendation')}
                  </h3>
                  <div className="text-5xl sm:text-6xl font-black text-slate-900 mb-4">{displayRiskScore}%</div>

                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden mb-6">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        displayRiskScore >= 70 ? 'bg-red-500' : displayRiskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${displayRiskScore}%` }}
                    ></div>
                  </div>

                  <blockquote className="text-slate-500 leading-relaxed italic text-sm sm:text-base border-l-4 border-blue-100 pl-4 text-left">
                    {displayRiskLevel === "HIGH"
                      ? '"This transaction deviates significantly from your established payment patterns and requires immediate manual review."'
                      : displayRiskLevel === "MEDIUM"
                      ? '"This transaction shows some unusual patterns. Please review the recommendations below."'
                      : '"Transaction appears normal but consider these security tips."'
                    }
                  </blockquote>
                </div>
              </div>
            </div>

          </div>

          {/* AI Recommendations Section */}
          {/* Suggested Next Action (Delay or Block) */}
          <div className="mt-8 lg:mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('riskDetails.recommendation')}
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              {t('securityWarning.reviewTransaction')}
            </p>

            {/* Determine recommended action: BLOCK for >=80, DELAY for 60-79, DELAY for 30-59 */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Delay Button */}
              <button
                onClick={() => navigate('/security-warning')}
                className={`px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-sm cursor-pointer ${
                  displayRiskScore >= 60 && displayRiskScore < 80 ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-700 hover:bg-gray-800'
                }`}
                aria-label={`Delay transaction by ${delayMinutes} minutes`}
              >
                ⏳ {t('riskDetails.delayTransaction')} ({delayMinutes} min)
              </button>

              {/* Block Button */}
              <button
                onClick={() => navigate('/blocked')}
                className={`px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-sm cursor-pointer ${
                  displayRiskScore >= 80 || decision === 'BLOCK' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                }`}
                aria-label="Block and report this transaction"
              >
                🚫 {t('riskDetails.blockTransaction')}
              </button>
            </div>

            {displayRiskScore >= 80 && (
              <p className="text-red-600 text-xs mt-2">Critical risk detected. Blocking is strongly recommended.</p>
            )}
            {displayRiskScore >= 60 && displayRiskScore < 80 && (
              <p className="text-orange-600 text-xs mt-2">High risk detected. Delaying for security verification is advised.</p>
            )}
            {displayRiskScore >= 30 && displayRiskScore < 60 && (
              <p className="text-yellow-600 text-xs mt-2">Moderate risk detected. Consider delaying before proceeding.</p>
            )}
          </div>

          {/* AI Recommendations Section */}
          <div className="mt-8 lg:mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('security.recommendations')}
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              {t('security.staySecureDesc')}
            </p>

            <AIRecommendationPanel
              riskFactors={displayRiskFactors}
              maxRecommendations={4}
              layout="grid"
              onAction={(rec) => {
                console.log('User clicked:', rec.action);
                if (rec.action === "Enable 2FA") {
                  navigate('/privacy-settings');
                }
              }}
            />
          </div>

        </main>
      </div>
    </div>
  );
};

export default TransactionRiskDetails;
