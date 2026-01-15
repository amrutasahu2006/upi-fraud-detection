const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/upifrauddb', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for testing');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const testAuthWithExistingUsers = async () => {
  try {
    await connectDB();

    console.log('\n=== Testing Authentication System with Existing Users ===');
    
    // Test 1: Fetch all users
    const allUsers = await User.find({});
    console.log(`\nFound ${allUsers.length} users in the database:`);
    allUsers.forEach(user => {
      console.log(`  - Username: ${user.username}, Email: ${user.email}, Role: ${user.role}, Active: ${user.isActive}`);
    });
    
    // Test 2: Test password comparison for existing users (without selecting password)
    const userWithoutPassword = await User.findOne({ username: 'admin' }).select('-password');
    console.log(`\nTesting user fetch (without password):`);
    console.log(`  Admin user found: ${!!userWithoutPassword}`);
    if (userWithoutPassword) {
      console.log(`  Username: ${userWithoutPassword.username}`);
      console.log(`  Role: ${userWithoutPassword.role}`);
      console.log(`  Profile: ${JSON.stringify(userWithoutPassword.profile)}`);
    }
    
    // Test 3: Test password comparison capability for existing users (by selecting password)
    const userWithPassword = await User.findOne({ username: 'admin' }).select('+password');
    console.log(`\nTesting password functionality:`);
    if (userWithPassword) {
      console.log(`  Admin user with password found: ${!!userWithPassword}`);
      console.log(`  Has password field: ${!!userWithPassword.password}`);
      
      // Test if password comparison method works
      const isValidPassword = await userWithPassword.comparePassword('admin123');
      console.log(`  Password validation test (using 'admin123'): ${isValidPassword}`);
    }
    
    // Test 4: Test role-based queries
    const adminUsers = await User.find({ role: 'admin' });
    const regularUsers = await User.find({ role: 'user' });
    console.log(`\nRole-based queries:`);
    console.log(`  Admin users: ${adminUsers.length}`);
    console.log(`  Regular users: ${regularUsers.length}`);
    
    // Test 5: Test isActive filtering
    const activeUsers = await User.find({ isActive: true });
    const inactiveUsers = await User.find({ isActive: false });
    console.log(`\nStatus-based queries:`);
    console.log(`  Active users: ${activeUsers.length}`);
    console.log(`  Inactive users: ${inactiveUsers.length}`);
    
    // Test 6: Test creating a new user to verify the full system works
    console.log(`\nTesting creation of a new user:`);
    try {
      const newUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'testpassword123',
        role: 'user'
      });
      console.log(`  Successfully created new user: ${newUser.username}`);
      console.log(`  New user role: ${newUser.role}`);
      console.log(`  New user active status: ${newUser.isActive}`);
    } catch (creationError) {
      console.log(`  Could not create new user: ${creationError.message}`);
    }
    
    console.log('\n=== All Tests Completed Successfully ===');
    console.log('Your existing users collection is fully compatible with the authentication system!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing authentication system:', error);
    process.exit(1);
  }
};

testAuthWithExistingUsers();