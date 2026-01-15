const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/upifrauddb', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for migration');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const migrateUsersCollection = async () => {
  try {
    await connectDB();

    // Get the raw collection to work with documents
    const collection = mongoose.connection.collection('users');
    
    // Check for users that might be missing fields required by the schema
    const usersToUpdate = await collection.find({
      $or: [
        { role: { $exists: false } },
        { isActive: { $exists: false } },
        { profile: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`Found ${usersToUpdate.length} users that might need migration`);
    
    for (const user of usersToUpdate) {
      const updateFields = {};
      
      // Set default role if missing
      if (!user.role) {
        updateFields.role = 'user';
        console.log(`Setting default role 'user' for user: ${user.username || user.email}`);
      }
      
      // Set default isActive if missing
      if (user.isActive === undefined || user.isActive === null) {
        updateFields.isActive = true;
        console.log(`Setting default isActive true for user: ${user.username || user.email}`);
      }
      
      // Set default profile if missing
      if (!user.profile) {
        updateFields.profile = {};
        console.log(`Setting default empty profile for user: ${user.username || user.email}`);
      }
      
      // Update the user document
      if (Object.keys(updateFields).length > 0) {
        await collection.updateOne(
          { _id: user._id },
          { $set: updateFields }
        );
      }
    }
    
    // Also check for users with role values that are not in the allowed enum
    const invalidRoleUsers = await collection.find({
      role: { $nin: ['user', 'admin'] }
    }).toArray();
    
    if (invalidRoleUsers.length > 0) {
      console.log(`Found ${invalidRoleUsers.length} users with invalid roles:`);
      for (const user of invalidRoleUsers) {
        console.log(`  - ${user.username || user.email}: '${user.role}' -> 'user'`);
        await collection.updateOne(
          { _id: user._id },
          { $set: { role: 'user' } }
        );
      }
    }
    
    console.log('Migration completed successfully!');
    
    // Final verification - get a sample of updated documents
    const sampleUsers = await collection.find({}).limit(5).toArray();
    console.log('\n=== Sample of Updated Documents ===');
    sampleUsers.forEach((user, index) => {
      console.log(`\n--- User ${index + 1} (${user.username || user.email}) ---`);
      console.log('role:', user.role);
      console.log('isActive:', user.isActive);
      console.log('profile:', user.profile);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error migrating users collection:', error);
    process.exit(1);
  }
};

migrateUsersCollection();