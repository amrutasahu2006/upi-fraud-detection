const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/upifrauddb', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for inspection');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const inspectUsersCollection = async () => {
  try {
    await connectDB();

    // Get the raw collection to inspect documents
    const collection = mongoose.connection.collection('users');
    
    // Get sample documents
    const sampleUsers = await collection.find({}).limit(5).toArray();
    
    console.log('\n=== Sample User Documents ===');
    if (sampleUsers.length === 0) {
      console.log('No users found in the collection.');
    } else {
      sampleUsers.forEach((user, index) => {
        console.log(`\n--- User ${index + 1} ---`);
        console.log('Keys:', Object.keys(user));
        console.log('_id:', typeof user._id);
        console.log('username:', typeof user.username);
        console.log('email:', typeof user.email);
        console.log('password:', typeof user.password);
        console.log('role:', typeof user.role);
        console.log('isActive:', typeof user.isActive);
        console.log('profile:', typeof user.profile);
        console.log('createdAt:', typeof user.createdAt);
        console.log('updatedAt:', typeof user.updatedAt);
      });
    }

    // Count total users
    const totalCount = await collection.countDocuments();
    console.log(`\nTotal users in collection: ${totalCount}`);

    // Check for specific fields that our schema expects
    console.log('\n=== Field Analysis ===');
    
    // Check if required fields exist in existing documents
    const pipeline = [
      {
        $project: {
          hasUsername: { $ne: ["$username", null] },
          hasEmail: { $ne: ["$email", null] },
          hasPassword: { $ne: ["$password", null] },
          hasRole: { $ne: ["$role", null] },
          hasIsActive: { $ne: ["$isActive", null] },
          hasCreatedAt: { $ne: ["$createdAt", null] },
          hasUpdatedAt: { $ne: ["$updatedAt", null] }
        }
      },
      {
        $group: {
          _id: null,
          totalDocs: { $sum: 1 },
          hasUsernameCount: { $sum: { $cond: ["$hasUsername", 1, 0] } },
          hasEmailCount: { $sum: { $cond: ["$hasEmail", 1, 0] } },
          hasPasswordCount: { $sum: { $cond: ["$hasPassword", 1, 0] } },
          hasRoleCount: { $sum: { $cond: ["$hasRole", 1, 0] } },
          hasIsActiveCount: { $sum: { $cond: ["$hasIsActive", 1, 0] } },
          hasCreatedAtCount: { $sum: { $cond: ["$hasCreatedAt", 1, 0] } },
          hasUpdatedAtCount: { $sum: { $cond: ["$hasUpdatedAt", 1, 0] } }
        }
      }
    ];

    const fieldAnalysis = await collection.aggregate(pipeline).toArray();
    
    if (fieldAnalysis.length > 0) {
      const analysis = fieldAnalysis[0];
      console.log(`Total documents: ${analysis.totalDocs}`);
      console.log(`Has 'username' field: ${analysis.hasUsernameCount}/${analysis.totalDocs}`);
      console.log(`Has 'email' field: ${analysis.hasEmailCount}/${analysis.totalDocs}`);
      console.log(`Has 'password' field: ${analysis.hasPasswordCount}/${analysis.totalDocs}`);
      console.log(`Has 'role' field: ${analysis.hasRoleCount}/${analysis.totalDocs}`);
      console.log(`Has 'isActive' field: ${analysis.hasIsActiveCount}/${analysis.totalDocs}`);
      console.log(`Has 'createdAt' field: ${analysis.hasCreatedAtCount}/${analysis.totalDocs}`);
      console.log(`Has 'updatedAt' field: ${analysis.hasUpdatedAtCount}/${analysis.totalDocs}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error inspecting users collection:', error);
    process.exit(1);
  }
};

inspectUsersCollection();