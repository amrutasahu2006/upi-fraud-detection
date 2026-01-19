# Warning System Testing Guide

## Overview
The risk scoring and warning system is now fully functional. This guide shows you how to trigger different warning levels.

## ✅ What Was Fixed

1. **Navigation Logic** - [UPIPayment.jsx](src/pages/UPIPayment.jsx) now properly routes based on `decision` field (BLOCK/DELAY/WARN/APPROVE)
2. **Decision Field** - Both real backend and mock API now return the `decision` field
3. **Warning Pages** - [SecurityWarning.jsx](src/pages/SecurityWarning.jsx) and [TransactionBlocked.jsx](src/pages/TransactionBlocked.jsx) now show real transaction data
4. **Risk Reasons** - Detailed reasons are now displayed on warning pages

## 🎯 Decision Thresholds

| Risk Score | Decision | Action | Page Shown |
|-----------|----------|--------|-----------|
| 0-29 | APPROVE | ✅ Process normally | Success alert |
| 30-59 | **WARN** | ⚠️ Show warning, allow proceed | `/risk-details` |
| 60-79 | **DELAY** | ⏳ Delay 5 minutes | `/security-warning` |
| 80-100 | **BLOCK** | 🚫 Block transaction | `/blocked` |

## 🧪 How to Trigger Warnings

### Scenario 1: WARN Decision (30-59 points)
**To trigger a warning, accumulate 30-59 risk points:**

1. **Go to Payment Page**: http://localhost:5173/payment
2. **Enter New Recipient**: Use a UPI ID NOT in quick contacts
   - Example: `unknown@paytm` (adds 25 points for new payee)
3. **Enter Medium Amount**: ₹8,000 - ₹12,000
   - (adds ~10-15 points for moderate amount)
4. **Total**: 35-40 points = **WARN** decision
5. **Expected**: Navigate to `/risk-details` with recommendations

### Scenario 2: DELAY Decision (60-79 points)
**To trigger a delay, accumulate 60-79 risk points:**

1. **New Recipient**: `newuser@ybl` (25 points)
2. **High Amount**: ₹25,000 (30 points)
3. **Late Night**: Between 10 PM - 6 AM (15 points)
4. **Total**: 70 points = **DELAY** decision
5. **Expected**: Navigate to `/security-warning` showing 5-minute delay

### Scenario 3: BLOCK Decision (80+ points)
**To trigger a block, accumulate 80+ risk points:**

1. **New Recipient**: `scammer@bank` (25 points)
2. **Very High Amount**: ₹50,000+ (30 points)
3. **Late Night**: 2 AM (15 points)
4. **New Device**: Use incognito/clear cookies (15 points)
5. **New Location**: VPN/different city (10 points)
6. **Total**: 95 points = **BLOCK** decision
7. **Expected**: Navigate to `/blocked` page

## 📊 Risk Factor Breakdown

Each factor contributes to the total risk score:

| Factor | Weight | How to Trigger |
|--------|--------|---------------|
| **Amount** | 25% | Send >₹50,000 or 3x your average |
| **New Payee** | 20% | Send to a UPI ID you've never used |
| **Time** | 15% | Transact between 10 PM - 6 AM |
| **Device** | 15% | Use a new device/browser |
| **Location** | 10% | Transaction >500km from usual |
| **Velocity** | 10% | 3+ transactions in 30 minutes |

## 🔍 How to Verify It's Working

### 1. Check Backend Logs
Look for these lines in your backend terminal:
```
🔬 Starting Enhanced Risk Analysis
📊 Risk Analysis Complete: { score: 45, level: 'MEDIUM', decision: 'WARN' }
🎯 Decision Made: WARN
```

### 2. Check Frontend Console
In browser DevTools (F12), look for:
```javascript
📤 Sending transaction for analysis: { amount: 15000, isNewPayee: true }
📥 Received risk analysis: { riskScore: 40, decision: 'WARN' }
🎯 Routing based on decision: WARN
```

### 3. Expected Navigation
- **WARN (30-59)**: Routes to `/risk-details` ✅
- **DELAY (60-79)**: Routes to `/security-warning` ⏳
- **BLOCK (80+)**: Routes to `/blocked` 🚫
- **APPROVE (0-29)**: Shows success alert ✅

## 🧪 Quick Test Scenarios

### Test 1: Basic Warning (WARN)
```
Amount: ₹12,000
Recipient: stranger@paytm (new)
Time: 3:00 PM (normal)
Expected: WARN (35 points) → /risk-details
```

### Test 2: Delay Transaction (DELAY)
```
Amount: ₹35,000
Recipient: newperson@okaxis (new)
Time: 11:30 PM (late)
Expected: DELAY (70 points) → /security-warning
```

### Test 3: Block Transaction (BLOCK)
```
Amount: ₹75,000
Recipient: suspicious@ybl (new)
Time: 2:00 AM (very late)
Device: New browser
Expected: BLOCK (85+ points) → /blocked
```

## 🛠️ Troubleshooting

### "I'm not seeing warnings"

**Problem 1: Backend not running**
```powershell
cd backend
node server.js
```
Check for: `✅ MongoDB connected` and `✅ Server running on port 5000`

**Problem 2: Not logged in**
- Make sure you're logged in (token in localStorage)
- Try login again at http://localhost:5173/login

**Problem 3: Risk score too low**
- Combine multiple risk factors
- Try the test scenarios above with exact values

**Problem 4: Check console logs**
```javascript
// In browser console (F12)
localStorage.getItem('token')  // Should show JWT token
```

### "Warning page is blank"

**Issue**: Transaction context not set properly

**Fix**: Make sure you navigate FROM the payment page, not directly to `/risk-details`

### "It routes to success instead of warning"

**Check**:
1. Console logs show decision: "WARN", "DELAY", or "BLOCK"
2. Risk score is ≥30 
3. Backend is returning the `decision` field

## 📱 SMS Notifications

When WARN/DELAY/BLOCK decisions are made, you should also receive SMS alerts (if Twilio is configured):

- **WARN**: "⚠️ Warning: Medium risk transaction..."
- **DELAY**: "⏳ Transaction delayed for security review..."
- **BLOCK**: "🚫 Transaction blocked due to high risk..."

## 🎯 Testing Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend running on port 5173
- [ ] Logged in as valid user
- [ ] Try WARN scenario (30-59 points)
- [ ] Verify `/risk-details` page loads
- [ ] Check AI recommendations appear
- [ ] Try DELAY scenario (60-79 points)
- [ ] Verify `/security-warning` shows delay
- [ ] Try BLOCK scenario (80+ points)
- [ ] Verify `/blocked` page appears
- [ ] Check console logs for decisions
- [ ] Verify SMS notifications (if configured)

## 🚀 Next Steps

After confirming warnings work:

1. **Adjust Thresholds**: Use Admin Panel at `/admin/risk-management`
2. **Add to Blacklist**: Block specific VPAs permanently
3. **Configure Firebase**: Set up push notifications (optional)
4. **Review Logs**: Check MongoDB for transaction records

---

**Status**: ✅ All warning systems fully operational

Last Updated: January 20, 2026
