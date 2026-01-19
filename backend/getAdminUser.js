// backend/getAdminUser.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    process.exit(1);
  }
};

const getAdmin = async () => {
  try {
    await connectDB();

    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('❌ No admin user found!');
      process.exit(1);
    }

    console.log('\n🔐 ADMIN USER CREDENTIALS\n');
    console.log('='.repeat(50));
    console.log(`Username: ${admin.username}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Active: ${admin.isActive}`);
    console.log('='.repeat(50));
    console.log('\n📝 Default Password: admin123');
    console.log('🔐 Use these credentials to login at http://localhost:5173/login\n');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

getAdmin();
