import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const SyncCircle = () => {
  const syncWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await axios.post('http://localhost:5000/api/circle/sync', {
          accessToken: tokenResponse.access_token
        }, {
          headers: { 
            // Ensure this matches how you store your auth token
            Authorization: `Bearer ${localStorage.getItem('token')}` 
          }
        });

        alert(`Success! Found and linked ${response.data.addedCount} trusted members.`);
      } catch (err) {
        console.error("Sync failed:", err);
        alert("Sync failed. Check console for details.");
      }
    },
    scope: 'https://www.googleapis.com/auth/contacts.readonly',
  });

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-2">UPI Safety Circle</h3>
      <p className="text-sm text-gray-600 mb-4">
        Automatically link with friends from your contacts to share fraud alerts.
      </p>
      <button 
        onClick={() => syncWithGoogle()}
        className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors w-full"
      >
        Sync with Google Contacts
      </button>
    </div>
  );
};

export default SyncCircle;