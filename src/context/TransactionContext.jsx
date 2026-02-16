/**
 * Transaction Context - Manages transaction state across the app
 *
 * This provides a centralized way to share transaction data
 * between different pages in the flow.
 */

import { createContext, useContext, useState, useEffect } from 'react';

const TransactionContext = createContext();

export function TransactionProvider({ children }) {
  // Load location from localStorage on mount
  const [userLocation, setUserLocationState] = useState(() => {
    const saved = localStorage.getItem('userLocation');
    return saved ? JSON.parse(saved) : null;
  });

  const setUserLocation = (location) => {
    setUserLocationState(location);
    if (location) {
      localStorage.setItem('userLocation', JSON.stringify(location));
    } else {
      localStorage.removeItem('userLocation');
    }
  };

  const [currentTransaction, setCurrentTransactionState] = useState(() => {
    const saved = sessionStorage.getItem('currentTransaction');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [riskAnalysis, setRiskAnalysisState] = useState(() => {
    const saved = sessionStorage.getItem('riskAnalysis');
    return saved ? JSON.parse(saved) : null;
  });
  
  const setCurrentTransaction = (transaction) => {
    setCurrentTransactionState(transaction);
    if (transaction) {
      sessionStorage.setItem('currentTransaction', JSON.stringify(transaction));
    } else {
      sessionStorage.removeItem('currentTransaction');
    }
  };

  const setRiskAnalysis = (analysis) => {
    setRiskAnalysisState(analysis);
    if (analysis) {
      sessionStorage.setItem('riskAnalysis', JSON.stringify(analysis));
    } else {
      sessionStorage.removeItem('riskAnalysis');
    }
   };

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const startTransaction = (transactionData) => {
    setCurrentTransaction(transactionData);
    setRiskAnalysis(null); // Clear previous analysis
  };

  const updateTransaction = (updatedData) => {
    setCurrentTransaction(prev => {
      const newTransaction = { ...prev, ...updatedData };
      sessionStorage.setItem('currentTransaction', JSON.stringify(newTransaction));
      return newTransaction;
    });
  };

  const setAnalysisResult = (analysis) => {
    console.log("💾 Storing risk analysis in context:", analysis);
    setRiskAnalysis(analysis);
    
    // Also update the transaction with the latest ID from the analysis
    if (analysis && analysis.transactionId) {
      updateTransaction({ transactionId: analysis.transactionId });
    }
  };

  const clearTransaction = () => {
    console.log("🧹 Clearing transaction context");
    setCurrentTransaction(null);
    setRiskAnalysis(null);
    setIsAnalyzing(false);
    
    // Clear from session storage as well
    sessionStorage.removeItem('currentTransaction');
    sessionStorage.removeItem('riskAnalysis');
  };

  const value = {
    currentTransaction,
    riskAnalysis,
    isAnalyzing,
    userLocation,
    startTransaction,
    setAnalysisResult,
    setUserLocation,
    clearTransaction,
    setIsAnalyzing,
    updateTransaction,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransaction() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransaction must be used within TransactionProvider');
  }
  return context;
}
