# 🔌 Integration Guide: Using the Recommendation Engine Across Pages

## Quick Start Checklist

- ✅ **Recommendation Catalog** created at `src/data/recommendationData.js`
- ✅ **Engine Logic** created at `src/logic/recommendationEngine.js`
- ✅ **UI Component** created at `src/components/AIRecommendationPanel.jsx`
- ✅ **Security Recommendations Page** updated to use the engine
- ✅ **Documentation** available in `RECOMMENDATION_ENGINE.md`
- ✅ **Usage Examples** created at `src/examples/RecommendationEngineUsage.jsx`

---

## 🎯 How to Integrate in Other Pages

### 1️⃣ Security Warning Page
**File**: `src/pages/SecurityWarning.jsx`

Add after the warning section:

```jsx
import AIRecommendationPanel from "../components/AIRecommendationPanel";

// Inside SecurityWarning component, add:
<div className="mt-6">
  <h3 className="font-bold text-lg mb-3">Immediate Actions Required</h3>
  <AIRecommendationPanel 
    riskFactors={["blockVPA", "enable2FA", "reviewDevices"]} 
    maxRecommendations={3}
    layout="list"
  />
</div>
```

### 2️⃣ Transaction Risk Details Page
**File**: `src/pages/TransactionRiskDetails.jsx`

Add at the end of the main content:

```jsx
import AIRecommendationPanel from "../components/AIRecommendationPanel";
import { getContextualRecommendations } from "../logic/recommendationEngine";

// Analyze the risk factors from the transaction
const transactionContext = {
  isNewPayee: true,
  isHighAmount: true,
  isUnusualTime: true,
  isNewDevice: true,
  riskScore: 78
};

// Inside component:
<div className="mt-8">
  <h2 className="text-xl font-bold mb-4">Recommended Security Actions</h2>
  <AIRecommendationPanel 
    riskFactors={["newPayee", "highAmount", "unusualTime", "newDevice"]} 
    maxRecommendations={4}
    layout="grid"
  />
</div>
```

### 3️⃣ Security Chatbot
**File**: `src/pages/SecurityChatbot.jsx`

Integrate into chat responses:

```jsx
import { generateRecommendations, analyzeRiskScore } from "../logic/recommendationEngine";

// When user asks about security:
const handleSecurityQuery = (userMessage) => {
  if (userMessage.toLowerCase().includes("safe") || 
      userMessage.toLowerCase().includes("secure")) {
    
    const factors = analyzeRiskScore(getUserRiskScore());
    const recommendations = generateRecommendations(factors, 3);
    
    // Format as chat response
    return {
      type: "bot",
      content: "Here are personalized security tips for you:",
      recommendations: recommendations.map(rec => ({
        title: rec.title,
        description: rec.description,
        action: rec.action
      }))
    };
  }
};

// Render in chat:
{message.recommendations && (
  <div className="mt-3 space-y-2">
    {message.recommendations.map((rec, i) => (
      <div key={i} className="bg-blue-50 rounded-lg p-3">
        <p className="font-semibold text-sm">{rec.title}</p>
        <p className="text-xs text-gray-600">{rec.description}</p>
        <button className="text-blue-600 text-xs mt-1">
          {rec.action} →
        </button>
      </div>
    ))}
  </div>
)}
```

### 4️⃣ UPI Payment Page (Proactive)
**File**: `src/pages/UPIPayment.jsx`

Show recommendations before high-risk payment:

```jsx
import { useState } from "react";
import AIRecommendationPanel from "../components/AIRecommendationPanel";

const [showRiskWarning, setShowRiskWarning] = useState(false);

// When amount is high or payee is new:
const handlePaymentSubmit = () => {
  const isHighRisk = amount > 10000 || isNewRecipient;
  
  if (isHighRisk) {
    setShowRiskWarning(true);
  } else {
    processPayment();
  }
};

// Render modal:
{showRiskWarning && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
    <div className="bg-white rounded-xl p-6 max-w-md">
      <h3 className="font-bold text-lg mb-2">Review Before Sending</h3>
      <p className="text-sm text-gray-600 mb-4">
        This transaction has some risk factors. Review these tips:
      </p>
      
      <AIRecommendationPanel 
        riskFactors={["newPayee", "highAmount"]} 
        maxRecommendations={2}
        layout="list"
      />
      
      <button 
        onClick={processPayment}
        className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg"
      >
        I Understand, Proceed
      </button>
    </div>
  </div>
)}
```

