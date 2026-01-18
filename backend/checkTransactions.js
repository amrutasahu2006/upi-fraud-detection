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

const checkUserTransactions = async () => {
  try {
    // Find Disha's user document
    const user = await User.findOne({ email: '2023.disha.kulkarni@ves.ac.in' });
    
    if (!user) {
      console.log('User not found!');
      return;
    }
    
    console.log(`Found user: ${user.email}`);
    console.log(`Total transactions: ${user.transactions.length}`);
    
    // Show all transaction details
    console.log('\n📋 All Transactions:');
    user.transactions.forEach((tx, index) => {
      const date = new Date(tx.timestamp);
      const now = new Date();
      const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      
      console.log(`${index + 1}. ${tx.transactionId}:`);
      console.log(`   Amount: ₹${tx.amount}`);
      console.log(`   Time: ${date.toISOString()} (${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')})`);
      console.log(`   Days ago: ${daysDiff}`);
      console.log(`   Status: ${tx.status}`);
      console.log(`   Hour: ${tx.hour}`);
      console.log(`   Day of Week: ${tx.dayOfWeek}`);
      console.log('');
    });
    
    // Test the typical hours method step by step
    console.log('🔍 Testing getTypicalHours method step by step:');
    
    const daysBack = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    console.log(`Cutoff date: ${cutoffDate.toISOString()}`);
    console.log(`Current date: ${new Date().toISOString()}`);
    
    const recentTransactions = user.transactions.filter(tx => {
      const txDate = new Date(tx.timestamp);
      const isRecent = txDate >= cutoffDate;
      const isCompleted = tx.status === 'completed';
      console.log(`Transaction ${tx.transactionId}: Date=${txDate.toISOString()}, Recent=${isRecent}, Completed=${isCompleted}`);
      return isRecent && isCompleted;
    });
    
    console.log(`\nFiltered recent transactions: ${recentTransactions.length}`);
    
    if (recentTransactions.length === 0) {
      console.log('No recent completed transactions found!');
    } else {
      // Count hour frequencies
      const hourCounts = {};
      recentTransactions.forEach(tx => {
        const hour = tx.hour !== undefined ? tx.hour : new Date(tx.timestamp).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        console.log(`  Hour ${hour} count: ${hourCounts[hour]}`);
      });
      
      console.log(`Hour counts:`, hourCounts);
      
      // Sort by frequency and get top 80%
      const sortedHours = Object.entries(hourCounts).sort(([,a], [,b]) => b - a);
      console.log(`Sorted hours:`, sortedHours);
      
      const totalTransactions = recentTransactions.length;
      console.log(`Total recent transactions: ${totalTransactions}`);
      
      let cumulativeCount = 0;
      const typicalHours = [];
      
      for (const [hour, count] of sortedHours) {
        cumulativeCount += count;
        typicalHours.push(parseInt(hour));
        console.log(`  Adding hour ${hour}, cumulative: ${cumulativeCount}/${totalTransactions} (${(cumulativeCount/totalTransactions*100).toFixed(1)}%)`);
        
        if ((cumulativeCount / totalTransactions) >= 0.8) {
          console.log(`  Reached 80% threshold, stopping here.`);
          break;
        }
      }
      
      console.log(`\nCalculated typical hours: [${typicalHours.sort((a, b) => a - b).join(', ')}]`);
    }
    
  } catch (error) {
    console.error('Error checking user transactions:', error);
  } finally {
    mongoose.connection.close();
  }
};

connectDB().then(checkUserTransactions);