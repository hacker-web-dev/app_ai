// providerSearch.js
// providerSearch.js (partial update)
const { admin, db } = require('./firebase-config');
const { geocodePostalCode, calculateDistance } = require('./geocoding');
const feedbackService = require('./feedbackService');

// Rest of the file remains the same...

/**
 * Find all available services
 * @param {string} searchTerm - Optional search term to filter services
 * @returns {Promise<Array>} - Array of services
 */
async function findServiceByName(searchTerm = '') {
  try {
    // Get unique services from hospital_prices collection
    const snapshot = await db.collection('hospital_prices').get();
    
    // Extract unique services
    const servicesMap = new Map();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.serviceCode && data.serviceDescription) {
        // Create a unique key
        const key = data.serviceCode;
        
        // Only add if not already in map or if this is a better entry
        if (!servicesMap.has(key) || !servicesMap.get(key).serviceDescription) {
          servicesMap.set(key, {
            id: key,
            code: data.serviceCode,
            description: data.serviceDescription,
            settings: [data.setting]
          });
        } else if (!servicesMap.get(key).settings.includes(data.setting)) {
          // Add the setting if not already included
          servicesMap.get(key).settings.push(data.setting);
        }
      }
    });
    
    // Convert map to array
    let services = Array.from(servicesMap.values());
    
    // Filter by search term if provided
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      services = services.filter(service => 
        service.description.toLowerCase().includes(term) || 
        service.code.toLowerCase().includes(term)
      );
    }
    
    // Sort by description
    services.sort((a, b) => a.description.localeCompare(b.description));
    
    return services;
  } catch (error) {
    console.error('Error finding services:', error);
    throw error;
  }
}

/**
 * Find providers near a postal code
 * @param {string} postalCode - User's postal code
 * @param {number} maxDistance - Maximum distance in kilometers
 * @param {string} serviceCode - Optional service code filter
 * @returns {Promise<Array>} - Array of providers with distance
 */
