// src/services/transactionService.js
import axios from 'axios';

// Make sure this matches your Backend Port (5000)
const API_URL = 'http://localhost:5000/api/transactions';

export const analyzeTransaction = async (transactionData) => {
  try {
    // This sends the data to your real Backend Controller
    const response = await axios.post(`${API_URL}/analyze`, transactionData);
    
    // Return the real data from the server
    return response.data; 
  } catch (error) {
    console.error("Backend API Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Server connection failed"
    };
  }
};