/**
 * Transaction Context - Manages transaction state across the app
 * 
 * This provides a centralized way to share transaction data
 * between different pages in the flow.
 */

import { createContext, useContext, useState } from 'react';

const TransactionContext = createContext();

export function TransactionProvider({ children }) {
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
    setCurrentTransaction(null);
    setRiskAnalysis(null);
  };

  const value = {
    currentTransaction,
    riskAnalysis,
    isAnalyzing,
    startTransaction,
    setAnalysisResult,
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
