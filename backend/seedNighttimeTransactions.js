const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/upifrauddb');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Create dummy nighttime transactions
const createNighttimeTransactions = async () => {
  try {
    // Find the user by email
    const user = await User.findOne({ email: '2023.disha.kulkarni@ves.ac.in' });
    
    if (!user) {
      console.log('User not found. Creating user...');
      // Create the user if not exists
      const newUser = new User({
        name: 'Disha Kulkarni',
        email: '2023.disha.kulkarni@ves.ac.in',
        password: 'TestPass123!',
        phone: '+919876543210',
        role: 'user',
        isActive: true
      });
      
      await newUser.save();
      console.log('User created successfully');
    }

    const targetUser = await User.findOne({ email: '2023.disha.kulkarni@ves.ac.in' });
    
    if (!targetUser) {
      console.error('Could not find or create user');
      return;
    }

    console.log(`Found user: ${targetUser.name} (${targetUser.email})`);

    // Create nighttime transactions (12 AM - 5 AM)
    const nighttimeTransactions = [
      {
        userId: targetUser._id,
        transactionId: `TRX-NIGHT-001-${Date.now()}`,
        amount: 15000,
        payee: 'Amazon Shopping',
        payeeUpiId: 'amazon@paytm',
        purpose: 'Online shopping',
        timestamp: new Date('2024-01-15T02:30:00'),
        status: 'completed',
        riskScore: 25,
        riskFactors: ['unusualTime', 'highAmount'],
        isBlocked: false
      },
      {
        userId: targetUser._id,
        transactionId: `TRX-NIGHT-002-${Date.now()}`,
        amount: 8500,
        payee: 'Uber Rides',
        payeeUpiId: 'uber@phonepe',
        purpose: 'Cab booking',
        timestamp: new Date('2024-01-16T04:15:00'),
        status: 'completed',
        riskScore: 20,
        riskFactors: ['unusualTime'],
        isBlocked: false
      },
      {
        userId: targetUser._id,
        transactionId: `TRX-NIGHT-003-${Date.now()}`,
        amount: 32000,
        payee: 'Flipkart',
        payeeUpiId: 'flipkart@paytm',
        purpose: 'Electronics purchase',
        timestamp: new Date('2024-01-17T01:45:00'),
        status: 'completed',
        riskScore: 30,
        riskFactors: ['unusualTime', 'highAmount'],
        isBlocked: false
      },
      {
        userId: targetUser._id,
        transactionId: `TRX-NIGHT-004-${Date.now()}`,
        amount: 4500,
        payee: 'Swiggy Food',
        payeeUpiId: 'swiggy@phonepe',
        purpose: 'Food delivery',
        timestamp: new Date('2024-01-18T03:20:00'),
        status: 'completed',
        riskScore: 15,
        riskFactors: ['unusualTime'],
        isBlocked: false
      },
      {
        userId: targetUser._id,
        transactionId: `TRX-NIGHT-005-${Date.now()}`,
        amount: 18000,
        payee: 'Myntra',
        payeeUpiId: 'myntra@gpay',
        purpose: 'Clothing purchase',
        timestamp: new Date('2024-01-19T00:10:00'),
        status: 'completed',
        riskScore: 25,
        riskFactors: ['unusualTime', 'highAmount'],
        isBlocked: false
      }
    ];

    // Insert transactions
    const insertedTransactions = await Transaction.insertMany(nighttimeTransactions);
    console.log(`✅ Inserted ${insertedTransactions.length} nighttime transactions`);
    
    // Display inserted transactions
    insertedTransactions.forEach(tx => {
      console.log(`- Transaction ${tx.transactionId}: ₹${tx.amount} at ${tx.timestamp.getHours()}:${tx.timestamp.getMinutes()} (${tx.riskScore} risk)`);
    });

    // Add some normal daytime transactions for comparison
    const daytimeTransactions = [
      {
        userId: targetUser._id,
        transactionId: `TRX-DAY-001-${Date.now()}`,
        amount: 2500,
        payee: 'Starbucks Coffee',
        payeeUpiId: 'starbucks@gpay',
        purpose: 'Coffee purchase',
        timestamp: new Date('2024-01-15T10:30:00'),
        status: 'completed',
        riskScore: 0,
        riskFactors: [],
        isBlocked: false
      },
      {
        userId: targetUser._id,
        transactionId: `TRX-DAY-002-${Date.now()}`,
        amount: 12000,
        payee: 'Big Bazaar',
        payeeUpiId: 'bigbazaar@paytm',
        purpose: 'Grocery shopping',
        timestamp: new Date('2024-01-16T14:45:00'),
        status: 'completed',
        riskScore: 0,
        riskFactors: [],
        isBlocked: false
      }
    ];

    const insertedDaytime = await Transaction.insertMany(daytimeTransactions);
    console.log(`✅ Inserted ${insertedDaytime.length} daytime transactions for comparison`);

    // Verify user's transaction patterns
    const userTransactions = await Transaction.find({ userId: targetUser._id })
      .sort({ timestamp: -1 });
    
    console.log(`\n📊 Total transactions for ${targetUser.name}: ${userTransactions.length}`);
    
    const nighttimeCount = userTransactions.filter(tx => tx.hour >= 0 && tx.hour <= 5).length;
    const daytimeCount = userTransactions.filter(tx => tx.hour >= 6 && tx.hour <= 23).length;
    
    console.log(`🌙 Nighttime transactions (0-5 AM): ${nighttimeCount}`);
    console.log(`☀️  Daytime transactions (6 AM-11 PM): ${daytimeCount}`);
    
    // Calculate typical hours
    const hourCounts = {};
    userTransactions.forEach(tx => {
      hourCounts[tx.hour] = (hourCounts[tx.hour] || 0) + 1;
    });
    
    const sortedHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a);
    
    console.log('\n📈 Transaction frequency by hour:');
    sortedHours.slice(0, 10).forEach(([hour, count]) => {
      console.log(`  Hour ${hour}: ${count} transactions`);
    });

  } catch (error) {
    console.error('Error creating transactions:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the script
const run = async () => {
  await connectDB();
  await createNighttimeTransactions();
};

run();