require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const csv = require('csv-parser');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const os = require('os'); // Needed for temporary directory
const ftp = require('basic-ftp'); // FTP client library
const { db } = require('./firebase-config');
const axios = require('axios');
const routes = require('../routes/index');

const app = express();
const port = process.env.PORT || 3000;

// Track last FTP sync month (store as YYYY-MM format string)
let lastFtpSyncMonth = ''; // Empty string means no sync has happened yet

// FTP Configuration (using environment variables)
const ftpConfig = {
  host: process.env.FTP_HOST || '127.0.0.1',
  port: parseInt(process.env.FTP_PORT || '21', 10),
  user: process.env.FTP_USER || 'user',
  password: process.env.FTP_PASSWORD || 'password',
  secure: false, // Use true if using FTPS
};
const ftpDirectory = '';
const googleApiKey = "AIzaSyBoQ5dP807JSDdYMjB-XCpGvdbkHfz_ooo"; // Use environment variable

if (!googleApiKey) {
  console.error("ERROR: GOOGLE_MAPS_API_KEY environment variable is not set.");
  // process.exit(1); // Optionally exit if the key is essential
}

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Use API routes
app.use('/api', routes);

// --- Helper Functions ---

// Function to check if FTP sync is needed (on the 2nd of each month)
function isFtpSyncNeeded() {
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
  
  // Sync is needed if:
  // 1. It's the 2nd day of the month, AND
  // 2. We haven't already synced this month
  if (currentDay === 2 && currentMonth !== lastFtpSyncMonth) {
    console.log(`FTP sync required: It's the 2nd of the month and no sync has occurred for ${currentMonth}`);
    return true;
  }
  
  console.log(`FTP sync not required: Either it's not the 2nd of the month (current: ${currentDay}) or sync already occurred for ${currentMonth}`);
  return false;
}

// Function to update the last sync month after successful sync
function updateLastFtpSyncMonth() {
  const currentDate = new Date();
  lastFtpSyncMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
  console.log(`Updated last FTP sync month to: ${lastFtpSyncMonth}`);
}

// Generate realistic rating distribution based on average rating and review count
function generateRatingDistribution(averageRating, totalReviews) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  // Calculate weighted distribution based on average rating
  // Higher averages have more 4s and 5s, lower averages have more 1s, 2s, 3s
  
  let remainingReviews = totalReviews;
  
  if (averageRating >= 4.5) {
    // Excellent ratings: mostly 5s and 4s
    distribution[5] = Math.floor(totalReviews * 0.7);
    distribution[4] = Math.floor(totalReviews * 0.25);
    distribution[3] = Math.floor(totalReviews * 0.04);
    distribution[2] = Math.floor(totalReviews * 0.01);
  } else if (averageRating >= 4.0) {
    // Good ratings: mix of 4s and 5s
    distribution[5] = Math.floor(totalReviews * 0.5);
    distribution[4] = Math.floor(totalReviews * 0.35);
    distribution[3] = Math.floor(totalReviews * 0.12);
    distribution[2] = Math.floor(totalReviews * 0.02);
    distribution[1] = Math.floor(totalReviews * 0.01);
  } else if (averageRating >= 3.5) {
    // Average ratings: more 3s and 4s
    distribution[4] = Math.floor(totalReviews * 0.3);
    distribution[3] = Math.floor(totalReviews * 0.4);
    distribution[5] = Math.floor(totalReviews * 0.15);
    distribution[2] = Math.floor(totalReviews * 0.1);
    distribution[1] = Math.floor(totalReviews * 0.05);
  }
  
  // Adjust to ensure total equals totalReviews
  const currentTotal = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  const difference = totalReviews - currentTotal;
  
  if (difference > 0) {
    // Add remaining reviews to the rating closest to average
    const targetRating = Math.round(averageRating);
    distribution[targetRating] += difference;
  }
  
  return distribution;
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  // Check for valid coordinates
  if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || 
      typeof lat2 !== 'number' || typeof lon2 !== 'number') {
    console.error('Invalid coordinates in distance calculation:', { lat1, lon1, lat2, lon2 });
    return Infinity; // Return a large value for invalid coordinates
  }

  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  
  // Log distance for debugging
  // console.log(`Distance calculation: ${lat1},${lon1} to ${lat2},${lon2} = ${distance.toFixed(2)}km`);
  
  return distance;
}

