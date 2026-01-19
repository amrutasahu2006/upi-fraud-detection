
// --- CHANGE THESE TWO LINES ---
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');
// ------------------------------

firebase.initializeApp({
  apiKey: "AIzaSyChzb1uH1cr0fSnggOA_JKht9sUJhYoANA",
  authDomain: "fraud-detection-app-8aee9.firebaseapp.com",
  projectId: "fraud-detection-app-8aee9",
  messagingSenderId: "1068956150912",
  appId: "1:1068956150912:web:12654fe54f8ca7be364a65"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' // Make sure you have a logo.png in public or remove this line
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});