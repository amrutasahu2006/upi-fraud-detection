# 🧪 Testing Guide - Risk Probability Changes

## How to Test Dynamic Risk Scoring

### Test Scenario 1: Low Risk Transaction (Score: ~15-25%)
1. Go to Payment page: `http://localhost:5174/payment`
2. **Amount**: `500` (low amount)
3. **UPI ID**: `rahul@okaxis` (quick contact - known payee)
4. Click "Send"
5. **Expected**: Success alert, LOW risk

### Test Scenario 2: Medium Risk Transaction (Score: ~40-55%)
1. Go to Payment page
2. **Amount**: `12000` (high amount)
3. **UPI ID**: `priya@okicici` (quick contact - known payee)
4. Click "Send"
5. **Expected**: Navigate to Risk Details, MEDIUM risk (yellow bar)

### Test Scenario 3: High Risk Transaction (Score: ~80-95%)
1. Go to Payment page
2. **Amount**: `25000` (very high amount)
3. **UPI ID**: `scammer@paytm` (NOT in quick contacts - new payee)
4. Click "Send"
5. **Expected**: Navigate to Blocked or Risk Details, HIGH risk (red bar)

### Test Scenario 4: Late Night High Risk (Score: ~95+%)
1. **Change your system time** to after 10 PM or before 6 AM
2. Go to Payment page
3. **Amount**: `30000`
4. **UPI ID**: `unknown@bank` (new payee)
5. Click "Send"
6. **Expected**: Very HIGH risk with unusual time factor

---

## 🔍 How to Debug

### Check Browser Console
After clicking "Send", you should see:
```
📤 Sending transaction for analysis: { amount: 25000, isNewPayee: true, ... }
📥 Received risk analysis: { riskScore: 80, riskLevel: "HIGH", ... }
✅ Risk analysis stored in context: { riskScore: 80, ... }
```

On Risk Details page:
```
🔍 Risk Analysis Data: { riskScore: 80, riskLevel: "HIGH", ... }
💳 Transaction Data: { amount: 25000, ... }
```

### Verify Risk Calculation Logic

The risk score is calculated as:
- **New Payee**: +25 points
- **High Amount (>₹10,000)**: +30 points
- **New Device**: +25 points
- **Unusual Time**: +15 points
- **New Location**: +15 points

**Examples**:
- ₹500 to known contact = 0 points (LOW)
- ₹12,000 to known contact = 30 points (MEDIUM)
- ₹25,000 to new payee = 25 + 30 = 55 points (MEDIUM)
- ₹25,000 to new payee at night = 25 + 30 + 15 = 70+ points (HIGH)

---

## Quick Contacts (Known Payees)
These UPI IDs will be recognized as known contacts:
- `rahul@okaxis`
- `priya@okicici`
- `amit@oksbi`

Any other UPI ID will be considered a **new payee** (+25 risk points).

---

## ⚠️ Common Issues

### Issue 1: Risk score always shows 75%
**Cause**: Context data not being passed correctly
**Fix**: Check browser console for the debug logs

### Issue 2: Always navigates to same page
**Cause**: Risk level thresholds
**Fix**: Verify the amount and payee combination

### Issue 3: Page shows default values
**Cause**: Navigating directly to /risk-details without transaction
**Fix**: Always start from /payment page

---

## 🎯 Expected Behavior by Amount

| Amount | Known Payee | New Payee | Risk Level |
|--------|-------------|-----------|------------|
| ₹500   | LOW (0%)    | LOW (25%) | GREEN |
| ₹5,000 | MEDIUM (30%) | MEDIUM (55%) | YELLOW |
| ₹15,000 | MEDIUM (30%) | MEDIUM (55%) | YELLOW |
| ₹25,000 | MEDIUM (30%) | HIGH (55%+) | YELLOW/RED |
| ₹30,000 | MEDIUM (30%) | HIGH (55%+) | RED |

Add unusual time (+15%) or new device (+25%) for higher scores.

---

## 🔧 Manual Test in Browser Console

You can manually test the risk analysis:

```javascript
// Open browser console on any page
const testData = {
  amount: 25000,
  isNewPayee: true,
  isNewDevice: true,
  isUnusualTime: false,
  isNewLocation: false
};

// This should show risk calculation
console.log("Expected risk:", 25 + 30 + 25, "= 80 points");
```

---

**Next Steps**: Try each scenario and check the console logs to verify the risk score changes correctly!
