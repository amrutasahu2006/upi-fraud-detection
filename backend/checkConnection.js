const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

console.log('Environment Variables:');
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Check what database the application would connect to
const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/upifrauddb';
console.log('\nDefault connection string would be:', dbUri);

// Parse the connection string to extract database name
const dbName = dbUri.split('/').pop();
console.log('Database name in connection string:', dbName);

// Test actual connection
const testConnection = async () => {
  try {
    console.log('\nTesting actual connection...');
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    
    // Show actual users
    const users = await mongoose.connection.collection('users').find({}).toArray();
    console.log(`\nFound ${users.length} users in actual database:`);
    users.forEach(user => {
      console.log(`- ${user.username} (${user.role})`);
    });
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Connection error:', error.message);
  }
};

testConnection();