async function findProvidersByPostalCode(postalCode, maxDistance = 15, serviceCode = null) {
  try {
    // Get coordinates for the postal code
    const coordinates = await geocodePostalCode(postalCode);
    if (!coordinates) {
      throw new Error('Invalid postal code or geocoding failed');
    }
    
    console.log(`Found coordinates for ${postalCode}:`, coordinates);
    
    // Get all providers from Firestore
    const providersSnapshot = await db.collection('providers').get();
    let providers = [];
    
    providersSnapshot.forEach(doc => {
      providers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Found ${providers.length} providers in database`);
    
    // Filter providers by distance
    providers = providers.filter(provider => {
      // Skip providers without location data
      if (!provider.location || !provider.location.geopoint) {
        return false;
      }
      
      // Get coordinates from GeoPoint
      const providerCoords = {
        lat: provider.location.geopoint.latitude,
        lng: provider.location.geopoint.longitude
      };
      
      const distance = calculateDistance(coordinates, providerCoords);
      provider.distance = distance;
      provider.distanceKm = distance.toFixed(2);
      
      return distance <= maxDistance;
    });
    
    console.log(`${providers.length} providers are within ${maxDistance}km`);
    
    // Sort by distance
    providers.sort((a, b) => a.distance - b.distance);
    
    // Add ratings to providers
    if (providers.length > 0) {
      const providerIds = providers.map(p => p.id);
      const ratings = await feedbackService.getMultipleProviderRatings(providerIds, serviceCode);
      
      providers.forEach(provider => {
        const rating = ratings[provider.id];
        provider.rating = rating ? rating.averageRating : 0;
        provider.totalReviews = rating ? rating.totalReviews : 0;
      });
    }
    
    // If service code is specified, filter by service
    if (serviceCode) {
      console.log(`Filtering by service code: ${serviceCode}`);
      
      const providersWithService = [];
      
      for (const provider of providers) {
        // Query hospital_prices collection for this provider and service
        const pricesQuery = await db.collection('hospital_prices')
          .where('hospitalId', '==', provider.id)
          .where('serviceCode', '==', serviceCode)
          .limit(1)
          .get();
        
        if (!pricesQuery.empty) {
          // This provider offers the service
          providersWithService.push(provider);
        }
      }
      
      console.log(`${providersWithService.length} providers offer service ${serviceCode}`);
      providers = providersWithService;
    }
    
    return providers;
  } catch (error) {
    console.error('Error finding providers by postal code:', error);
    throw error;
  }
}

/**
 * Get pricing details for a specific service at a provider
 * @param {string} providerId - Provider ID
 * @param {string} serviceCode - Service code
 * @param {string} insuranceId - Optional insurance ID
 * @returns {Promise<Object>} - Price details
 */
async function getServicePricing(providerId, serviceCode, insuranceId = null) {
  try {
    // Build query
    let query = db.collection('hospital_prices')
      .where('hospitalId', '==', providerId)
      .where('serviceCode', '==', serviceCode);
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return {
        available: false,
        message: "Service not available at this provider"
      };
    }
    
    // Process pricing data
    const pricingData = {
      available: true,
      provider: null,
      service: serviceCode,
      standardCharge: null,
      insuranceOptions: []
    };
    
    // Get provider details
    const providerDoc = await db.collection('providers').doc(providerId).get();
    if (providerDoc.exists) {
      const providerData = providerDoc.data();
      pricingData.provider = {
        id: providerDoc.id,
        name: providerData.name,
        address: providerData.address
      };
    }
    
    // Process all price records
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Store standard charge if available
      if (!data.insurance && data.standardCharge) {
        if (!pricingData.standardCharge || 
            pricingData.standardCharge.amount > data.standardCharge) {
          pricingData.standardCharge = {
            amount: data.standardCharge,
            setting: data.setting
          };
        }
      }
      
      // Store insurance options
      if (data.insurance && data.planName && data.negotiatedAmount) {
        pricingData.insuranceOptions.push({
          insurance: data.insurance,
          plan: data.planName,
          negotiatedAmount: data.negotiatedAmount,
          setting: data.setting,
          savings: data.standardCharge ? 
            (data.standardCharge - data.negotiatedAmount).toFixed(2) : null,
          savingsPercentage: data.standardCharge ? 
            ((1 - (data.negotiatedAmount / data.standardCharge)) * 100).toFixed(1) : null
        });
      }
    });
    
    // Filter by insurance if specified
    if (insuranceId) {
      pricingData.insuranceOptions = pricingData.insuranceOptions.filter(
        option => option.insurance === insuranceId
      );
    }
    
    // Sort insurance options by price
    pricingData.insuranceOptions.sort((a, b) => a.negotiatedAmount - b.negotiatedAmount);
    
    return pricingData;
  } catch (error) {
    console.error('Error getting service pricing:', error);
    throw error;
  }
}

/**
 * Compare prices for a service across multiple providers
 * @param {Array<string>} providerIds - Array of provider IDs
 * @param {string} serviceCode - Service code
 * @param {string} insuranceId - Optional insurance ID
 * @returns {Promise<Array>} - Comparison results
 */
async function comparePrices(providerIds, serviceCode, insuranceId = null) {
  try {
    const comparison = [];
    
    for (const providerId of providerIds) {
      const pricing = await getServicePricing(providerId, serviceCode, insuranceId);
      comparison.push(pricing);
    }
    
    return comparison;
  } catch (error) {
    console.error('Error comparing prices:', error);
    throw error;
  }
}

/**
 * Find and recommend best providers based on price and distance
 * @param {string} postalCode - User's postal code
 * @param {string} serviceCode - Service code
 * @param {string} insuranceId - Optional insurance ID
 * @param {number} maxDistance - Maximum distance in kilometers
 * @returns {Promise<Array>} - Recommended providers
 */
async function getRecommendations(postalCode, serviceCode, insuranceId = null, maxDistance = 15) {
  try {
    // Find nearby providers that offer the service
    const providers = await findProvidersByPostalCode(postalCode, maxDistance, serviceCode);
    
    // Get pricing details for each provider
    const recommendations = [];
    
    for (const provider of providers) {
      const pricing = await getServicePricing(provider.id, serviceCode, insuranceId);
      
      if (pricing.available) {
        recommendations.push({
          provider: {
            id: provider.id,
            name: provider.name,
            address: provider.address,
            distance: provider.distanceKm
          },
          pricing: pricing
        });
      }
    }
    
    // Sort recommendations by price (with insurance if specified, otherwise standard charge)
    recommendations.sort((a, b) => {
      const aPrice = insuranceId && a.pricing.insuranceOptions.length > 0 
        ? a.pricing.insuranceOptions[0].negotiatedAmount 
        : a.pricing.standardCharge?.amount || Infinity;
        
      const bPrice = insuranceId && b.pricing.insuranceOptions.length > 0 
        ? b.pricing.insuranceOptions[0].negotiatedAmount 
        : b.pricing.standardCharge?.amount || Infinity;
        
      return aPrice - bPrice;
    });
    
    // Add ratings to recommendations
    if (recommendations.length > 0) {
      const providerIds = recommendations.map(r => r.provider.id);
      const ratings = await feedbackService.getMultipleProviderRatings(providerIds, serviceCode);
      
      recommendations.forEach(recommendation => {
        const rating = ratings[recommendation.provider.id];
        recommendation.provider.rating = rating ? rating.averageRating : 0;
        recommendation.provider.totalReviews = rating ? rating.totalReviews : 0;
      });
    }
    
    // Return top recommendations (limited to 5)
    return recommendations.slice(0, 5);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw error;
  }
}

module.exports = {
  findServiceByName,
  findProvidersByPostalCode,
  getServicePricing,
  comparePrices,
  getRecommendations
};