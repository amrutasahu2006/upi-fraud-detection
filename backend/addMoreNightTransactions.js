const mongoose = require('mongoose');
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

const addNighttimeTransactionsToDisha = async () => {
  try {
    // Find Disha's user document
    const user = await User.findOne({ email: '2023.disha.kulkarni@ves.ac.in' });
    
    if (!user) {
      console.log('User not found!');
      return;
    }
    
    console.log(`Found user: ${user.email}`);
    console.log(`Current transaction count: ${user.transactions.length}`);
    
    // Add 5 new nighttime transactions
    const newNighttimeTransactions = [
      {
        transactionId: `TRX-NIGHT-${Date.now()}-001`,
        amount: 22000,
        payee: 'JioMart Grocery',
        payeeUpiId: 'jiomart@paytm',
        purpose: 'Grocery shopping - Midnight',
        timestamp: new Date('2024-01-20T03:15:00'),
        status: 'completed',
        riskScore: 20,
        riskFactors: ['unusualTime', 'highAmount'],
        isBlocked: false
      },
      {
        transactionId: `TRX-NIGHT-${Date.now()}-002`,
        amount: 6500,
        payee: 'Zomato Food',
        payeeUpiId: 'zomato@phonepe',
        purpose: 'Food delivery - Late night',
        timestamp: new Date('2024-01-21T01:30:00'),
        status: 'completed',
        riskScore: 15,
        riskFactors: ['unusualTime'],
        isBlocked: false
      },
      {
        transactionId: `TRX-NIGHT-${Date.now()}-003`,
        amount: 45000,
        payee: 'BookMyShow',
        payeeUpiId: 'bookmyshow@gpay',
        purpose: 'Movie tickets - Weekend night',
        timestamp: new Date('2024-01-22T04:45:00'),
        status: 'completed',
        riskScore: 25,
        riskFactors: ['unusualTime', 'highAmount'],
        isBlocked: false
      },
      {
        transactionId: `TRX-NIGHT-${Date.now()}-004`,
        amount: 12000,
        payee: 'BigBasket',
        payeeUpiId: 'bigbasket@paytm',
        purpose: 'Weekly groceries - Early morning',
        timestamp: new Date('2024-01-23T02:20:00'),
        status: 'completed',
        riskScore: 20,
        riskFactors: ['unusualTime', 'highAmount'],
        isBlocked: false
      },
      {
        transactionId: `TRX-NIGHT-${Date.now()}-005`,
        amount: 9500,
        payee: 'Ola Cabs',
        payeeUpiId: 'ola@phonepe',
        purpose: 'Cab ride home - Late night',
        timestamp: new Date('2024-01-24T05:10:00'),
        status: 'completed',
        riskScore: 15,
        riskFactors: ['unusualTime'],
        isBlocked: false
      }
    ];
    
    // Add the new transactions to the user
    newNighttimeTransactions.forEach(tx => {
      user.addTransaction(tx);
    });
    
    // Save the updated user
    await user.save();
    
    console.log(`\n✅ Successfully added 5 nighttime transactions to ${user.email}`);
    console.log(`New transaction count: ${user.transactions.length}`);
    
    // Show the new transactions
    console.log('\n📋 New nighttime transactions:');
    const newTransactions = user.transactions.slice(-5); // Last 5 transactions
    newTransactions.forEach(tx => {
      const date = new Date(tx.timestamp);
      console.log(`- ${tx.transactionId}: ₹${tx.amount} at ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')} - ${tx.purpose}`);
    });
    
    // Show updated typical hours analysis
    const typicalHours = user.getTypicalHours();
    console.log(`\n📊 Updated typical hours for ${user.email}: [${typicalHours.join(', ')}]`);
    
    // Show updated unusual time analysis
    const testTime = new Date(); // Current time for testing
    testTime.setHours(14, 30, 0, 0); // Set to 2:30 PM (should be unusual)
    const timeAnalysis = user.isUnusualTransactionTime(testTime);
    console.log(`\n🔍 Testing unusual time detection:`);
    console.log(`- Current time (2:30 PM) unusual: ${timeAnalysis.isUnusual}`);
    console.log(`- Confidence: ${(timeAnalysis.confidence * 100).toFixed(1)}%`);
    console.log(`- Reason: ${timeAnalysis.reason}`);
    
  } catch (error) {
    console.error('Error adding transactions:', error);
  } finally {
    mongoose.connection.close();
  }
};

connectDB().then(addNighttimeTransactionsToDisha);