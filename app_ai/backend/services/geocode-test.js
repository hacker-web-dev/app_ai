// geocode-test.js
const axios = require('axios');

// ======= Mock Data (from your CSV files) =======
const postalCodes = [
  {"code": "19103", "city": "Philadelphia", "state": "PA", "lat": 39.9526, "lng": -75.1652},
  {"code": "19106", "city": "Philadelphia", "state": "PA", "lat": 39.9496, "lng": -75.1467},  
  {"code": "19107", "city": "Philadelphia", "state": "PA", "lat": 39.9483, "lng": -75.1594},
  {"code": "19102", "city": "Philadelphia", "state": "PA", "lat": 39.9507, "lng": -75.1628},
  {"code": "19146", "city": "Philadelphia", "state": "PA", "lat": 39.9432, "lng": -75.1855}
];

const hospitals = [
  {"id": "hospital1", "name": "General Hospital", "postal_code": postalCodes[0]},
  {"id": "hospital2", "name": "Medical Center", "postal_code": postalCodes[1]},
  {"id": "hospital3", "name": "Community Hospital", "postal_code": postalCodes[2]},
  {"id": "hospital4", "name": "Regional Medical Center", "postal_code": postalCodes[3]},
  {"id": "hospital5", "name": "University Hospital", "postal_code": postalCodes[4]}
];

// ======= Geocoding Function =======
async function geocodePostalCode(postalCode, country = 'US') {
  try {
    const apiKey = "AIzaSyBoQ5dP807JSDdYMjB-XCpGvdbkHfz_ooo"; // Using the same key from your code
    
    console.log(`Geocoding postal code: ${postalCode}`);
    
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: `${postalCode},${country}`,
        key: apiKey
      }
    });
    
    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: response.data.results[0].formatted_address
      };
    }
    
    console.log("No results found for this postal code");
    return null;
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return null;
  }
}

// ======= Distance Calculation Function =======
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

// ======= Find Nearby Hospitals Function =======
function findNearbyHospitals(userCoords, maxDistance = 15) {
  console.log(`\nFinding hospitals within ${maxDistance}km of coordinates:`, userCoords);
  
  const nearbyHospitals = hospitals.filter(hospital => {
    const hospitalCoords = {
      lat: hospital.postal_code.lat,
      lng: hospital.postal_code.lng
    };
    
    const distance = calculateDistance(userCoords, hospitalCoords);
    hospital.distance = distance;
    hospital.distanceKm = distance.toFixed(2);
    
    return distance <= maxDistance;
  });
  
  // Sort by distance
  nearbyHospitals.sort((a, b) => a.distance - b.distance);
  
  return nearbyHospitals;
}

// ======= Main Testing Function =======
async function runTests() {
  console.log("===== GEOCODING AND DISTANCE CALCULATION TEST =====\n");
  
  // Test 1: Geocode a postal code and verify coordinates
  const testPostalCode = "19103";
  console.log(`Test 1: Geocoding postal code ${testPostalCode}`);
  const coordinates = await geocodePostalCode(testPostalCode);
  
  if (coordinates) {
    console.log("Geocoding result:");
    console.log(`- Latitude: ${coordinates.lat}`);
    console.log(`- Longitude: ${coordinates.lng}`);
    console.log(`- Address: ${coordinates.formattedAddress}`);
    
    // Verify against our hardcoded data
    const hardcodedCoords = postalCodes.find(p => p.code === testPostalCode);
    console.log("\nComparing with hardcoded coordinates:");
    console.log(`- Hardcoded Lat: ${hardcodedCoords.lat}, API Lat: ${coordinates.lat}`);
    console.log(`- Hardcoded Lng: ${hardcodedCoords.lng}, API Lng: ${coordinates.lng}`);
    
    // Test 2: Calculate distances between postal codes
    console.log("\nTest 2: Calculating distances between postal codes");
    for (const hospital of hospitals) {
      const hospitalCoords = {
        lat: hospital.postal_code.lat,
        lng: hospital.postal_code.lng
      };
      
      const distance = calculateDistance(coordinates, hospitalCoords);
      console.log(`- Distance to ${hospital.name} (${hospital.postal_code.code}): ${distance.toFixed(2)}km`);
    }
    
    // Test 3: Find all hospitals within a certain distance
    console.log("\nTest 3: Finding all hospitals within 10km");
    const nearbyHospitals = findNearbyHospitals(coordinates, 10);
    
    if (nearbyHospitals.length > 0) {
      console.log(`Found ${nearbyHospitals.length} hospitals within 10km:`);
      nearbyHospitals.forEach(hospital => {
        console.log(`- ${hospital.name} (${hospital.distanceKm}km away)`);
      });
    } else {
      console.log("No hospitals found within 10km");
    }
  } else {
    console.log("Geocoding failed. Cannot continue with distance tests.");
  }
}

// Run the tests
runTests();