### 5️⃣ Fraud Analytics Dashboard
**File**: `src/pages/FraudAnalytics.jsx`

Add personalized tips section:

```jsx
import AIRecommendationPanel from "../components/AIRecommendationPanel";

<div className="mt-8">
  <h2 className="text-xl font-bold mb-4">Personalized Security Tips</h2>
  <p className="text-gray-600 text-sm mb-4">
    Based on your recent activity and risk profile
  </p>
  
  <AIRecommendationPanel 
    riskFactors={userRiskFactors} 
    maxRecommendations={3}
    layout="list"
  />
</div>
```

---

## 🎨 Layout Options

### Grid Layout (2 columns on desktop)
```jsx
<AIRecommendationPanel 
  riskFactors={factors} 
  layout="grid"
/>
```

### List Layout (stacked vertically)
```jsx
<AIRecommendationPanel 
  riskFactors={factors} 
  layout="list"
/>
```

---

## 🔄 Dynamic Risk Factor Detection

### Method 1: From Transaction Analysis
```jsx
const detectRiskFactors = (transaction) => {
  const factors = [];
  
  if (transaction.isFirstTime) factors.push("newPayee");
  if (transaction.amount > 5000) factors.push("highAmount");
  if (transaction.time < 6 || transaction.time > 23) factors.push("unusualTime");
  if (!transaction.isKnownDevice) factors.push("newDevice");
  if (transaction.location !== user.homeLocation) factors.push("newLocation");
  
  return factors;
};

const riskFactors = detectRiskFactors(currentTransaction);
<AIRecommendationPanel riskFactors={riskFactors} />
```

### Method 2: From Risk Score
```jsx
import { analyzeRiskScore } from "../logic/recommendationEngine";

const riskScore = calculateRiskScore(); // 0-100
const factors = analyzeRiskScore(riskScore);

<AIRecommendationPanel riskFactors={factors} />
```

### Method 3: From Backend API
```jsx
useEffect(() => {
  fetch('/api/user/risk-profile')
    .then(res => res.json())
    .then(data => {
      setRiskFactors(data.riskFactors);
    });
}, []);

<AIRecommendationPanel riskFactors={riskFactors} />
```

---

## 🎯 Action Handling Examples

### Navigate to Settings
```jsx
const handleAction = (rec) => {
  if (rec.action === "Enable 2FA") {
    navigate('/privacy-settings');
  } else if (rec.action === "Set Limits") {
    navigate('/transaction-limits');
  }
};

<AIRecommendationPanel onAction={handleAction} />
```

### Show Modal
```jsx
const handleAction = (rec) => {
  setModalContent({
    title: rec.title,
    message: `Would you like to ${rec.action.toLowerCase()}?`
  });
  setShowModal(true);
};
```

### Track Analytics
```jsx
const handleAction = (rec) => {
  // Send to analytics
  trackEvent('recommendation_action_clicked', {
    recommendation: rec.title,
    action: rec.action,
    timestamp: new Date()
  });
  
  // Execute action
  executeSecurityAction(rec);
};
```

---

## 📱 Responsive Behavior

The component is fully responsive:
- **Mobile**: Single column, stacked cards
- **Tablet**: Grid layout (if specified) shows 2 columns
- **Desktop**: Full-width grid with proper spacing

---

## 🚀 Production Checklist

- [ ] Test on all target pages
- [ ] Verify responsive design on mobile/tablet/desktop
- [ ] Add error boundaries for component
- [ ] Connect to backend risk analysis API
- [ ] Add loading states while fetching recommendations
- [ ] Implement action handlers for each recommendation
- [ ] Add analytics tracking for user interactions
- [ ] Test with different risk factor combinations
- [ ] Verify accessibility (keyboard navigation, screen readers)
- [ ] Add unit tests for recommendation engine functions

---

## 🎓 For Your Demo

**Talking Points**:
1. "We built a centralized recommendation engine that powers suggestions across the entire app"
2. "Same component, different contexts - from chatbot to warning pages"
3. "Smart algorithms analyze risk factors and generate contextual recommendations"
4. "Fully scalable - adding new security tips takes minutes"
5. "Clean architecture makes the codebase maintainable and professional"

**Live Demo Flow**:
1. Show Security Recommendations page (already integrated)
2. Navigate to Transaction Risk Details (show integration)
3. Open Chatbot (show AI responses)
4. Demonstrate how it adapts to different risk levels
5. Show the code architecture (clean separation)

---

**Status**: ✅ Ready to integrate across all pages
**Next Step**: Choose which pages to integrate first based on demo priority
