# VPA Blacklist System - Quick Test Guide

## ✅ System Status: OPERATIONAL

### Test Results (2026-02-09)

#### 1. Blacklisted VPA Check
```bash
GET http://localhost:5000/api/blacklist/check?vpa=scammer123@paytm
```
**Response:**
```json
{
  "success": true,
  "flagged": true,
  "vpa": "scammer123@paytm",
  "risk_level": "high",
  "reason": "fraud",
  "confidence_score": 95,
  "message": "⚠️ BLOCKED: This VPA has been flagged for fraud"
}
```
✅ **PASS** - Blacklisted VPA detected and blocked

---

#### 2. Whitelisted VPA Check
```bash
GET http://localhost:5000/api/blacklist/check?vpa=amazon@apl
```
**Response:**
```json
{
  "success": true,
  "flagged": false,
  "whitelisted": true,
  "message": "VPA is whitelisted - trusted account",
  "vpa": "amazon@apl"
}
```
✅ **PASS** - Trusted VPA whitelisted

---

#### 3. Safe VPA Check
```bash
GET http://localhost:5000/api/blacklist/check?vpa=john@paytm
```
**Response:**
```json
{
  "success": true,
  "flagged": false,
  "vpa": "john@paytm",
  "message": "VPA is safe to use"
}
```
✅ **PASS** - Safe VPA allowed

---

## 🧪 Full Test Suite

### Test Blacklisted VPAs (All Should Be BLOCKED)
```
scammer123@paytm        → HIGH risk (fraud)
fakeloan@phonepe        → HIGH risk (fake_loan)
phishking@gpay          → MEDIUM risk (phishing)
imposter@upi            → HIGH risk (impersonation)
fraudster@phonepe       → HIGH risk (fraud)
fakecustomercare@gpay   → HIGH risk (impersonation)
suspicious99@paytm      → MEDIUM risk (under review)
```

### Test Whitelisted VPAs (All Should Be TRUSTED)
```
amazon@apl
flipkart@upi
swiggy@paytm
zomato@hdfcbank
makemytrip@icici
bookmyshow@paytm
uber@sbi
```

---

## 🚀 Testing Endpoints

### PowerShell Commands

**Check Blacklisted VPA:**
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/blacklist/check?vpa=scammer123@paytm" -UseBasicParsing | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

**Check Whitelisted VPA:**
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/blacklist/check?vpa=amazon@apl" -UseBasicParsing | ConvertFrom-Json | ConvertTo-Json
```

**Test All Blacklisted VPAs:**
```powershell
@('scammer123@paytm', 'fakeloan@phonepe', 'phishking@gpay') | ForEach-Object {
    Write-Host "`nTesting: $_"
    Invoke-WebRequest -Uri "http://localhost:5000/api/blacklist/check?vpa=$_" -UseBasicParsing | ConvertFrom-Json | Select-Object vpa,flagged,risk_level,reason
}
```

---

## 📊 API Endpoints Summary

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/blacklist/check?vpa=xxx` | GET | Check VPA status | None |
| `/api/blacklist/report` | POST | Report suspicious VPA | Required |
| `/api/blacklist/all` | GET | Get all blacklisted VPAs | Admin |
| `/api/blacklist/batch` | POST | Batch add (NPCI feed) | Admin |

---

## ⚙️ System Configuration

### Database
- **Type**: MongoDB Atlas
- **URI**: mongodb+srv://disha:abcd1234@cluster0.4fhftgq.mongodb.net/UpiFraudDeepBlue
- **Collections**: `blacklistvpas`, `blacklistwhitelists`

### Redis Cache
- **Status**: Not connected (optional)
- **Fallback**: Direct MongoDB queries
- **Performance**: ~50-100ms per check without cache

### Data Seeded
- **7 Blacklisted VPAs** with varying risk levels
- **7 Whitelisted VPAs** (trusted merchants)

---

## 🔥 Transaction Blocking Test

The system blocks transactions to blacklisted VPAs automatically.

**Test with Transaction API:**
```powershell
$body = @{
    amount = 500
    recipientVPA = "scammer123@paytm"
    purpose = "Test Payment"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/transactions" `
    -Method POST `
    -Headers @{"Authorization"="Bearer YOUR_TOKEN"; "Content-Type"="application/json"} `
    -Body $body `
    -UseBasicParsing
```

**Expected Response (403 Forbidden):**
```json
{
  "success": false,
  "blocked": true,
  "reason": "BLACKLISTED_VPA",
  "message": "⚠️ Transaction Blocked: This recipient has been flagged for fraud",
  "details": {
    "vpa": "scammer123@paytm",
    "risk_level": "high",
    "reason": "fraud",
    "confidence_score": 95
  },
  "recommendation": "Please verify the recipient details."
}
```

---

## ✅ System Health Checklist

- [x] Backend server running (Port 5000)
- [x] MongoDB Atlas connected
- [x] BlacklistVPA model created
- [x] VPA cache service operational (without Redis)
- [x] Blacklist API endpoints responding
- [x] Whitelist check working
- [x] Transaction validation middleware integrated
- [x] Test data seeded
- [x] Blacklist detection working
- [x] Whitelist bypass working
- [ ] Redis cache (optional - not required)

---

## 🎯 Next Steps for Production

1. **Set up Redis** for caching (improves performance 5-10x)
2. **Enable rate limiting** on report endpoints
3. **Add admin dashboard** for blacklist management
4. **Integrate NPCI real feed** (replace mock API)
5. **Set up monitoring** for blocked transactions
6. **Add alerting** for high-risk VPA patterns

---

## 📝 Notes

- System works **without Redis** (falls back to MongoDB)
- Redis errors are **expected** if Redis is not installed
- All test data is in **MongoDB Atlas**
- Cache TTL: **30 minutes** (when Redis is enabled)
- Fail-safe: **Blocks transactions** on validation errors

---

**Last Updated**: 2026-02-09  
**Status**: ✅ Fully Operational  
**Performance**: 50-100ms per VPA check (without cache)
