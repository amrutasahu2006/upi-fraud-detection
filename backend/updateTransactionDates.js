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

const updateTransactionDates = async () => {
  try {
    // Find Disha's user document
    const user = await User.findOne({ email: '2023.disha.kulkarni@ves.ac.in' });
    
    if (!user) {
      console.log('User not found!');
      return;
    }
    
    console.log(`Found user: ${user.email}`);
    console.log(`Total transactions: ${user.transactions.length}`);
    
    // Update all transaction dates to be within the last 30 days (in 2026)
    const baseDate = new Date('2026-01-01'); // Start of 2026
    
    user.transactions.forEach((tx, index) => {
      // Set each transaction to a different day in January 2026
      const transactionDate = new Date(baseDate);
      transactionDate.setDate(baseDate.getDate() + index); // Add index days
      
      // Set specific nighttime hours (0-5 AM) for each transaction
      const nightHours = [1, 2, 3, 4, 5, 1, 2, 4]; // Different nighttime hours
      transactionDate.setHours(nightHours[index], 30, 0, 0); // Set to specific night hour + 30 mins
      
      // Update the transaction timestamp and derived fields
      tx.timestamp = transactionDate;
      tx.hour = transactionDate.getHours();
      tx.dayOfWeek = transactionDate.getDay();
      
      console.log(`Updated transaction ${tx.transactionId}: ${transactionDate.toISOString()} (Hour: ${tx.hour}, Day: ${tx.dayOfWeek})`);
    });
    
    // Save the updated user
    await user.save();
    
    console.log(`\n✅ Successfully updated all transaction dates for ${user.email}`);
    
    // Verify the typical hours calculation now works
    const typicalHours = user.getTypicalHours();
    console.log(`\n📊 Updated typical hours for ${user.email}: [${typicalHours.join(', ')}]`);
    
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
    console.log(`- Typical Hours: [${timeAnalysis.typicalHours.join(', ')}]`);
    
  } catch (error) {
    console.error('Error updating transaction dates:', error);
  } finally {
    mongoose.connection.close();
  }
};

connectDB().then(updateTransactionDates);