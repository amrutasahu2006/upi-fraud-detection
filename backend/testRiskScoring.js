// Quick test script for Risk Scoring & Decision Engine
// Run with: node testRiskScoring.js

const RiskScoringEngine = require('./services/RiskScoringEngine');
const DecisionEngine = require('./services/DecisionEngine');

console.log('🧪 Testing Risk Scoring & Decision Engine\n');
console.log('='.repeat(50));

// Test scenarios
const scenarios = [
  {
    name: 'Low Risk - Normal Transaction',
    data: {
      amount: 3000,
      recipientVPA: 'known@paytm',
      deviceId: 'known-device-123',
      timestamp: new Date('2026-01-20T14:00:00Z'), // 2 PM
      userId: '123'
    },
    expected: 'APPROVE'
  },
  {
    name: 'Medium Risk - High Amount',
    data: {
      amount: 15000,
      recipientVPA: 'known@paytm',
      deviceId: 'known-device-123',
      timestamp: new Date('2026-01-20T10:00:00Z'),
      userId: '123'
    },
    expected: 'WARN'
  },
  {
    name: 'High Risk - Night + New Payee + New Device',
    data: {
      amount: 25000,
      recipientVPA: 'new@paytm',
      deviceId: 'unknown-device-456',
      timestamp: new Date('2026-01-20T23:30:00Z'), // 11:30 PM
      userId: '123'
    },
    expected: 'DELAY'
  },
  {
    name: 'Critical - Very High Amount + Night',
    data: {
      amount: 75000,
      recipientVPA: 'new@paytm',
      deviceId: 'unknown-device-789',
      timestamp: new Date('2026-01-20T02:00:00Z'), // 2 AM
      userId: '123'
    },
    expected: 'BLOCK'
  },
  {
    name: 'Blacklist Override',
    data: {
      amount: 1000,
      recipientVPA: 'blacklisted@paytm',
      deviceId: 'known-device-123',
      timestamp: new Date('2026-01-20T14:00:00Z'),
      userId: '123'
    },
    expected: 'BLOCK',
    blacklist: [{ vpa: 'blacklisted@paytm', reason: 'Known fraud' }]
  },
  {
    name: 'Whitelist Override',
    data: {
      amount: 50000,
      recipientVPA: 'trusted@paytm',
      deviceId: 'new-device',
      timestamp: new Date('2026-01-20T23:00:00Z'), // 11 PM
      userId: '123'
    },
    expected: 'APPROVE',
    whitelist: [{ vpa: 'trusted@paytm', reason: 'Family member' }]
  }
];

// Mock user history
const mockUserHistory = {
  count: 50,
  averageAmount: 5000,
  maxAmount: 20000,
  commonLocation: null,
  knownPayees: ['known@paytm', 'friend@paytm']
};

// Run tests
async function runTests() {
  let passed = 0;
  let failed = 0;

  for (const scenario of scenarios) {
    console.log(`\n📋 Test: ${scenario.name}`);
    console.log('-'.repeat(50));

    try {
      const blacklist = scenario.blacklist || [];
      const whitelist = scenario.whitelist || [];

      // Calculate risk score
      const riskAnalysis = await RiskScoringEngine.calculateRiskScore(
        scenario.data,
        mockUserHistory,
        blacklist,
        whitelist
      );

      // Make decision
      const decision = DecisionEngine.makeDecision(riskAnalysis);

      console.log(`📊 Risk Score: ${riskAnalysis.totalScore}/100`);
      console.log(`🎯 Risk Level: ${riskAnalysis.riskLevel}`);
      console.log(`🚦 Decision: ${decision.action}`);
      console.log(`📝 Reasons:`);
      riskAnalysis.detailedReasons.forEach(reason => {
        console.log(`   - ${reason}`);
      });

      if (decision.action === scenario.expected) {
        console.log(`✅ PASS - Expected ${scenario.expected}, got ${decision.action}`);
        passed++;
      } else {
        console.log(`❌ FAIL - Expected ${scenario.expected}, got ${decision.action}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));
}

// Run tests
runTests().catch(console.error);
