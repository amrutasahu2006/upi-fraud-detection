// src/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyChzb1uH1cr0fSnggOA_JKht9sUJhYoANA",
  authDomain: "fraud-detection-app-8aee9.firebaseapp.com",
  projectId: "fraud-detection-app-8aee9",
  storageBucket: "fraud-detection-app-8aee9.firebasestorage.app",
  messagingSenderId: "1068956150912",
  appId: "1:1068956150912:web:12654fe54f8ca7be364a65"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// Function to get Permission & Token
export const requestPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: "BKnKGiaCTKQEXXpSAwyf4yOC6wAlx8YT0pT48ZCpNRDUKnOtJDICjMVMnoaAXk48aJiju7GP-1Uc0j3HLQ-hIvQ"
      });
      console.log("FCM Token:", token);
      return token; // Send this token to your backend (updateUser API)
    } else {
      console.log("Notification permission denied");
    }
  } catch (error) {
    console.error("Error getting permission", error);
  }
};