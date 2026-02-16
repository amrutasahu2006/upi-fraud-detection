const https = require('https');

// LocationIQ API Configuration
const LOCATIONIQ_API_KEY = 'pk.6a02e29c15f9f609312c5a0dd222a2b2';

// Fallback coordinate-to-region mapping for India
const INDIA_COORDINATE_REGIONS = [
  { name: 'Mumbai', state: 'Maharashtra', latMin: 18.9, latMax: 19.3, lngMin: 72.7, lngMax: 73.3 },
  { name: 'Delhi', state: 'Delhi', latMin: 28.4, latMax: 28.9, lngMin: 76.8, lngMax: 77.4 },
  { name: 'Bangalore', state: 'Karnataka', latMin: 12.8, latMax: 13.2, lngMin: 77.4, lngMax: 77.8 },
  { name: 'Chennai', state: 'Tamil Nadu', latMin: 12.9, latMax: 13.2, lngMin: 80.1, lngMax: 80.4 },
  { name: 'Kolkata', state: 'West Bengal', latMin: 22.5, latMax: 22.7, lngMin: 88.2, lngMax: 88.4 },
  { name: 'Hyderabad', state: 'Telangana', latMin: 17.3, latMax: 17.5, lngMin: 78.3, lngMax: 78.6 },
  { name: 'Pune', state: 'Maharashtra', latMin: 18.4, latMax: 18.7, lngMin: 73.7, lngMax: 74.0 },
  { name: 'Ahmedabad', state: 'Gujarat', latMin: 22.9, latMax: 23.1, lngMin: 72.5, lngMax: 72.7 },
  { name: 'Jaipur', state: 'Rajasthan', latMin: 26.8, latMax: 27.0, lngMin: 75.7, lngMax: 75.9 },
  { name: 'Surat', state: 'Gujarat', latMin: 21.1, latMax: 21.3, lngMin: 72.7, lngMax: 72.9 },
];

function getIndiaFallback(latitude, longitude) {
  // Check if coordinates are within India bounds
  if (latitude < 6.0 || latitude > 35.5 || longitude < 68.0 || longitude > 97.5) {
    return null; // Not in India
  }

  // Check specific city/region mappings
  for (const region of INDIA_COORDINATE_REGIONS) {
    if (latitude >= region.latMin && latitude <= region.latMax &&
        longitude >= region.lngMin && longitude <= region.lngMax) {
      return { city: region.name, state: region.state, country: 'India' };
    }
  }

  // Default fallback for India (coordinates in India but not matching specific cities)
  return { city: 'Unknown City', state: 'Maharashtra', country: 'India' };
}

function reverseGeocode(latitude, longitude) {
  console.log('****************************************************');
  console.log('** EXECUTING REVERSE GEOCODE WITH LOCATIONIQ API **');
  console.log(`** Coordinates: ${latitude}, ${longitude} **`);
  console.log('****************************************************');

  return new Promise((resolve, reject) => {
    // Corrected URL with address-details parameter
    const url = `https://us1.locationiq.com/v1/reverse.php?key=${LOCATIONIQ_API_KEY}&lat=${latitude}&lon=${longitude}&format=json&address-details=1`;

    https.get(url, (res) => {
      let data = '';

      if (res.statusCode < 200 || res.statusCode >= 300) {
        console.error(`LocationIQ API request failed with status code: ${res.statusCode}`);
        const fallback = getIndiaFallback(latitude, longitude);
        if (fallback) {
          console.log(`[LocationIQ Fallback] Using India fallback: ${fallback.city}, ${fallback.state}`);
          // Ensure fallback provides a consistent structure
          resolve({ formattedAddress: `${fallback.city}, ${fallback.state}`, ...fallback });
        } else {
          resolve({ city: 'Unknown City', state: 'Unknown State', country: 'Unknown Country', formattedAddress: 'Unknown Location' });
        }
        return;
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          if (response.error) {
            console.error(`LocationIQ API error: ${response.error}`);
            const fallback = getIndiaFallback(latitude, longitude);
            if (fallback) {
              console.log(`[LocationIQ Fallback] Using India fallback: ${fallback.city}, ${fallback.state}`);
              resolve({ formattedAddress: `${fallback.city}, ${fallback.state}`, ...fallback });
            } else {
              resolve({ city: 'Unknown City', state: 'Unknown State', country: 'Unknown Country', formattedAddress: 'Unknown Location' });
            }
            return;
          }

          // Use display_name as the primary formatted address if available
          const formattedAddress = response.display_name || 'No address found';
          const address = response.address || {};
          
          const city = address.city || address.town || address.village || address.municipality || address.county || address.state_district || 'Unknown City';
          const state = address.state || 'Unknown State';
          const country = address.country || 'Unknown Country';
          const suburb = address.suburb || '';
          const district = address.state_district || address.county || '';
          const road = address.road || address.street || '';
          const neighbourhood = address.neighbourhood || '';
          const postcode = address.postcode || '';
          const countryCode = address.country_code || '';
          
          console.log(`[LocationIQ] Geocoding success: ${formattedAddress}`);
          resolve({
            formattedAddress,
            city, 
            state, 
            country,
            suburb,
            district,
            road,
            neighbourhood,
            postcode,
            countryCode
          });

        } catch (error) {
          console.error('Error parsing LocationIQ response:', error);
          const fallback = getIndiaFallback(latitude, longitude);
          if (fallback) {
            resolve({ formattedAddress: `${fallback.city}, ${fallback.state}`, ...fallback });
          } else {
            reject(new Error('Failed to parse geocoding response and no fallback available.'));
          }
        }
      });

    }).on('error', (err) => {
      console.error('LocationIQ https request error:', err);
      const fallback = getIndiaFallback(latitude, longitude);
      if (fallback) {
        resolve({ formattedAddress: `${fallback.city}, ${fallback.state}`, ...fallback });
      } else {
        reject(err);
      }
    });
  });
}

module.exports = { reverseGeocode };
