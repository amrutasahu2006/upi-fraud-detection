require('dotenv').config();
const mongoose = require('mongoose');

const checkAtlasDB = async () => {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb+srv://disha:abcd1234@cluster0.4fhftgq.mongodb.net/UpiFraudDeepBlue';
    console.log('Connecting to:', dbUri);
    
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✓ Connected to MongoDB Atlas');
    console.log('Database name:', mongoose.connection.name);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections in Atlas database:');
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });
    
    // Check for users collection
    const usersExists = collections.some(col => col.name === 'users');
    console.log(`\nUsers collection exists: ${usersExists}`);
    
    if (usersExists) {
      const usersCollection = mongoose.connection.collection('users');
      const count = await usersCollection.countDocuments();
      console.log(`Total users in Atlas: ${count}`);
      
      if (count > 0) {
        const allUsers = await usersCollection.find({}).toArray();
        console.log('\nUsers in Atlas database:');
        allUsers.forEach((user, index) => {
          console.log(`- ${user.username || user.email} (Role: ${user.role || 'N/A'}, Active: ${user.isActive})`);
        });
      } else {
        console.log('No users found in Atlas database.');
      }
    } else {
      console.log('Users collection does not exist in Atlas database.');
    }
    
    mongoose.connection.close();
    console.log('\nConnection closed.');
  } catch (error) {
    console.error('❌ Error connecting to Atlas:', error.message);
    console.error('Make sure your MongoDB Atlas connection string is correct and your IP is whitelisted.');
  }
};

checkAtlasDB();