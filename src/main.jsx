import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Replace with your actual Client ID from Google Console */}
    <GoogleOAuthProvider clientId="924202770610-frmh71sidn6j7dbeg66betgqam8gc1hf.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)