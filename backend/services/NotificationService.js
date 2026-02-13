// backend/services/NotificationService.js
const admin = require('firebase-admin');
const path = require('path');
// 1. IMPORT TWILIO
const twilio = require('twilio'); 
require('dotenv').config();

class NotificationService {
  constructor() {
    // 2. INITIALIZE TWILIO CLIENT
    try {
        this.twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
        console.log("✅ Twilio Client Initialized");
    } catch (err) {
        console.error("⚠️ Twilio Init Failed:", err.message);
    }

    // Firebase Init (Optional - Push Notifications)
    try {
      if (!admin.apps.length) {
        const serviceAccount = require(path.join(__dirname, '../config/serviceAccountKey.json'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }
      this.messaging = admin.messaging();
    } catch (error) {
      // Firebase not configured - that's OK, SMS notifications via Twilio are working
      // console.log("⚠️ Firebase not initialized");
    }
  }

  // --- REAL SMS FUNCTION ---
  async sendSMS(toPhoneNumber, message) {
    console.log(`🚀 Attempting to send REAL SMS to ${toPhoneNumber}...`);
    
    try {
        // Ensure number has country code (Twilio requires +91 for India)
        let formattedNumber = toPhoneNumber;
        if (!formattedNumber.startsWith('+')) {
            formattedNumber = '+91' + formattedNumber; // Default to India if missing
        }

        const result = await this.twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER, // The US number Twilio gave you
            to: formattedNumber
        });

        console.log("✅ SMS SENT SUCCESSFULLY! SID:", result.sid);
        return result;
    } catch (error) {
        console.error("❌ SMS FAILED:", error.message);
        // Fallback to console log so you still see it in testing
        console.log("fallback msg:", message); 
    }
  }

  // ... keep sendPush and sendFraudAlert as they are ...
  async sendPush(fcmToken, title, body) { /* ... */ }
  
  async sendFraudAlert(user, transactionDetails) {
     const phone = user.phoneNumber || (user.profile && user.profile.phoneNumber);
     // ... rest of your logic ...
     if (phone) await this.sendSMS(phone, `FRAUD ALERT: ₹${transactionDetails.amount} transaction detected!`);
     // ...
  }

  // Inside your NotificationService class in backend/services/NotificationService.js

async sendCircleThreatAlert(fcmToken, reporterName, payeeName) {
  if (!fcmToken) return;

  const message = {
    notification: {
      title: '🛡️ Circle Safety Warning',
      body: `${reporterName} reported a suspicious payee: ${payeeName}`,
    },
    // This 'data' object is what triggers the custom logic in your App.jsx
    data: {
      type: 'CIRCLE_THREAT',
      payeeName: payeeName,
      reporterName: reporterName
    },
    token: fcmToken,
  };

  try {
    const response = await this.messaging.send(message);
    console.log('✅ Circle Threat Push Sent:', response);
  } catch (error) {
    console.error('❌ Failed to send Circle Push:', error);
  }
}
}

module.exports = new NotificationService();