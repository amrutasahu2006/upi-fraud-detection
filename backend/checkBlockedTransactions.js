const mongoose = require('mongoose');
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

const checkBlockedTransactions = async () => {
  try {
    console.log('Checking blocked transactions...');

    // Count total blocked transactions
    const totalBlocked = await Transaction.countDocuments({ status: 'blocked' });
    console.log(`Total blocked transactions: ${totalBlocked}`);

    // Count blocked transactions with location
    const blockedWithLocation = await Transaction.countDocuments({
      status: 'blocked',
      'location.city': { $exists: true, $ne: null }
    });
    console.log(`Blocked transactions with location: ${blockedWithLocation}`);

    // Get sample blocked transactions with location
    const sampleBlocked = await Transaction.find({
      status: 'blocked',
      'location.city': { $exists: true, $ne: null }
    }).limit(5).select('amount payee location timestamp');

    console.log('\nSample blocked transactions with location:');
    sampleBlocked.forEach((tx, index) => {
      console.log(`${index + 1}. Amount: ₹${tx.amount}, Payee: ${tx.payee}, City: ${tx.location.city}, State: ${tx.location.state}, Lat: ${tx.location.latitude}, Lon: ${tx.location.longitude}`);
    });

    // Check if there are any transactions at all
    const totalTransactions = await Transaction.countDocuments();
    console.log(`\nTotal transactions in DB: ${totalTransactions}`);

  } catch (error) {
    console.error('Error checking blocked transactions:', error);
  } finally {
    mongoose.connection.close();
  }
};

connectDB().then(checkBlockedTransactions);
