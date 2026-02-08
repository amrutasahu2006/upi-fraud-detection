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

const seedVariedRiskTransactions = async () => {
  try {
    console.log('Seeding transactions with varied risk levels...');

    // Get an admin user
    const user = await User.findOne({ role: 'admin' });
    if (!user) {
      console.log('No admin user found. Please seed users first.');
      return;
    }

    // Clear existing blocked transactions
    await Transaction.deleteMany({ status: 'blocked' });
    console.log('Cleared existing blocked transactions');

    const transactions = [
      // High risk cities (multiple transactions to increase count)
      { city: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777, count: 150, riskScore: 85 },
      { city: 'Delhi', state: 'Delhi', lat: 28.7041, lon: 77.1025, count: 120, riskScore: 92 },

      // Medium risk cities
      { city: 'Bangalore', state: 'Karnataka', lat: 12.9716, lon: 77.5946, count: 75, riskScore: 65 },
      { city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707, count: 60, riskScore: 58 },

      // Low risk cities
      { city: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567, count: 25, riskScore: 35 },
      { city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639, count: 20, riskScore: 28 },
      { city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714, count: 15, riskScore: 22 },
      { city: 'Hyderabad', state: 'Telangana', lat: 17.3850, lon: 78.4867, count: 10, riskScore: 18 }
    ];

    const transactionDocs = [];

    transactions.forEach(cityData => {
      for (let i = 0; i < cityData.count; i++) {
        transactionDocs.push({
          userId: user._id,
          transactionId: `TRX-${cityData.city.toUpperCase()}-${i + 1}`,
          amount: Math.floor(Math.random() * 50000) + 1000, // Random amount between 1000-51000
          payee: `Merchant ${i + 1}`,
          payeeUpiId: `merchant${i + 1}@upi`,
          purpose: 'Transaction',
          status: 'blocked',
          riskScore: cityData.riskScore + Math.floor(Math.random() * 10) - 5, // Slight variation
          riskLevel: cityData.riskScore > 70 ? 'HIGH' : cityData.riskScore > 50 ? 'MEDIUM' : 'LOW',
          blockedReason: 'Test data',
          location: {
            latitude: cityData.lat + (Math.random() - 0.5) * 0.1, // Slight variation
            longitude: cityData.lon + (Math.random() - 0.5) * 0.1,
            city: cityData.city,
            state: cityData.state,
            country: 'India'
          },
          timestamp: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) // Random within last 30 days
        });
      }
    });

    const result = await Transaction.insertMany(transactionDocs);
    console.log(`✅ Seeded ${result.length} transactions with varied risk levels`);

    // Verify the aggregation
    const aggregated = await Transaction.aggregate([
      {
        $match: { status: 'blocked', 'location.city': { $exists: true, $ne: null } }
      },
      {
        $group: {
          _id: { city: '$location.city', state: '$location.state', lat: '$location.latitude', lon: '$location.longitude' },
          fraudCount: { $sum: 1 },
          avgRiskScore: { $avg: '$riskScore' }
        }
      },
      {
        $project: {
          city: '$_id.city',
          state: '$_id.state',
          lat: '$_id.lat',
          lon: '$_id.lon',
          fraudCount: 1,
          avgRiskScore: { $round: ['$avgRiskScore', 1] }
        }
      },
      {
        $sort: { fraudCount: -1 }
      }
    ]);

    console.log('\nAggregated fraud data:');
    aggregated.forEach(item => {
      let riskLevel = 'Low';
      if (item.fraudCount > 100 || item.avgRiskScore > 70) {
        riskLevel = 'High';
      } else if (item.fraudCount > 50 || item.avgRiskScore > 50) {
        riskLevel = 'Medium';
      }
      console.log(`${item.city}: Count=${item.fraudCount}, AvgRisk=${item.avgRiskScore}, Level=${riskLevel}`);
    });

  } catch (error) {
    console.error('Error seeding transactions:', error);
  } finally {
    mongoose.connection.close();
  }
};

connectDB().then(seedVariedRiskTransactions);
