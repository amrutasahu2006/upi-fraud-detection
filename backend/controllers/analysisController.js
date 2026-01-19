// backend/controllers/analysisController.js
const User = require('../models/User');
const NotificationService = require('../services/NotificationService');

exports.analyzeTransaction = async (req, res) => {
  try {
    const { amount } = req.body;
    
    // Simple Logic for Test
    const riskScore = amount > 10000 ? 50 : 10;
    
    console.log(`📊 Analysis Request Received. Amount: ${amount}, Risk: ${riskScore}`);

    // Trigger Mock SMS if Risk > 30
    if (riskScore > 30) {
      console.log(`🚨 High Risk! Triggering Alert...`);
      // Check if we have user info
      if (req.user && req.user.id) {
          const user = await User.findById(req.user.id);
          if (user) {
             await NotificationService.sendFraudAlert(user, { amount, riskScore });
          }
      }
    }

    res.status(200).json({
      success: true,
      data: { riskScore, shouldWarn: riskScore > 30 }
    });

  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};