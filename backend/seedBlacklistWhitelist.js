const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const BlacklistVPA = require('./models/BlacklistVPA');
const BlacklistWhitelist = require('./models/BlacklistWhitelist');

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const blacklistedVPAs = [
  {
    vpa: 'scammer123@paytm',
    risk_level: 'high',
    reason: 'fraud',
    confidence_score: 95,
    report_count: 12,
    status: 'active'
  },
  {
    vpa: 'fakeloan@phonepe',
    risk_level: 'high',
    reason: 'fake_loan',
    confidence_score: 90,
    report_count: 8,
    status: 'active'
  },
  {
    vpa: 'phishking@gpay',
    risk_level: 'medium',
    reason: 'phishing',
    confidence_score: 75,
    report_count: 5,
    status: 'active'
  },
  {
    vpa: 'imposter@upi',
    risk_level: 'high',
    reason: 'impersonation',
    confidence_score: 88,
    report_count: 10,
    status: 'active'
  },
  {
    vpa: 'suspicious99@paytm',
    risk_level: 'medium',
    reason: 'suspicious_activity',
    confidence_score: 65,
    report_count: 3,
    status: 'under_review'
  },
  {
    vpa: 'fraudster@phonepe',
    risk_level: 'high',
    reason: 'fraud',
    confidence_score: 92,
    report_count: 15,
    status: 'active'
  },
  {
    vpa: 'fakecustomercare@gpay',
    risk_level: 'high',
    reason: 'impersonation',
    confidence_score: 98,
    report_count: 20,
    status: 'active'
  }
];

const whitelistedVPAs = [
  {
    identifier: 'amazon@apl',
    type: 'whitelist',
    vpa: 'amazon@apl',
    reason: 'Trusted merchant - Amazon Pay',
    severity: 'low',
    isActive: true,
    metadata: {
      global: true,
      identifier: 'amazon@apl',
      notes: 'Official Amazon payment VPA'
    }
  },
  {
    identifier: 'flipkart@upi',
    type: 'whitelist',
    vpa: 'flipkart@upi',
    reason: 'Trusted merchant - Flipkart',
    severity: 'low',
    isActive: true,
    metadata: {
      global: true,
      identifier: 'flipkart@upi',
      notes: 'Official Flipkart payment VPA'
    }
  },
  {
    identifier: 'swiggy@paytm',
    type: 'whitelist',
    vpa: 'swiggy@paytm',
    reason: 'Trusted merchant - Swiggy',
    severity: 'low',
    isActive: true,
    metadata: {
      global: true,
      identifier: 'swiggy@paytm',
      notes: 'Official Swiggy payment VPA'
    }
  },
  {
    identifier: 'zomato@hdfcbank',
    type: 'whitelist',
    vpa: 'zomato@hdfcbank',
    reason: 'Trusted merchant - Zomato',
    severity: 'low',
    isActive: true,
    metadata: {
      global: true,
      identifier: 'zomato@hdfcbank',
      notes: 'Official Zomato payment VPA'
    }
  },
  {
    identifier: 'makemytrip@icici',
    type: 'whitelist',
    vpa: 'makemytrip@icici',
    reason: 'Trusted merchant - MakeMyTrip',
    severity: 'low',
    isActive: true,
    metadata: {
      global: true,
      identifier: 'makemytrip@icici',
      notes: 'Official MakeMyTrip payment VPA'
    }
  },
  {
    identifier: 'bookmyshow@paytm',
    type: 'whitelist',
    vpa: 'bookmyshow@paytm',
    reason: 'Trusted merchant - BookMyShow',
    severity: 'low',
    isActive: true,
    metadata: {
      global: true,
      identifier: 'bookmyshow@paytm',
      notes: 'Official BookMyShow payment VPA'
    }
  },
  {
    identifier: 'uber@sbi',
    type: 'whitelist',
    vpa: 'uber@sbi',
    reason: 'Trusted merchant - Uber',
    severity: 'low',
    isActive: true,
    metadata: {
      global: true,
      identifier: 'uber@sbi',
      notes: 'Official Uber payment VPA'
    }
  }
];

const seedBlacklistWhitelist = async () => {
  try {
    // Connect to MongoDB (use same connection as server)
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/upifrauddb';
    await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB Connected: ${mongoURI}`);

    // Clear existing data
    await BlacklistVPA.deleteMany({});
    await BlacklistWhitelist.deleteMany({ 'metadata.global': true });
    console.log('🗑️ Cleared existing blacklist/whitelist data');

    // Seed blacklisted VPAs
    const blacklistedResult = await BlacklistVPA.insertMany(blacklistedVPAs);
    console.log(`✅ Added ${blacklistedResult.length} blacklisted VPAs`);

    // Seed whitelisted VPAs
    const whitelistedResult = await BlacklistWhitelist.insertMany(whitelistedVPAs);
    console.log(`✅ Added ${whitelistedResult.length} whitelisted VPAs`);

    console.log('\n📊 Seeded Data Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('BLACKLISTED VPAs:');
    blacklistedResult.forEach(vpa => {
      console.log(`  🚫 ${vpa.vpa} - ${vpa.risk_level} risk (${vpa.reason})`);
    });
    
    console.log('\nWHITELISTED VPAs:');
    whitelistedResult.forEach(vpa => {
      console.log(`  ✅ ${vpa.vpa} - ${vpa.reason}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedBlacklistWhitelist();
