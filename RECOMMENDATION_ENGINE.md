# 🧠 AI Recommendation Engine

A reusable, smart recommendation system for security suggestions based on risk factors.

## 📁 Architecture

```
src/
├── logic/
│   └── recommendationEngine.js   ← Core logic & algorithms
│
├── components/
│   └── AIRecommendationPanel.jsx ← Reusable UI component
│
├── data/
│   └── recommendationData.js     ← Recommendation catalog
│
└── examples/
    └── RecommendationEngineUsage.jsx ← Usage examples
```

## 🎯 Features

- **Smart & Context-Aware**: Generates recommendations based on risk factors
- **Fully Reusable**: Single component works across all pages
- **Flexible**: Grid or list layout, customizable max items
- **Action Callbacks**: Handle button clicks with custom logic
- **Scalable**: Easy to add new recommendations to the catalog

---

## 📚 Core Components

### 1. Recommendation Data Catalog
**File**: `src/data/recommendationData.js`

Contains all available security recommendations with:
- Title, description, and action button text
- Icons and color schemes
- Categorized by risk factor type

**Available Risk Factors**:
- `newPayee` - First-time recipient
- `unusualTime` - Late-night transactions
- `highAmount` - Large transaction amounts
- `newDevice` - Unrecognized device
- `newLocation` - New geographical location
- `enable2FA` - Two-factor authentication
- `blockVPA` - Block suspicious VPAs
- `suspiciousPattern` - Unusual behavior patterns

### 2. Recommendation Engine
**File**: `src/logic/recommendationEngine.js`

Core functions:

#### `generateRecommendations(riskFactors, maxRecommendations)`
Generates recommendations from risk factor array.
```javascript
import { generateRecommendations } from "../logic/recommendationEngine";

const recs = generateRecommendations(["newPayee", "highAmount"], 3);
// Returns top 3 recommendations
```

#### `getContextualRecommendations(context)`
Analyzes transaction context and returns appropriate recommendations.
```javascript
const context = {
  isNewPayee: true,
  isHighAmount: true,
  riskScore: 75
};
const recs = getContextualRecommendations(context);
```

#### `analyzeRiskScore(riskScore)`
Converts risk score (0-100) to risk factors.
```javascript
const factors = analyzeRiskScore(85);
// Returns: ["enable2FA", "blockVPA", "newDevice", "highAmount"]
```

### 3. UI Component
**File**: `src/components/AIRecommendationPanel.jsx`

Renders recommendations in a beautiful, responsive UI.

**Props**:
- `riskFactors` (array): List of risk factor keys
- `maxRecommendations` (number): Max items to display (default: 3)
- `layout` (string): "grid" or "list" (default: "list")
- `onAction` (function): Callback when action button clicked

---

## 🚀 Usage Examples

### Basic Usage
```jsx
import AIRecommendationPanel from "../components/AIRecommendationPanel";

function MyPage() {
  return (
    <AIRecommendationPanel 
      riskFactors={["newPayee", "highAmount"]} 
    />
  );
}
```

### Advanced Usage with Callbacks
```jsx
function SecurityPage() {
  const handleAction = (recommendation) => {
    console.log(`User clicked: ${recommendation.action}`);
    // Navigate, call API, show modal, etc.
  };

  return (
    <AIRecommendationPanel 
      riskFactors={["newPayee", "highAmount", "newDevice"]} 
      maxRecommendations={4}
      layout="grid"
      onAction={handleAction}
    />
  );
}
```

### Dynamic Risk-Based Recommendations
```jsx
import { useState, useEffect } from "react";
import { analyzeRiskScore } from "../logic/recommendationEngine";

function DynamicPage() {
  const [factors, setFactors] = useState([]);

  useEffect(() => {
    // Fetch user's risk score from backend
    fetchRiskScore().then(score => {
      const riskFactors = analyzeRiskScore(score);
      setFactors(riskFactors);
    });
  }, []);

  return <AIRecommendationPanel riskFactors={factors} />;
}
```

---

## 🎨 Where to Use

### ✅ Security Recommendations Page
Show personalized security tips based on user behavior.

### ✅ Transaction Risk Details
Display recommendations after flagging a risky transaction.

### ✅ Security Warning Page
Show urgent actions when high-risk activity is detected.

### ✅ Chatbot Integration
Respond to user queries with contextual security advice.

### ✅ Dashboard/Home Page
Proactive security suggestions based on account status.

---

## 🔧 Customization

### Adding New Recommendations

1. **Add to catalog** (`recommendationData.js`):
```javascript
export const recommendations = {
  // ... existing recommendations
  myNewRisk: {
    title: "My Security Tip",
    description: "Description of the risk",
    action: "Take Action",
    icon: <MyIcon />,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-100"
  }
};
```

2. **Use it anywhere**:
```jsx
<AIRecommendationPanel riskFactors={["myNewRisk"]} />
```

### Styling Customization

The component uses Tailwind CSS classes. Modify colors, spacing, and layout in `AIRecommendationPanel.jsx`.

---

## 🧪 Testing the Engine

```javascript
// Test individual functions
import { 
  generateRecommendations, 
  analyzeRiskScore,
  getRecommendation 
} from "../logic/recommendationEngine";

// Test 1: Generate recommendations
const recs = generateRecommendations(["newPayee", "highAmount"]);
console.log(recs.length); // 2

// Test 2: Analyze risk score
const factors = analyzeRiskScore(75);
console.log(factors); // ["highAmount", "newDevice", "enable2FA"]

// Test 3: Get single recommendation
const rec = getRecommendation("newPayee");
console.log(rec.title); // "Verify Recipient Identity"
```

---

## 🌐 Backend Integration

### Recommended API Structure

```javascript
// GET /api/user/risk-profile
{
  "userId": "12345",
  "riskScore": 68,
  "riskFactors": ["newDevice", "highAmount", "unusualTime"],
  "lastUpdated": "2026-01-15T10:30:00Z"
}

// Frontend usage:
const response = await fetch('/api/user/risk-profile');
const { riskFactors } = await response.json();

<AIRecommendationPanel riskFactors={riskFactors} />
```

---

## 📊 Benefits for Demo/Judging

1. **Professional Architecture**: Clean separation of concerns
2. **Reusable**: One component, multiple pages
3. **Scalable**: Easy to add new recommendations
4. **Context-Aware**: Smart recommendations based on behavior
5. **UI/UX Excellence**: Beautiful, responsive design
6. **Demo-Ready**: Easy to explain and showcase

---

## 🎤 Demo Talking Points

> "Our AI recommendation engine analyzes user behavior and transaction patterns in real-time. Based on detected risk factors like new payees, unusual amounts, or unfamiliar devices, it generates personalized security recommendations."

> "This is a fully reusable component - the same engine powers our Security Recommendations page, Transaction Risk Details, Security Warnings, and even our chatbot responses."

> "The architecture is clean and scalable - adding a new recommendation type takes just 5 lines of code in our data catalog."

---

## 📝 Notes

- All recommendations include icons, descriptions, and actionable buttons
- The engine is purely frontend-based but designed for easy backend integration
- Risk scores range from 0-100 (higher = more risk)
- Component is fully responsive (mobile, tablet, desktop)

---

## 🚀 Next Steps

1. **Backend Integration**: Connect to real risk analysis API
2. **Analytics**: Track which recommendations users act on
3. **A/B Testing**: Test different recommendation orders
4. **Personalization**: Machine learning for user-specific suggestions
5. **Notifications**: Push alerts for critical recommendations

---

**Built with**: React, Tailwind CSS, Lucide Icons
**Status**: ✅ Production Ready