// Function to process a single CSV file and populate Firestore
async function processCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    let batches = [];
    let currentBatch = db.batch();
    let batchCount = 0;
    let totalRecords = 0;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Basic validation: Check if essential fields exist
        if (!data['Hospital ID'] || !data['Hospital Name'] || !data['Service Description'] || !data['Latitude'] || !data['Longitude']) {
            console.warn(`Skipping row due to missing essential data in file ${path.basename(filePath)}:`, data);
            return; // Skip this row
        }

        const hospitalRef = db.collection('hospitals').doc(); // Generate unique ID

        // Ensure numeric fields are parsed correctly, default to 0 or NaN if invalid
        const latitude = parseFloat(data['Latitude']);
        const longitude = parseFloat(data['Longitude']);
        const standardCharge = parseFloat(data['Standard Charge']);
        const negotiatedAmount = parseFloat(data['Negotiated Amount']);
        
        // Generate random rating between 3.5 and 4.8 for each hospital-service combination
        // This ensures no "No Rating" appears and gives realistic starting ratings
        const randomRating = Math.round((3.5 + Math.random() * 1.3) * 10) / 10;

        // Skip if location is invalid
        if (isNaN(latitude) || isNaN(longitude)) {
            console.warn(`Skipping row due to invalid coordinates in file ${path.basename(filePath)}:`, data);
            return;
        }

        // Construct Firestore document data
        const hospitalData = {
          hospitalId: data['Hospital ID'] || `GeneratedID_${Date.now()}_${Math.random()}`, // Fallback ID
          hospitalName: data['Hospital Name'] || 'Unknown Hospital',
          hospitalType: data['Hospital Type'] || 'N/A',
          hospitalRating: randomRating, // Use generated random rating
          address: {
            street: data['Street'] || '',
            city: data['City'] || '',
            state: data['State'] || '',
            postalCode: data['Postal Code'] || '',
          },
          location: {
            latitude: latitude,
            longitude: longitude,
          },
          contact: {
            phone: data['Phone'] || '',
            email: data['Email'] || '',
            website: data['Website'] || '',
          },
          acceptedInsurance: data['Accepted Insurance'] ? data['Accepted Insurance'].split(',').map(item => item.trim()) : [],
          service: {
            description: (data['Service Description'] || 'Unknown Service').toUpperCase(), // Store uppercase for consistent search
            code: data['Service Code'] || '',
            setting: data['Setting'] || '',
          },
          pricing: {
            standardCharge: !isNaN(standardCharge) ? standardCharge : null, // Use null if invalid
            insurance: data['Insurance'] || '',
            planName: data['Plan Name'] || '',
            negotiatedAmount: !isNaN(negotiatedAmount) ? negotiatedAmount : null, // Use null if invalid
            comments: data['Comments'] || '',
          },
          // Create search terms array (lowercase for potentially case-insensitive searches later)
           searchTerms: [
             (data['Service Description'] || '').toLowerCase(),
             (data['Hospital Name'] || '').toLowerCase(),
             (data['City'] || '').toLowerCase(),
             (data['State'] || '').toLowerCase(),
             (data['Postal Code'] || '').toString() // Keep postal code as string
           ].filter(term => term) // Remove empty strings
        };

        currentBatch.set(hospitalRef, hospitalData);
        
        // Also create initial rating summary for this hospital-service combination
        const serviceRatingRef = db.collection('provider_ratings')
          .doc(`${hospitalData.hospitalId}_${hospitalData.service.description}`);
        const overallRatingRef = db.collection('provider_ratings')
          .doc(`${hospitalData.hospitalId}_overall`);
        
        // Generate random review count between 5-25 for realistic appearance
        const randomReviewCount = Math.floor(5 + Math.random() * 20);
        
        // Create rating distribution that matches the random rating
        const ratingDistribution = generateRatingDistribution(randomRating, randomReviewCount);
        
        const ratingData = {
          providerId: hospitalData.hospitalId,
          service: hospitalData.service.description,
          averageRating: randomRating,
          totalReviews: randomReviewCount,
          ratingDistribution,
          lastUpdated: new Date(),
          isInitial: true // Mark as initial random data
        };
        
        const overallRatingData = {
          ...ratingData,
          service: 'overall'
        };
        
        currentBatch.set(serviceRatingRef, ratingData);
        currentBatch.set(overallRatingRef, overallRatingData);
        
        batchCount += 3; // Now we're adding 3 documents per row
        totalRecords++;

        // Firestore has a limit of 500 operations per batch
        if (batchCount === 450) {
          batches.push(currentBatch);
          currentBatch = db.batch(); // Create a new batch
          batchCount = 0;
        }
      })
      .on('end', async () => {
        // Add the last batch if it has operations
        if (batchCount > 0) {
          batches.push(currentBatch);
        }

        // Commit all batches
        try {
          await Promise.all(batches.map(batch => batch.commit()));
          console.log(`Committed ${batches.length} batches with ${totalRecords} total records from ${path.basename(filePath)}`);
          resolve(totalRecords); // Resolve with the number of records processed
        } catch (error) {
          console.error(`Error committing batches for ${path.basename(filePath)}:`, error);
          reject(error); // Reject the promise on error
        }
      })
      .on('error', (error) => {
        console.error(`Error processing CSV file ${path.basename(filePath)}:`, error);
        reject(error); // Reject the promise on error
      });
  });
}

