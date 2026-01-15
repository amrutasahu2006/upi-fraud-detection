const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const debugDatabase = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/upifrauddb');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/upifrauddb', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✓ MongoDB Connected');
    console.log('Database host:', mongoose.connection.host);
    console.log('Database name:', mongoose.connection.name);
    
    // List all collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAvailable collections in database:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Check specifically for users collection
    const usersExists = collections.some(col => col.name === 'users');
    console.log(`\nUsers collection exists: ${usersExists}`);
    
    if (usersExists) {
      // Get the users collection
      const usersCollection = mongoose.connection.collection('users');
      
      // Count documents in users collection
      const count = await usersCollection.countDocuments();
      console.log(`Total users in collection: ${count}`);
      
      if (count > 0) {
        console.log('\nDetailed user information:');
        
        // Get all users with full details
        const allUsers = await usersCollection.find({}).toArray();
        allUsers.forEach((user, index) => {
          console.log(`\n--- User ${index + 1} ---`);
          console.log(`ID: ${user._id.toString()}`);
          console.log(`Username: ${user.username || 'N/A'}`);
          console.log(`Email: ${user.email || 'N/A'}`);
          console.log(`Role: ${user.role || 'N/A'}`);
          console.log(`Active: ${user.isActive !== undefined ? user.isActive : 'N/A'}`);
          console.log(`Created: ${user.createdAt ? user.createdAt : 'N/A'}`);
          console.log(`Updated: ${user.updatedAt ? user.updatedAt : 'N/A'}`);
          console.log(`Profile: ${user.profile ? JSON.stringify(user.profile) : 'N/A'}`);
          
          // Don't show password for security reasons
          console.log(`Has Password: ${!!user.password}`);
        });
      } else {
        console.log('No users found in the users collection.');
        console.log('\nPossible reasons:');
        console.log('1. The collection is truly empty');
        console.log('2. You might be connected to a different database');
        console.log('3. The collection name might be different');
      }
    } else {
      console.log('\n❌ Users collection does not exist in this database');
      console.log('\nPossible solutions:');
      console.log('1. Check if your MongoDB server is running');
      console.log('2. Verify the database name in your connection string');
      console.log('3. Make sure you\'re connecting to the right database');
    }
    
    // Check if there are any databases accessible
    const dbList = await mongoose.connection.db.admin().listDatabases();
    console.log('\nAll databases on this MongoDB server:');
    dbList.databases.forEach(db => {
      console.log(`- ${db.name} (collections: ${db.collections || 'unknown'})`);
    });
    
    mongoose.connection.close();
    console.log('\nConnection closed.');
    
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

debugDatabase();