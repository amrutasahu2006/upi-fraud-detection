const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const User = require('./models/User');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/upifrauddb');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedBlockedTransactions = async () => {
  try {
    console.log('Seeding blocked transactions with location data...');

    // Get an admin user or any user to associate transactions
    const user = await User.findOne({ role: 'admin' });
    if (!user) {
      console.log('No admin user found. Please seed users first.');
      return;
    }

    const blockedTransactions = [
      {
        userId: user._id,
        transactionId: 'TRX-BLOCKED-001',
        amount: 25000,
        payee: 'Fake Merchant',
        payeeUpiId: 'fake@merchant',
        purpose: 'Suspicious transaction',
        status: 'blocked',
        riskScore: 85,
        riskLevel: 'HIGH',
        blockedReason: 'High risk score and unusual amount',
        location: {
          latitude: 19.0760,
          longitude: 72.8777,
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India'
        },
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      },
      {
        userId: user._id,
        transactionId: 'TRX-BLOCKED-002',
        amount: 18000,
        payee: 'Scam Service',
        payeeUpiId: 'scam@upi',
        purpose: 'Potential fraud',
        status: 'blocked',
        riskScore: 92,
        riskLevel: 'CRITICAL',
        blockedReason: 'Critical risk detected',
        location: {
          latitude: 28.7041,
          longitude: 77.1025,
          city: 'Delhi',
          state: 'Delhi',
          country: 'India'
        },
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
      },
      {
        userId: user._id,
        transactionId: 'TRX-BLOCKED-003',
        amount: 12000,
        payee: 'Phishing Attempt',
        payeeUpiId: 'phish@fake',
        purpose: 'Blocked due to risk',
        status: 'blocked',
        riskScore: 78,
        riskLevel: 'HIGH',
        blockedReason: 'Unusual transaction pattern',
        location: {
          latitude: 12.9716,
          longitude: 77.5946,
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India'
        },
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6 days ago
      },
      {
        userId: user._id,
        transactionId: 'TRX-BLOCKED-004',
        amount: 9500,
        payee: 'Suspicious Vendor',
        payeeUpiId: 'vendor@bad',
        purpose: 'High risk transaction',
        status: 'blocked',
        riskScore: 88,
        riskLevel: 'HIGH',
        blockedReason: 'Location and amount mismatch',
        location: {
          latitude: 13.0827,
          longitude: 80.2707,
          city: 'Chennai',
          state: 'Tamil Nadu',
          country: 'India'
        },
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
      },
      {
        userId: user._id,
        transactionId: 'TRX-BLOCKED-005',
        amount: 30000,
        payee: 'Fraudulent Site',
        payeeUpiId: 'fraud@site',
        purpose: 'Blocked transaction',
        status: 'blocked',
        riskScore: 95,
        riskLevel: 'CRITICAL',
        blockedReason: 'Critical fraud indicators',
        location: {
          latitude: 22.5726,
          longitude: 88.3639,
          city: 'Kolkata',
          state: 'West Bengal',
          country: 'India'
        },
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      }
    ];

    const result = await Transaction.insertMany(blockedTransactions);
    console.log(`✅ Seeded ${result.length} blocked transactions with location data`);

    result.forEach(tx => {
      console.log(`- ${tx.transactionId}: ₹${tx.amount} in ${tx.location.city}, ${tx.location.state} (Risk: ${tx.riskScore})`);
    });

  } catch (error) {
    console.error('Error seeding transactions:', error);
  } finally {
    mongoose.connection.close();
  }
};

connectDB().then(seedBlockedTransactions);
