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

  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const startTransaction = (transactionData) => {
    setCurrentTransaction(transactionData);
    setRiskAnalysis(null);
  };

  const setAnalysisResult = (analysis) => {
    console.log("💾 Storing risk analysis in context:", analysis);
    setRiskAnalysis(analysis);
  };

  const clearTransaction = () => {
    console.log("🧹 Clearing transaction context");
    setCurrentTransaction(null);
    setRiskAnalysis(null);
    // Don't clear userLocation as it's persistent across transactions
    setIsAnalyzing(false);
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
    setIsAnalyzing
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