// --- API Endpoints ---

// Endpoint to trigger FTP download and Firestore population
app.post('/sync-ftp-data', async (req, res) => {
  console.log('Starting FTP data sync...');
  const client = new ftp.Client();
  client.ftp.verbose = false; // Set true for detailed FTP logs
  let totalFilesProcessed = 0;
  let totalRecordsImported = 0;
  const tempDir = path.join(os.tmpdir(), 'ftp-downloads'); // Create a temporary directory path

  try {
    // Ensure temporary directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
      console.log(`Created temporary directory: ${tempDir}`);
    } else {
        console.log(`Using existing temporary directory: ${tempDir}`);
    }

    console.log(`Attempting to connect to FTP server: ${ftpConfig.host}:${ftpConfig.port}`);
    await client.access(ftpConfig);
    console.log('FTP connection successful.');

    console.log(`Navigating to directory: ${ftpDirectory}`);
    await client.cd(ftpDirectory);
    console.log(`Current directory: ${await client.pwd()}`);

    const fileList = await client.list();
    const csvFiles = fileList.filter(file => file.name.toLowerCase().endsWith('.csv'));
    console.log(`Found ${csvFiles.length} CSV files in ${ftpDirectory}:`, csvFiles.map(f => f.name));

    if (csvFiles.length === 0) {
        console.log('No CSV files found on FTP server.');
        return res.json({ message: 'No CSV files found on FTP server to process.', filesProcessed: 0, recordsImported: 0 });
    }

    for (const fileInfo of csvFiles) {
      const remoteFilePath = fileInfo.name; // Already in the correct directory
      const localFilePath = path.join(tempDir, fileInfo.name);

      console.log(`Downloading ${remoteFilePath} to ${localFilePath}...`);
      await client.downloadTo(localFilePath, remoteFilePath);
      console.log(`Downloaded ${fileInfo.name}.`);

      try {
        console.log(`Processing ${fileInfo.name}...`);
        const recordsProcessed = await processCsvFile(localFilePath);
        totalFilesProcessed++;
        totalRecordsImported += recordsProcessed;
        console.log(`Finished processing ${fileInfo.name}. Records added: ${recordsProcessed}`);
      } catch (processingError) {
        console.error(`Failed to process ${fileInfo.name}:`, processingError);
        // Decide if you want to stop the whole sync or continue with other files
        // For now, we log the error and continue
      } finally {
        // Clean up the downloaded file
        try {
          fs.unlinkSync(localFilePath);
          console.log(`Deleted temporary file: ${localFilePath}`);
        } catch (unlinkError) {
          console.error(`Error deleting temporary file ${localFilePath}:`, unlinkError);
        }
      }
    }

    // Update the last sync month after successful sync
    updateLastFtpSyncMonth();

    res.json({
      message: 'FTP data sync completed.',
      filesProcessed: totalFilesProcessed,
      recordsImported: totalRecordsImported,
    });

  } catch (err) {
    console.error('FTP Sync Error:', err);
    res.status(500).json({ error: 'Failed to sync data from FTP server', details: err.message });
  } finally {
    // Ensure the client connection is closed
    if (client.closed === false) {
      console.log('Closing FTP connection.');
      await client.close();
    }
    // Optional: Clean up the entire temp directory afterwards if needed
    // fs.rmSync(tempDir, { recursive: true, force: true });
    // console.log(`Cleaned up temporary directory: ${tempDir}`);
  }
});

