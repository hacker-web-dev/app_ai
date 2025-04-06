// routes.js (corrected routes without /api prefix)
const express = require('express');
const router = express.Router();
const providerSearch = require('../services/providerSearch'); // Adjust path as needed

// Get available services
router.get('/services', async (req, res) => {
  try {
    const searchTerm = req.query.search || '';
    const services = await providerSearch.findServiceByName(searchTerm);
    res.json(services);
  } catch (error) {
    console.error('Error getting services:', error);
    res.status(500).json({ error: 'Failed to get services' });
  }
});

// Find providers near a postal code
router.get('/providers/nearby', async (req, res) => {
  try {
    const { postalCode, serviceCode, insuranceId, maxDistance } = req.query;
    
    if (!postalCode) {
      return res.status(400).json({ error: 'Postal code is required' });
    }
    
    const providers = await providerSearch.findProvidersByPostalCode(
      postalCode, 
      Number(maxDistance) || 15, 
      serviceCode || null
    );
    
    res.json({ 
      success: true, 
      count: providers.length,
      data: providers 
    });
  } catch (error) {
    console.error('Error finding providers:', error);
    res.status(500).json({ error: error.message || 'Failed to find providers' });
  }
});

// Get service pricing details
router.get('/providers/pricing', async (req, res) => {
  try {
    const { providerId, serviceCode, insuranceId } = req.query;
    
    if (!providerId || !serviceCode) {
      return res.status(400).json({ error: 'Provider ID and service code are required' });
    }
    
    const pricing = await providerSearch.getServicePricing(providerId, serviceCode, insuranceId || null);
    res.json(pricing);
  } catch (error) {
    console.error('Error getting pricing:', error);
    res.status(500).json({ error: error.message || 'Failed to get pricing information' });
  }
});
 
// Compare prices for a service across providers
router.get('/providers/compare', async (req, res) => {
  try {
    const { providerIds, serviceCode, insuranceId } = req.query;
    
    if (!providerIds || !serviceCode) {
      return res.status(400).json({ error: 'Provider IDs and service code are required' });
    }
    
    // Parse provider IDs from comma-separated string
    const providers = providerIds.split(',');
    
    const comparison = await providerSearch.comparePrices(providers, serviceCode, insuranceId || null);
    res.json(comparison);
  } catch (error) {
    console.error('Error comparing prices:', error);
    res.status(500).json({ error: error.message || 'Failed to compare prices' });
  }
});
 
// Get recommendations for a service
router.get('/recommendations', async (req, res) => {
  try {
    const { postalCode, serviceCode, insuranceId, maxDistance } = req.query;
    
    if (!postalCode || !serviceCode) {
      return res.status(400).json({ error: 'Postal code and service code are required' });
    }
    
    const recommendations = await providerSearch.getRecommendations(
      postalCode,
      serviceCode,
      insuranceId || null,
      Number(maxDistance) || 15
    );
    
    res.json({
      success: true,
      count: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: error.message || 'Failed to get recommendations' });
  }
});
 
module.exports = router;