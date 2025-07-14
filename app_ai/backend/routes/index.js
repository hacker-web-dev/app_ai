// routes.js (corrected routes without /api prefix)
const express = require('express');
const router = express.Router();
const providerSearch = require('../services/providerSearch'); // Adjust path as needed
const feedbackService = require('../services/feedbackService');

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

// Submit feedback/rating for a provider
router.post('/feedback', async (req, res) => {
  try {
    const { providerId, service, rating, review, userId } = req.body;
    
    if (!providerId || !service) {
      return res.status(400).json({ 
        error: 'Provider ID and service are required' 
      });
    }
    
    // Validate that either rating or review is provided
    if (!rating && (!review || review.trim().length === 0)) {
      return res.status(400).json({ 
        error: 'Either rating (1-5) or review text must be provided' 
      });
    }
    
    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ 
        error: 'Rating must be between 1 and 5' 
      });
    }
    
    const feedback = await feedbackService.submitFeedback({
      providerId,
      service,
      rating: rating || null, // Make rating optional
      review: review || '',
      userId: userId || 'anonymous'
    });
    
    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to submit feedback' 
    });
  }
});

// Get provider ratings
router.get('/providers/:providerId/ratings', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { service } = req.query;
    
    const ratings = await feedbackService.getProviderRatings(providerId, service);
    
    res.json({
      success: true,
      data: ratings
    });
  } catch (error) {
    console.error('Error getting provider ratings:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get provider ratings' 
    });
  }
});

// Get feedback reviews for a provider
router.get('/providers/:providerId/reviews', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { service, limit, offset } = req.query;
    
    const reviews = await feedbackService.getProviderReviews(
      providerId, 
      service, 
      Number(limit) || 10,
      Number(offset) || 0
    );
    
    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Error getting provider reviews:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get provider reviews' 
    });
  }
});

// Get sentiment analysis statistics for a provider
router.get('/providers/:providerId/sentiment', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { service } = req.query;
    
    const sentimentStats = await feedbackService.getProviderSentimentStats(providerId, service);
    
    res.json({
      success: true,
      data: sentimentStats
    });
  } catch (error) {
    console.error('Error getting sentiment statistics:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get sentiment statistics' 
    });
  }
});

// Reprocess existing reviews for sentiment analysis
router.post('/admin/reprocess-sentiment', async (req, res) => {
  try {
    const { providerId } = req.body;
    
    const results = await feedbackService.reprocessSentimentAnalysis(providerId);
    
    res.json({
      success: true,
      message: 'Sentiment analysis reprocessing completed',
      data: results
    });
  } catch (error) {
    console.error('Error reprocessing sentiment analysis:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to reprocess sentiment analysis' 
    });
  }
});
 
module.exports = router;