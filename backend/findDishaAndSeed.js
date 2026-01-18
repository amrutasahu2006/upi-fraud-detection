const mongoose = require('mongoose');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
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

const findDishaAndAddTransactions = async () => {
  try {
    // Find users with name containing "disha" (case insensitive)
    const users = await User.find({
      $or: [
        { name: { $regex: 'disha', $options: 'i' } },
        { email: { $regex: 'disha', $options: 'i' } }
      ]
    });
    
    console.log('Found users:');
    users.forEach(user => {
      console.log(`- ID: ${user._id}, Name: ${user.name}, Email: ${user.email}`);
    });
    
    if (users.length === 0) {
      console.log('No user found with "disha" in name or email');
      return;
    }
    
    const dishaUser = users[0]; // Take the first match
    console.log(`\nSelected user: ${dishaUser.name} (${dishaUser.email})`);
    console.log(`User ID: ${dishaUser._id}`);
    
    // Add nighttime transactions
    const nighttimeTransactions = [
      {
        userId: dishaUser._id,
        transactionId: `TRX-NIGHT-${Date.now()}-001`,
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
        userId: dishaUser._id,
        transactionId: `TRX-NIGHT-${Date.now()}-002`,
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
        userId: dishaUser._id,
        transactionId: `TRX-NIGHT-${Date.now()}-003`,
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
    
    const result = await Transaction.insertMany(nighttimeTransactions);
    console.log(`\n✅ Successfully added ${result.length} nighttime transactions:`);
    
    result.forEach(tx => {
      const time = new Date(tx.timestamp);
      console.log(`- ${tx.transactionId}: ₹${tx.amount} at ${time.getHours()}:${time.getMinutes().toString().padStart(2, '0')}`);
    });
    
    // Show user's transaction summary
    const allUserTransactions = await Transaction.find({ userId: dishaUser._id });
    const nightTransactions = allUserTransactions.filter(tx => {
      const hour = new Date(tx.timestamp).getHours();
      return hour >= 0 && hour <= 5;
    });
    
    console.log(`\n📊 ${dishaUser.name}'s transaction summary:`);
    console.log(`- Total transactions: ${allUserTransactions.length}`);
    console.log(`- Nighttime transactions (0-5 AM): ${nightTransactions.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

connectDB().then(findDishaAndAddTransactions);