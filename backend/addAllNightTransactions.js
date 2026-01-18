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

const addCompleteNighttimeTransactionHistory = async () => {
  try {
    // Find Disha's user document
    const user = await User.findOne({ email: '2023.disha.kulkarni@ves.ac.in' });
    
    if (!user) {
      console.log('User not found!');
      return;
    }
    
    console.log(`Found user: ${user.email}`);
    console.log(`Current transaction count: ${user.transactions.length}`);
    
    // Clear existing transactions and add a complete history with multiple nighttime transactions
    user.transactions = []; // Reset to start fresh
    
    // Add initial nighttime transactions from previous seeding
    const initialNighttimeTransactions = [
      {
        transactionId: `TRX-NIGHT-INIT-001`,
        amount: 15000,
        payee: 'Amazon Shopping',
        payeeUpiId: 'amazon@paytm',
        purpose: 'Electronics purchase - Late night',
        timestamp: new Date('2024-01-15T02:30:00'),
        status: 'completed',
        riskScore: 25,
        riskFactors: ['unusualTime', 'highAmount'],
        isBlocked: false
      },
      {
        transactionId: `TRX-NIGHT-INIT-002`,
        amount: 8500,
        payee: 'Uber Rides',
        payeeUpiId: 'uber@phonepe',
        purpose: 'Cab booking - Early morning',
        timestamp: new Date('2024-01-16T04:15:00'),
        status: 'completed',
        riskScore: 20,
        riskFactors: ['unusualTime'],
        isBlocked: false
      },
      {
        transactionId: `TRX-NIGHT-INIT-003`,
        amount: 32000,
        payee: 'Flipkart',
        payeeUpiId: 'flipkart@paytm',
        purpose: 'Gadgets purchase - Midnight',
        timestamp: new Date('2024-01-17T01:45:00'),
        status: 'completed',
        riskScore: 30,
        riskFactors: ['unusualTime', 'highAmount'],
        isBlocked: false
      }
    ];
    
    // Add 5 more nighttime transactions as requested
    const additionalNighttimeTransactions = [
      {
        transactionId: `TRX-NIGHT-ADDITIONAL-001`,
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
        transactionId: `TRX-NIGHT-ADDITIONAL-002`,
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
        transactionId: `TRX-NIGHT-ADDITIONAL-003`,
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
        transactionId: `TRX-NIGHT-ADDITIONAL-004`,
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
        transactionId: `TRX-NIGHT-ADDITIONAL-005`,
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
    
    // Combine all transactions
    const allNighttimeTransactions = [...initialNighttimeTransactions, ...additionalNighttimeTransactions];
    
    // Add all transactions to user
    allNighttimeTransactions.forEach(tx => {
      user.addTransaction(tx);
    });
    
    // Save the updated user
    await user.save();
    
    console.log(`\n✅ Successfully added ${allNighttimeTransactions.length} nighttime transactions to ${user.email}`);
    console.log(`New transaction count: ${user.transactions.length}`);
    
    // Show all nighttime transactions
    console.log('\n📋 All nighttime transactions:');
    user.transactions.forEach((tx, index) => {
      const date = new Date(tx.timestamp);
      console.log(`${index + 1}. ${tx.transactionId}: ₹${tx.amount} at ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')} - ${tx.purpose}`);
    });
    
    // Show updated typical hours analysis
    const typicalHours = user.getTypicalHours();
    console.log(`\n📊 Updated typical hours for ${user.email}: [${typicalHours.join(', ')}]`);
    
    // Analyze the distribution
    const hourDistribution = {};
    user.transactions.forEach(tx => {
      const hour = new Date(tx.timestamp).getHours();
      hourDistribution[hour] = (hourDistribution[hour] || 0) + 1;
    });
    
    console.log('\n📈 Transaction distribution by hour:');
    Object.entries(hourDistribution).sort().forEach(([hour, count]) => {
      console.log(`  Hour ${hour}: ${count} transactions`);
    });
    
    // Test unusual time detection
    const testTime = new Date();
    testTime.setHours(14, 30, 0, 0); // 2:30 PM - should be unusual given her nighttime pattern
    const timeAnalysis = user.isUnusualTransactionTime(testTime);
    const timeRiskScore = user.calculateTimeRisk(testTime, 10000);
    
    console.log(`\n🔍 Testing unusual time detection (2:30 PM):`);
    console.log(`- Unusual: ${timeAnalysis.isUnusual}`);
    console.log(`- Risk Score: ${timeRiskScore}`);
    console.log(`- Confidence: ${(timeAnalysis.confidence * 100).toFixed(1)}%`);
    console.log(`- Reason: ${timeAnalysis.reason}`);
    
  } catch (error) {
    console.error('Error adding transactions:', error);
  } finally {
    mongoose.connection.close();
  }
};

connectDB().then(addCompleteNighttimeTransactionHistory);