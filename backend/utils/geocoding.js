
const https = require('https');

// PLEASE NOTE: You need to sign up for a free account at https://opencagedata.com
// to get an API key and replace 'YOUR_OPENCAGE_API_KEY' below.
const API_KEY = 'eccc3e66d19c44bc82e83596d57d697a';

function reverseGeocode(latitude, longitude) {
  return new Promise((resolve, reject) => {
    // If the API key is the placeholder, warn the user and return Unknown.
    if (API_KEY === 'YOUR_OPENCAGE_API_KEY') {
      console.warn('OpenCage API key is not set. Real-time geocoding is disabled.');
      return resolve({ city: 'Unknown City', state: 'Unknown State', country: 'Unknown Country' });
    }

    const url = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${API_KEY}&language=en&pretty=1`;

    https.get(url, (res) => {
      let data = '';

      // Handle non-200 status codes
      if (res.statusCode < 200 || res.statusCode >= 300) {
        console.error(`OpenCage API request failed with status code: ${res.statusCode}`);
        return resolve({ city: 'Unknown City', state: 'Unknown State', country: 'Unknown Country' });
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          // Check for API-level errors in the response body
          if (response.status && response.status.code !== 200) {
             console.error(`OpenCage API Error: ${response.status.message}`);
             return resolve({ city: 'Unknown City', state: 'Unknown State', country: 'Unknown Country' });
          }

          if (response.results && response.results.length > 0) {
            const components = response.results[0].components;
            const city = components.city || components.town || components.village || 'Unknown City';
            const state = components.state || 'Unknown State';
            const country = components.country || 'Unknown Country';
            console.log(`Geocoding success: ${city}, ${state}`);
            resolve({ city, state, country });
          } else {
            console.warn('Geocoding returned no results for the given coordinates.');
            resolve({ city: 'Unknown City', state: 'Unknown State', country: 'Unknown Country' });
          }
        } catch (error) {
          console.error('Error parsing geocoding response:', error);
          reject(error);
        }
      });

    }).on('error', (err) => {
      console.error('Geocoding https request error:', err);
      reject(err);
    });
  });
}

module.exports = { reverseGeocode };
