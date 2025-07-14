// geocoding.js
const axios = require('axios');
const NodeCache = require('node-cache');
const { admin, db } = require('./firebase-config');

const cache = new NodeCache({ stdTTL: 86400 }); // 24-hour cache

/**
 * Check if we already have cached coordinates in Firestore
 * @param {string} postalCode - The postal code to lookup
 * @returns {Promise<Object|null>} - The cached coordinates or null
 */
async function getPostalCodeFromFirestore(postalCode) {
  try {
    // Get postal code directly by ID (postal code)
    const docRef = db.collection('postal_codes').doc(postalCode.toString());
    const doc = await docRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      return {
        lat: data.location.geopoint.latitude,
        lng: data.location.geopoint.longitude,
        formattedAddress: `${data.city}, ${data.state} ${data.code}`
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting postal code from Firestore:', error);
    return null;
  }
}

/**
 * Geocode a postal code to coordinates
 * @param {string} postalCode - The postal code to geocode
 * @param {string} country - The country code (default: 'US')
 * @returns {Promise<Object>} - The coordinates and formatted address
 */
async function geocodePostalCode(postalCode, country = 'US') {
  const cacheKey = `geocode_${postalCode}_${country}`;
  
  // Check local cache first
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    console.log(`Using cached coordinates for ${postalCode}`);
    return cachedResult;
  }
  
  // Check if we have this postal code in Firestore
  const firestoreResult = await getPostalCodeFromFirestore(postalCode);
  if (firestoreResult) {
    console.log(`Found coordinates for ${postalCode} in Firestore`);
    // Cache the result
    cache.set(cacheKey, firestoreResult);
    return firestoreResult;
  }
  
  // No local or Firestore cache, call Google Maps API
  try {
    const apiKey = "AIzaSyBoQ5dP807JSDdYMjB-XCpGvdbkHfz_ooo";
    if (!apiKey) {
      throw new Error('Google Maps API key is missing.');
    }
    
    console.log(`Geocoding ${postalCode} using Google Maps API`);
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: `${postalCode},${country}`,
        key: apiKey
      }
    });
    
    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      const result = {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: response.data.results[0].formatted_address
      };
      
      // Cache the result
      cache.set(cacheKey, result);
      
      // Also store in Firestore for future use
      try {
        const postalCodeRef = db.collection('postal_codes').doc(postalCode.toString());
        
        // Extract city and state from formatted address
        const addressParts = result.formattedAddress.split(',');
        let city = addressParts[0].trim();
        let state = '';
        
        if (addressParts.length > 1) {
          const stateParts = addressParts[1].trim().split(' ');
          if (stateParts.length > 0) {
            state = stateParts[0].trim();
          }
        }
        
        await postalCodeRef.set({
          code: postalCode.toString(),
          city: city,
          state: state,
          location: {
            coordinates: [result.lng, result.lat],
            geopoint: new admin.firestore.GeoPoint(result.lat, result.lng)
          },
          formattedAddress: result.formattedAddress,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`Stored coordinates for ${postalCode} in Firestore`);
      } catch (firestoreError) {
        console.error('Error storing geocoding results in Firestore:', firestoreError);
        // Continue even if storage fails
      }
      
      return result;
    }
    
    console.log(`No results found for postal code ${postalCode}`);
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Object} coords1 - First coordinates {lat, lng}
 * @param {Object} coords2 - Second coordinates {lat, lng}
 * @returns {number} - Distance in kilometers
 */
function calculateDistance(coords1, coords2) {
  const earthRadius = 6371; // Radius of the Earth in kilometers
  
  // Convert latitude and longitude from degrees to radians
  const lat1 = coords1.lat * Math.PI / 180;
  const lng1 = coords1.lng * Math.PI / 180;
  const lat2 = coords2.lat * Math.PI / 180;
  const lng2 = coords2.lng * Math.PI / 180;
  
  // Haversine formula
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1) * Math.cos(lat2) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = earthRadius * c;
  
  return distance;
}

module.exports = {
  geocodePostalCode,
  calculateDistance
};