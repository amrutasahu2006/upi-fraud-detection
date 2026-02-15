const { google } = require('googleapis');
const User = require('../models/User');

// 1. Sync Contacts from Google
exports.syncGoogleContacts = async (req, res) => {
  try {
    const { accessToken } = req.body; // Sent from React frontend
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const people = google.people({ version: 'v1', auth });

    // Fetch up to 100 contacts (names and phone numbers)
    const response = await people.people.connections.list({
      resourceName: 'people/me',
      pageSize: 100,
      personFields: 'names,phoneNumbers',
    });

    const connections = response.data.connections || [];
    
    // Extract clean phone numbers (removing spaces, dashes, etc.)
    const contactPhones = connections
      .flatMap(person => person.phoneNumbers || [])
      .map(phone => phone.value.replace(/\D/g, '').slice(-10)); // Get last 10 digits

    // Find users in our DB who match these phone numbers
    const matchedUsers = await User.find({
      phoneNumber: { $in: contactPhones },
      _id: { $ne: req.user.id } // Don't add yourself to your own circle
    }).select('_id username profile');

    // Link them to the current user's trustedCircle
    const matchedIds = matchedUsers.map(u => u._id);
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { trustedCircle: { $each: matchedIds } }
    });

    res.status(200).json({ 
      message: 'Circle synced successfully', 
      addedCount: matchedUsers.length,
      members: matchedUsers 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const notificationService = require('../services/NotificationService');

exports.reportToCircle = async (req, res) => {
  try {
    const { payeeUpiId, payeeName } = req.body;
    const reporter = await User.findById(req.user.id);

    // 1. Find all users who have the reporter in their circle
    const usersToWarn = await User.find({ trustedCircle: reporter._id });

    const reportEntry = {
      payeeUpiId,
      payeeName,
      reportedBy: reporter._id,
      timestamp: new Date()
    };

    // 2. Loop through users to warn them via Database AND Push Notification
    const updatePromises = usersToWarn.map(async (user) => {
      // Update DB list
      await User.findByIdAndUpdate(user._id, {
        $push: { circleFraudReports: reportEntry }
      });

      // Send Real-time Push Notification if they have a token
      if (user.fcmToken) {
        await notificationService.sendCircleThreatAlert(
          user.fcmToken, 
          reporter.username, 
          payeeName
        );
      }
      
      // Optional: Send SMS via Twilio if it's high priority
      if (user.phoneNumber) {
        await notificationService.sendSMS(
          user.phoneNumber,
          `🛡️ SURAKSHAPAY: Your circle member ${reporter.username} reported ${payeeName} as fraud. We will block this payee for you.`
        );
      }
    });

    await Promise.all(updatePromises);
    res.status(200).json({ success: true, message: "Circle alerted." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};