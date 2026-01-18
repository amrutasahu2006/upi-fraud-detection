const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
require('dotenv').config();

// Connect to MongoDB
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

// Add nighttime transactions for Disha
const addNighttimeTransactions = async () => {
  try {
    // Hardcoded user ID for Disha (you'll need to adjust this)
    const DISHA_USER_ID = '6789abcd1234ef5678ghijkl'; // Replace with actual user ID
    
    console.log('Adding nighttime transactions for Disha...');
    
    const transactions = [
      {
        userId: DISHA_USER_ID,
        transactionId: `TRX-NIGHT-TEST-001`,
        amount: 15000,
        payee: 'Amazon Shopping',
        payeeUpiId: 'amazon@paytm',
        purpose: 'Electronics purchase',
        timestamp: new Date('2024-01-15T02:30:00'),
        status: 'completed',
        riskScore: 25,
        riskFactors: ['unusualTime', 'highAmount']
      },
      {
        userId: DISHA_USER_ID,
        transactionId: `TRX-NIGHT-TEST-002`,
        amount: 8500,
        payee: 'Uber Rides',
        payeeUpiId: 'uber@phonepe',
        purpose: 'Late night cab booking',
        timestamp: new Date('2024-01-16T04:15:00'),
        status: 'completed',
        riskScore: 20,
        riskFactors: ['unusualTime']
      },
      {
        userId: DISHA_USER_ID,
        transactionId: `TRX-NIGHT-TEST-003`,
        amount: 32000,
        payee: 'Flipkart',
        payeeUpiId: 'flipkart@paytm',
        purpose: 'Gadgets purchase',
        timestamp: new Date('2024-01-17T01:45:00'),
        status: 'completed',
        riskScore: 30,
        riskFactors: ['unusualTime', 'highAmount']
      }
    ];

    const result = await Transaction.insertMany(transactions);
    console.log(`✅ Added ${result.length} nighttime transactions`);
    
    result.forEach(tx => {
      console.log(`- ${tx.transactionId}: ₹${tx.amount} at ${tx.timestamp.toISOString()}`);
    });

  } catch (error) {
    console.error('Error adding transactions:', error);
  } finally {
    mongoose.connection.close();
  }
};

connectDB().then(addNighttimeTransactions);