// Endpoint to get location coordinates from postal code
app.get('/geocode/:postalCode', async (req, res) => {
  try {
    const { postalCode } = req.params;
    if (!googleApiKey) {
        return res.status(500).json({ error: 'Server configuration error: Missing Geocoding API Key' });
    }

    console.log(`Geocoding postal code: ${postalCode}`);
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: postalCode,
        key: googleApiKey, // Use the API key from environment variable
        // Optional: Add component restrictions for better accuracy, e.g., country
        // components: 'country:US'
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      console.log(`Geocoding successful for ${postalCode}:`, location);
      res.json({
        latitude: location.lat,
        longitude: location.lng
      });
    } else {
      console.warn(`Geocoding failed for ${postalCode}: ${response.data.status}`, response.data.error_message || '');
      res.status(404).json({ error: `Location not found for the postal code ${postalCode}. Status: ${response.data.status}` });
    }
  } catch (error) {
    console.error('Geocoding error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Geocoding service failed' });
  }
});

// Endpoint to search for nearby hospitals with specific services
app.get('/search', async (req, res) => {
  try {
    // Check if FTP sync is needed (2nd of each month)
    if (isFtpSyncNeeded()) {
      console.log('Monthly FTP data sync needed (2nd of the month)');
      try {
        const ftpResponse = await axios.post(`http://localhost:${port}/sync-ftp-data`);
        if (ftpResponse.status === 200) {
          console.log('FTP data sync completed successfully');
          // Update already happens in the sync-ftp-data endpoint
        }
      } catch (ftpError) {
        console.error('FTP sync error:', ftpError.message);
        // Continue with search even if FTP sync fails
      }
    } else {
      console.log('Skipping FTP sync - not scheduled for today or already completed this month');
    }

    const { zipCode, serviceDescription, maxDistance = 30 } = req.query; // Use zipCode and serviceDescription

    if (!zipCode || !serviceDescription) {
      return res.status(400).json({ error: 'Zip code and service description are required parameters.' });
    }

    console.log(`Search request received: zipCode=${zipCode}, serviceDescription=${serviceDescription}, maxDistance=${maxDistance}`);

    // 1. Get coordinates for the zip code
    let userLocation;
    try {
      // Use the internal geocode endpoint
      const geocodeResponse = await axios.get(`http://localhost:${port}/geocode/${zipCode}`);
      userLocation = geocodeResponse.data;
      console.log(`User location for ${zipCode}:`, userLocation);
    } catch (error) {
      console.error(`Failed to geocode zip code ${zipCode}:`, error.response?.data || error.message);
      // Check if the error from geocode was 404
      if (error.response && error.response.status === 404) {
           return res.status(404).json({ error: `Could not find coordinates for the zip code: ${zipCode}` });
      }
      return res.status(500).json({ error: 'Failed to determine location for the zip code' });
    }

    // 2. Query Firestore for hospitals with the specified service (case-insensitive might require storing lowercase)
    // We stored service.description in UPPERCASE, so we query with uppercase.
    const upperServiceDesc = serviceDescription.toUpperCase();
    console.log(`Querying Firestore for service: ${upperServiceDesc}`);

    const serviceQuery = db.collection('hospitals')
      .where('service.description', '==', upperServiceDesc);

    const querySnapshot = await serviceQuery.get();
    console.log(`Firestore query returned ${querySnapshot.size} potential matches for service.`);

    if (querySnapshot.empty) {
        // Optional: Try a broader search (e.g., using searchTerms array) if initial search fails
         console.log(`No exact match for service description "${upperServiceDesc}". Trying broader search...`);
         const broaderQuery = db.collection('hospitals')
              .where('searchTerms', 'array-contains', serviceDescription.toLowerCase()); // Assuming searchTerms are stored lowercase
         const broaderSnapshot = await broaderQuery.get();
         console.log(`Broader Firestore query returned ${broaderSnapshot.size} potential matches.`);
         if (broaderSnapshot.empty) {
            return res.json({ hospitals: [], message: `No providers found offering '${serviceDescription}'.` });
         }
         // If broader search found results, use broaderSnapshot instead
         // Note: This might return hospitals offering *other* services too if the search term matches other fields.
         // You might need further filtering here based on the exact service description if using this approach.
         // For simplicity now, we'll stick to the original exact match logic.
         // querySnapshot = broaderSnapshot; // Uncomment to use broader results

        // If still using the original logic and it's empty:
        return res.json({ hospitals: [], message: `No providers found offering '${upperServiceDesc}'.` });
    }

    // 3. Filter results by distance and prepare the response
    // Create a map to group hospitals by ID and service
    const hospitalServiceMap = new Map();
    const maxDistNum = parseFloat(maxDistance); // Ensure maxDistance is a number
    const feedbackService = require('./feedbackService');

    querySnapshot.forEach(doc => {
      const hospital = doc.data();
      
      // Skip if hospital data or location is incomplete
      if (!hospital || !hospital.location || typeof hospital.location.latitude !== 'number' || typeof hospital.location.longitude !== 'number') {
          console.warn(`Skipping hospital doc ID ${doc.id} due to missing/invalid location data.`);
          return;
      }

      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        hospital.location.latitude,
        hospital.location.longitude
      );
      
      // Only include hospitals within the specified distance
      if (distance <= maxDistNum) {
        // Create a unique key for each hospital+service combination
        const mapKey = `${hospital.hospitalId}_${hospital.service.description}`;
        
        // Ensure numeric values are properly handled (use null if not a valid number)
        const standardCharge = (hospital.pricing && typeof hospital.pricing.standardCharge === 'number') ? hospital.pricing.standardCharge : null;
        const negotiatedAmount = (hospital.pricing && typeof hospital.pricing.negotiatedAmount === 'number') ? hospital.pricing.negotiatedAmount : null;
        const savings = (standardCharge !== null && negotiatedAmount !== null) ? standardCharge - negotiatedAmount : null;
        
        // Ensure hospital rating is properly handled
        const hospitalRating = (typeof hospital.hospitalRating === 'number') ? 
                             hospital.hospitalRating : 
                             (typeof hospital.hospitalRating === 'string' ? parseFloat(hospital.hospitalRating) : null);

        const insuranceOption = {
            insurance: hospital.pricing?.insurance || 'N/A',
            planName: hospital.pricing?.planName || 'N/A',
            standardCharge: standardCharge,
            negotiatedAmount: negotiatedAmount,
            savings: savings,
            comments: hospital.pricing?.comments || ''
        };
        
        // Check if this hospital+service already exists in our map
        if (hospitalServiceMap.has(mapKey)) {
          const existing = hospitalServiceMap.get(mapKey);
          
          // Check if this is actually a new insurance option by comparing insurance+planName
          // to avoid duplicate entries
          const isDuplicate = existing.insuranceOptions.some(option => 
            option.insurance === insuranceOption.insurance && 
            option.planName === insuranceOption.planName
          );
          
          if (!isDuplicate) {
            // Use the consistent standard charge for this hospital+service
            if (existing.insuranceOptions.length > 0 && existing.insuranceOptions[0].standardCharge !== null) {
              insuranceOption.standardCharge = existing.insuranceOptions[0].standardCharge;
              
              // Recalculate savings based on consistent standard charge
              if (insuranceOption.negotiatedAmount !== null) {
                insuranceOption.savings = insuranceOption.standardCharge - insuranceOption.negotiatedAmount;
              }
            }
            
            // Only add if this is a new insurance option
            existing.insuranceOptions.push(insuranceOption);
          }
          
          // Update accepted insurance list if necessary (combine unique values)
          if (hospital.acceptedInsurance) {
            hospital.acceptedInsurance.forEach(ins => {
              if (!existing.acceptedInsurance.includes(ins)) {
                existing.acceptedInsurance.push(ins);
              }
            });
          }
          
          // Keep the existing entry with updates
          hospitalServiceMap.set(mapKey, existing);
        } else {
          // Otherwise, create a new hospital entry
          hospitalServiceMap.set(mapKey, {
            // Use Firestore document ID as the primary key for React lists
            id: doc.id,
            hospitalId: hospital.hospitalId,
            hospitalName: hospital.hospitalName,
            hospitalType: hospital.hospitalType,
            hospitalRating: hospitalRating, // Include the processed hospital rating
            address: hospital.address,
            location: hospital.location,
            contact: hospital.contact,
            acceptedInsurance: hospital.acceptedInsurance || [], // Ensure it's always an array
            service: hospital.service, // Includes description, code, setting
            distance: parseFloat(distance.toFixed(2)), // Keep as number for sorting
            insuranceOptions: [insuranceOption] // Start with the first option
          });
        }
      }
    });

    // Convert the map values to an array
    const nearbyHospitals = Array.from(hospitalServiceMap.values());
    console.log(`Found ${nearbyHospitals.length} hospitals within ${maxDistNum}km.`);
    
    // Update ratings with live feedback data
    for (let hospital of nearbyHospitals) {
      try {
        const liveRating = await feedbackService.getProviderRatings(hospital.hospitalId, upperServiceDesc);
        if (liveRating && liveRating.totalReviews > 0) {
          // Use live rating if feedback exists
          hospital.hospitalRating = liveRating.averageRating;
          hospital.totalReviews = liveRating.totalReviews;
          console.log(`Updated ${hospital.hospitalName} rating to ${liveRating.averageRating} from ${liveRating.totalReviews} reviews`);
        } else {
          // Keep original rating if no feedback yet
          hospital.totalReviews = 0;
        }
      } catch (error) {
        console.error(`Error fetching live rating for ${hospital.hospitalId}:`, error);
        // Keep original rating on error
        hospital.totalReviews = 0;
      }
    }
    
    // Log a summary of the first hospital's information including rating
    if (nearbyHospitals.length > 0) {
      console.log(`First hospital (${nearbyHospitals[0].hospitalName}) has rating: ${nearbyHospitals[0].hospitalRating}`);
      console.log(`First hospital has ${nearbyHospitals[0].insuranceOptions.length} insurance options.`);
    }

    // Sort by rating (descending), then by distance (ascending) for better recommendations
    nearbyHospitals.sort((a, b) => {
      // First prioritize by rating (higher is better)
      const ratingA = a.hospitalRating || 0;
      const ratingB = b.hospitalRating || 0;
      if (ratingB !== ratingA) {
        return ratingB - ratingA; // Higher ratings first
      }
      // If ratings are equal, sort by distance (closer is better)
      return a.distance - b.distance;
    });
    res.json({ hospitals: nearbyHospitals });

  } catch (error) {
    console.error('Search endpoint error:', error);
    res.status(500).json({ error: 'Failed to search for hospitals', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`API Endpoints:`);
  console.log(`  POST /sync-ftp-data  - Trigger data import from FTP`);
  console.log(`  GET /geocode/:postalCode - Get coordinates for a postal code`);
  console.log(`  GET /search?zipCode=...&serviceDescription=...&maxDistance=... - Search providers`);
  console.log(`  POST /api/feedback - Submit provider feedback`);
  console.log(`  GET /api/providers/:id/ratings - Get provider ratings`);
  console.log(`  GET /api/providers/:id/reviews - Get provider reviews`);
});