// backend/controllers/transactionController.js
const RiskScoringEngine = require('../services/RiskScoringEngine');
const Transaction = require('../models/Transaction');

const User = require('../models/User'); // Import User model
const { reverseGeocode } = require('../utils/geocoding');

exports.analyzeTransaction = async (req, res) => {
  try {
    const { amount, payeeUpiId, recipient, location, deviceId } = req.body;
    const userId = req.user.id; // From 'protect' middleware

    console.log('[TransactionController] Initial location from request:', location);


    // --- START: Fetch Real User History ---
    const user = await User.findById(userId);
    const userTransactions = await Transaction.find({ userId: userId, status: 'completed' }).sort({ createdAt: -1 });

    let userHistory = {
      transactions: userTransactions,
      count: userTransactions.length,
      averageAmount: 0,
      maxAmount: 0,
      knownPayees: [],
      knownDevices: user?.knownDevices || [],
      commonLocation: null // Simplified for now
    };

    if (userTransactions.length > 0) {
      const totalAmount = userTransactions.reduce((sum, t) => sum + t.amount, 0);
      userHistory.averageAmount = totalAmount / userTransactions.length;
      userHistory.maxAmount = Math.max(...userTransactions.map(t => t.amount));
      userHistory.knownPayees = [...new Set(userTransactions.map(t => t.recipientVPA))];

      // --- START: Calculate Common Location ---
      const locationCounts = userTransactions.reduce((acc, t) => {
        if (t.location && t.location.city) {
          acc[t.location.city] = (acc[t.location.city] || 0) + 1;
        }
        return acc;
      }, {});

      if (Object.keys(locationCounts).length > 0) {
        const commonLocation = Object.keys(locationCounts).reduce((a, b) =>
          locationCounts[a] > locationCounts[b] ? a : b
        );
        userHistory.commonLocation = commonLocation;
        console.log(`[TransactionController] Calculated Common Location: ${commonLocation}`);
      }
      // --- END: Calculate Common Location ---
    }
    console.log(`[TransactionController] Constructed UserHistory for User ${userId}:`, {
        count: userHistory.count,
        averageAmount: userHistory.averageAmount,
        knownPayees: userHistory.knownPayees.length,
        knownDevices: userHistory.knownDevices.length,
        commonLocation: userHistory.commonLocation
    });
    // --- END: Fetch Real User History ---

    // Enrich location data with reverse geocoding
    let enrichedLocation = location;
    if (location && location.latitude && location.longitude) {
      try {
        const geoData = await reverseGeocode(location.latitude, location.longitude);
        enrichedLocation = { ...location, ...geoData };
        console.log('📍 Geocoding successful:', enrichedLocation);
      } catch (error) {
        console.error('Geocoding Error:', error);
        // Proceed with original location data if geocoding fails
      }
    }

    // 1. Run Risk Analysis with enriched location
    const riskAnalysis = await RiskScoringEngine.calculateRiskScore(
      { ...req.body, userId, location: enrichedLocation },
      userHistory
    );

    // 2. Decide status
    let status = 'pending';
    if (riskAnalysis.decision === 'BLOCK') status = 'blocked';
    // If the risk is low, we can consider auto-approving it.
    // For this fix, we will keep it as pending to allow the user to see the analysis.
    // if (riskAnalysis.decision === 'APPROVE') status = 'completed';

    // 3. Save to DB immediately
    const transaction = await Transaction.create({
      userId,
      amount,
      recipientVPA: payeeUpiId,
      recipientName: recipient?.name || 'Unknown',
      riskScore: riskAnalysis.totalScore,
      status: status,
      isBlocked: riskAnalysis.decision === 'BLOCK',
      location: enrichedLocation, // Use the enriched location
      device: deviceId, // Save deviceId with transaction
      timestamp: new Date(),
      riskAnalysis: { // Save the detailed analysis
        ...riskAnalysis
      }
    });

    // Add device to user's known devices if it's new
    if (deviceId && !user.knownDevices.includes(deviceId)) {
        user.knownDevices.push(deviceId);
        await user.save();
    }


    // 4. Send response to frontend
    console.log('[TransactionController] Final response being sent to frontend:', {
      success: true,
      data: {
        ...riskAnalysis,
        transactionId: transaction._id,
        status: status,
        detailedReasons: riskAnalysis.detailedReasons
      }
    });
    res.status(200).json({
      success: true,
      data: {
        ...riskAnalysis,
        transactionId: transaction._id,
        status: status,
        detailedReasons: riskAnalysis.detailedReasons
      }
    });

  } catch (error) {
    console.error('Analysis Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};