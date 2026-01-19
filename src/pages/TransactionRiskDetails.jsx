import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Smartphone, MapPin, UserPlus, BarChart, ChevronRight, ShieldAlert, Calendar, TrendingUp, Activity, Globe, Monitor } from "lucide-react";
import { useTransaction } from "../context/TransactionContext";
import AIRecommendationPanel from "../components/AIRecommendationPanel";

const TransactionRiskDetails = () => {
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
  const displayRiskFactors = riskAnalysis?.riskFactors ?? [];
  const transactionAmount = currentTransaction?.amount ?? 0;
  const transactionId = riskAnalysis?.transactionId ?? currentTransaction?.transactionId ?? "UNKNOWN";

  // Extract detailed analysis data from backend
  const analysis = riskAnalysis?.analysis ?? {};

  // Time analysis - backend uses 'timeAnalysis'
  const timeAnalysis = analysis?.timeAnalysis;
  const hasTimeRisk = displayRiskFactors.includes('unusualTime') || timeAnalysis?.isUnusual;

  // Amount analysis - backend uses 'amountAnalysis'
  const amountAnalysis = analysis?.amountAnalysis;
  const hasAmountRisk = displayRiskFactors.includes('amountAnomaly') || amountAnalysis?.isAnomalous;

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

  // Location details with reverse geocoding simulation - use transaction location first, then context
  const locationData = currentTransaction?.location || effectiveUserLocation;
  const currentLocation = locationData ? {
    latitude: locationData.latitude,
    longitude: locationData.longitude,
    accuracy: locationData.accuracy,
    // In a real app, this would come from reverse geocoding API
    city: locationAnalysis?.currentLocation?.city || "Unknown City",
    state: locationAnalysis?.currentLocation?.state || "Unknown State",
    region: "Unknown Region", // This can be improved with a proper geocoding API
    country: "India"
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

  // Prepare text for Amount Analysis to avoid showing "unknown"
  const amountPatterns = amountRiskDetails?.patterns;
  let amountDetailsText = 'Analyzing transaction patterns...';
  if (amountRiskDetails) {
    if (amountPatterns?.hasEnoughData && typeof amountPatterns?.averageAmount === 'number') {
      const averageAmount = amountPatterns.averageAmount;
      const multiplier = (transactionAmount / averageAmount).toFixed(1);
      amountDetailsText = `This amount is ${multiplier}x higher than your average of ₹${averageAmount.toFixed(0)}.`;
    } else if (amountPatterns && !amountPatterns.hasEnoughData) {
      amountDetailsText = 'First transaction - building transaction history...';
    } else if (amountRiskDetails.reason) {
      amountDetailsText = amountRiskDetails.reason;
    }
  } else if (amountAnalysis?.patterns?.hasEnoughData && typeof amountAnalysis?.patterns?.averageAmount === 'number') {
    // Fallback to direct amountAnalysis data if amountRiskDetails is not available
    const averageAmount = amountAnalysis.patterns.averageAmount;
    const multiplier = (transactionAmount / averageAmount).toFixed(1);
    amountDetailsText = `This amount is ${multiplier}x higher than your average of ₹${averageAmount.toFixed(0)}.`;
  }

  // Prepare text for Recipient Analysis to avoid showing "unknown"
  let recipientDetailsText = 'Analyzing recipient patterns...';
  if (recipientRiskDetails) {
    if (recipientRiskDetails.isNewPayee) {
      recipientDetailsText = 'First-time recipient.';
    } else if (recipientRiskDetails.profile) {
      recipientDetailsText = `Transaction history: ${recipientRiskDetails.profile.transactionCount || 0} previous transactions`;
      if (typeof recipientRiskDetails.profile.averageAmount === 'number') {
        recipientDetailsText += `, average ₹${recipientRiskDetails.profile.averageAmount.toFixed(0)}.`;
      } else {
        recipientDetailsText += '.';
      }
    }
  }

  // Always show all analysis categories with detailed information
  const analysisCategories = [
    // Time Analysis - Always show current timing info
    {
      icon: Clock,
      title: "Transaction Timing Analysis",
      description: `Transaction initiated at ${transactionHour}:00 on ${transactionDayName}, ${transactionDate}. ${hasTimeRisk ? '⚠️ This timing is flagged as unusual compared to your typical patterns.' : '✅ Timing appears normal for your transaction history.'} ${timeRiskDetails ? `Typical hours: ${timeRiskDetails.typicalHours.length > 0 ? timeRiskDetails.typicalHours.map(hour => formatHourTo12Hour(hour)).join(', ') : 'Not established yet'}.` : ''}`,
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
      title: "Amount Pattern Analysis",
      description: `Transaction amount: ₹${transactionAmount.toLocaleString()}. ${hasAmountRisk ? '⚠️ This amount is anomalous.' : '✅ Amount is within normal range.'} ${amountDetailsText}`,
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
      title: "Recipient History Analysis",
      description: `Recipient: "${currentTransaction?.recipient?.name || 'Unknown'}" (${currentTransaction?.recipient?.upi || 'Unknown UPI ID'}). ${hasRecipientRisk ? '⚠️ This recipient is flagged as high-risk.' : '✅ Recipient status verified.'} ${recipientDetailsText}`,
      isRisk: hasRecipientRisk,
      type: 'recipient',
      details: {
        name: currentTransaction?.recipient?.name || 'Unknown',
        upiId: currentTransaction?.recipient?.upi || 'Unknown',
        isNewPayee: recipientRiskDetails?.isNewPayee || false,
        transactionCount: recipientRiskDetails?.profile?.transactionCount || 0,
        averageAmount: recipientRiskDetails?.profile?.averageAmount || 0
      }
    },

    // Device Information - Always show device details
    {
      icon: Monitor,
      title: "Device & Browser Analysis",
      description: `Transaction from ${deviceInfo.deviceType} device using ${deviceInfo.browser} browser on ${deviceInfo.platform} platform. ${hasDeviceRisk ? '⚠️ New or unrecognized device detected.' : '✅ Device fingerprint verified.'} User Agent: ${deviceInfo.userAgent.substring(0, 50)}...`,
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
      title: "Location & GPS Analysis",
      description: `Location: ${locationAnalysis?.currentLocation?.city || 'Unknown City'}, ${locationAnalysis?.currentLocation?.state || 'Unknown State'}. ${locationAnalysis?.reason || (hasLocationRisk ? '⚠️ Location analysis indicates a risk.' : '✅ Location verified.')}`,
      isRisk: hasLocationRisk,
      type: 'location',
      details: locationAnalysis ? {
        city: locationAnalysis.currentLocation?.city,
        state: locationAnalysis.currentLocation?.state,
        latitude: locationAnalysis.currentLocation?.latitude,
        longitude: locationAnalysis.currentLocation?.longitude,
        accuracy: locationAnalysis.currentLocation?.accuracy,
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
          <button onClick={() => navigate('/')} aria-label="Go back" className="text-2xl cursor-pointer">←</button>
          <h1 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">Transaction Risk Details</h1>
        </header>

        {/* Main Content */}
        <main className="p-4 md:p-6 lg:p-8">

          {/* Transaction Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">Transaction Summary</span>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                {transactionDate} at {transactionTimeString}
              </span>
            </div>
            <div className="text-lg font-bold text-blue-900">
              ₹{transactionAmount.toLocaleString()} to {currentTransaction?.recipient?.name || 'Unknown Recipient'}
            </div>
            <div className="text-sm text-blue-700 mt-1">
              UPI ID: {currentTransaction?.recipient?.upi || 'Unknown'}
            </div>
          </div>

          <p className="text-slate-500 mt-2 text-sm sm:text-base">
            Internal Security Analysis for Transaction ID: <span className="font-mono font-medium text-slate-700">#{transactionId}</span>
          </p>

          {/* Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

            {/* LEFT SIDE: Comprehensive Analysis */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  Comprehensive Security Analysis
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
                        {category.isRisk ? '⚠️ Risk' : '✅ Normal'}
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
                            <div>Time: {category.details.currentTime}</div>
                            <div>Day: {category.details.dayOfWeek}</div>
                            {category.details.typicalHours.length > 0 && (
                              <div>Typical Hours: {category.details.typicalHours.map(hour => formatHourTo12Hour(hour)).join(', ')}</div>
                            )}
                          </>
                        )}
                        {category.type === 'amount' && (
                          <>
                            <div>Amount: ₹{category.details.amount.toLocaleString()}</div>
                            {category.details.averageAmount > 0 && (
                              <div>Average: ₹{category.details.averageAmount.toFixed(0)}</div>
                            )}
                            {category.details.averageAmount > 0 && (
                              <div>
                                This is { (category.details.amount / category.details.averageAmount).toFixed(1) }x your average.
                              </div>
                            )}
                            {category.details.deviation !== 0 && (
                              <div>
                                ({category.details.deviation.toFixed(1)} standard deviations from the average)
                              </div>
                            )}
                          </>
                        )}
                        {category.type === 'recipient' && (
                          <>
                            <div>Name: {category.details.name}</div>
                            <div>UPI: {category.details.upiId}</div>
                            <div>Status: {category.details.isNewPayee ? 'New Recipient' : (category.details.transactionCount > 0 ? `${category.details.transactionCount} transactions` : 'No previous transactions with this recipient.')}</div>
                          </>
                        )}
                        {category.type === 'device' && (
                          <>
                            <div>Device: {category.details.deviceType}</div>
                            <div>Browser: {category.details.browser}</div>
                            <div>Platform: {category.details.platform}</div>
                          </>
                        )}
                        {category.type === 'location' && category.details && (
                          <>
                            <div>Location: {category.details.city || 'N/A'}, {category.details.state || 'N/A'}</div>
                            {category.details.latitude && <div>Coordinates: {category.details.latitude.toFixed(4)}, {category.details.longitude.toFixed(4)}</div>}
                            {typeof category.details.nearestDistance === 'number' && <div>Distance from typical: {category.details.nearestDistance.toFixed(1)} km</div>}
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
                    AI Risk Probability
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
          <div className="mt-8 lg:mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Recommended Security Actions
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Based on the detected risk factors, here are AI-powered recommendations to secure your account:
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
