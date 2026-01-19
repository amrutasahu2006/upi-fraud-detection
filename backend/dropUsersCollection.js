
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const dropUsersCollection = async () => {
  try {
    // Connect to the database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/upifrauddb', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');

    // Get the users collection
    const usersCollection = mongoose.connection.collection('users');

    // Drop the collection
    await usersCollection.drop();

    console.log('Successfully dropped the "users" collection.');

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');

  } catch (error) {
    if (error.code === 26) {
        console.log('Collection "users" does not exist, so no action was taken.');
    } else {
        console.error('An error occurred:', error);
    }
    process.exit(1);
  }
};

dropUsersCollection();
