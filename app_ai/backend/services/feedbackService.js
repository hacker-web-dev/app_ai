const { admin, db } = require('./firebase-config');
const sentimentAnalysisService = require('./sentimentAnalysisService');

/**
 * Submit feedback for a provider
 * @param {Object} feedbackData - Feedback data
 * @param {string} feedbackData.providerId - Provider ID
 * @param {string} feedbackData.service - Service name
 * @param {number} feedbackData.rating - Rating (1-5) - OPTIONAL
 * @param {string} feedbackData.review - Review text - REQUIRED if no rating
 * @param {string} feedbackData.userId - User ID
 * @returns {Promise<Object>} - Submitted feedback
 */
async function submitFeedback(feedbackData) {
  try {
    const { providerId, service, rating, review, userId } = feedbackData;
    
    // Validate that either rating or review is provided
    if (!rating && (!review || review.trim().length === 0)) {
      throw new Error('Either rating or review text must be provided');
    }
    
    console.log('Submitting feedback for provider:', providerId, 'service:', service, 'rating:', rating || 'none', 'review length:', review ? review.length : 0);
    
    // Initialize variables
    let sentimentAnalysis = null;
    let finalRating = rating;
    let adjustedRating = rating;
    let isRatingGenerated = false;
    
    // If review text is provided, perform sentiment analysis
    if (review && review.trim().length > 0) {
      console.log('Analyzing sentiment for review:', review.substring(0, 50) + '...');
      sentimentAnalysis = await sentimentAnalysisService.analyzeSentiment(review);
      
      if (rating) {
        // User provided both rating and review - adjust the rating based on sentiment
        adjustedRating = sentimentAnalysisService.applySentimentToRating(rating, sentimentAnalysis);
        console.log(`Sentiment analysis complete. Original rating: ${rating}, Adjusted rating: ${adjustedRating}, Classification: ${sentimentAnalysis.classification}, Confidence: ${sentimentAnalysis.confidence}`);
      } else {
        // User provided only review - generate rating from sentiment using advanced analysis
        finalRating = await sentimentAnalysisService.commentToStarRating(review);
        adjustedRating = finalRating;
        isRatingGenerated = true;
        console.log(`Rating generated from sentiment. Generated rating: ${finalRating}, Classification: ${sentimentAnalysis.classification}, Confidence: ${sentimentAnalysis.confidence}`);
      }
    } else if (!rating) {
      // This should not happen due to validation above, but handle gracefully
      throw new Error('No review text provided for sentiment analysis');
    }
    
    // Create feedback document with sentiment data
    const feedback = {
      providerId,
      service,
      rating: rating || null, // Original user rating (null if not provided)
      finalRating: finalRating, // The rating used for calculations (user rating or generated)
      adjustedRating: adjustedRating, // Sentiment-adjusted rating
      review: review || '',
      userId,
      sentimentAnalysis,
      isRatingGenerated, // Flag to indicate if rating was generated from sentiment
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString()
    };
    
    // Add feedback to collection
    const feedbackRef = await db.collection('provider_feedback').add(feedback);
    console.log('Feedback document created:', feedbackRef.id);
    
    // Update provider ratings summary using adjusted rating
    await updateProviderRatings(providerId, service);
    console.log('Provider ratings updated for:', providerId);
    
    return {
      id: feedbackRef.id,
      ...feedback
    };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
}

/**
 * Update provider ratings summary and hospital data
 * @param {string} providerId - Provider ID
 * @param {string} service - Service name (optional)
 */
async function updateProviderRatings(providerId, service = null) {
  try {
    // Get all feedback for this provider
    let query = db.collection('provider_feedback')
      .where('providerId', '==', providerId);
    
    if (service) {
      query = query.where('service', '==', service);
    }
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return;
    }
    
    // Get existing rating data (including initial random ratings)
    const docId = `${providerId}_${service || 'overall'}`;
    const existingRatingDoc = await db.collection('provider_ratings').doc(docId).get();
    let existingData = null;
    
    if (existingRatingDoc.exists) {
      existingData = existingRatingDoc.data();
    }
    
    // Calculate new ratings from user feedback using sentiment-adjusted ratings
    let userFeedbackRating = 0;
    let userFeedbackCount = 0;
    const userRatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    snapshot.forEach(doc => {
      const data = doc.data();
      // Use adjusted rating if available, otherwise fall back to finalRating, then original rating
      const effectiveRating = data.adjustedRating || data.finalRating || data.rating;
      
      if (effectiveRating) {
        userFeedbackRating += effectiveRating;
        userFeedbackCount++;
        
        // Round rating for distribution calculation
        const roundedRating = Math.round(effectiveRating);
        const validRating = Math.max(1, Math.min(5, roundedRating));
        userRatingDistribution[validRating]++;
      }
    });
    
    // Use ONLY real user feedback - no mixing with initial data
    const finalRating = Math.round((userFeedbackRating / userFeedbackCount) * 10) / 10;
    const finalCount = userFeedbackCount;
    const finalDistribution = userRatingDistribution;
    
    // Create ratings summary
    const ratingSummary = {
      providerId,
      service: service || 'overall',
      averageRating: finalRating,
      totalReviews: finalCount,
      ratingDistribution: finalDistribution,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      isInitial: false // Mark as updated with real feedback
    };
    
    // Save or update ratings summary
    const ratingsRef = db.collection('provider_ratings')
      .doc(`${providerId}_${service || 'overall'}`);
    
    await ratingsRef.set(ratingSummary, { merge: true });
    
    // Update hospital rating in main hospitals collection (for your CSV-based data)
    await updateHospitalRating(providerId, finalRating);
    
    // Don't update overall rating automatically - keep service-specific ratings separate
    
  } catch (error) {
    console.error('Error updating provider ratings:', error);
    throw error;
  }
}

/**
 * Update hospital rating in the main hospitals collection
 * @param {string} hospitalId - Hospital ID
 * @param {number} newRating - New average rating
 */
async function updateHospitalRating(hospitalId, newRating) {
  try {
    // Find all hospital documents with this hospitalId
    const hospitalsQuery = db.collection('hospitals')
      .where('hospitalId', '==', hospitalId);
    
    const snapshot = await hospitalsQuery.get();
    
    if (!snapshot.empty) {
      // Update all documents for this hospital
      const batch = db.batch();
      
      snapshot.forEach(doc => {
        batch.update(doc.ref, { hospitalRating: newRating });
      });
      
      await batch.commit();
      console.log(`Updated hospital rating for ${hospitalId} to ${newRating}`);
    }
  } catch (error) {
    console.error('Error updating hospital rating:', error);
    throw error;
  }
}

/**
 * Get provider ratings
 * @param {string} providerId - Provider ID
 * @param {string} service - Service name (optional)
 * @returns {Promise<Object>} - Provider ratings
 */
async function getProviderRatings(providerId, service = null) {
  try {
    const docId = `${providerId}_${service || 'overall'}`;
    const doc = await db.collection('provider_ratings').doc(docId).get();
    
    if (!doc.exists) {
      return {
        providerId,
        service: service || 'overall',
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }
    
    return doc.data();
  } catch (error) {
    console.error('Error getting provider ratings:', error);
    throw error;
  }
}

/**
 * Get provider reviews
 * @param {string} providerId - Provider ID
 * @param {string} service - Service name (optional)
 * @param {number} limit - Number of reviews to fetch
 * @param {number} offset - Number of reviews to skip
 * @returns {Promise<Array>} - Provider reviews
 */
async function getProviderReviews(providerId, service = null, limit = 10, offset = 0) {
  try {
    let query = db.collection('provider_feedback')
      .where('providerId', '==', providerId);
    
    if (service) {
      query = query.where('service', '==', service);
    }
    
    // Order by timestamp (newest first) and apply pagination
    query = query.orderBy('timestamp', 'desc')
      .limit(limit)
      .offset(offset);
    
    const snapshot = await query.get();
    
    const reviews = [];
    snapshot.forEach(doc => {
      reviews.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return reviews;
  } catch (error) {
    console.error('Error getting provider reviews:', error);
    throw error;
  }
}

/**
 * Get ratings for multiple providers
 * @param {Array<string>} providerIds - Array of provider IDs
 * @param {string} service - Service name (optional)
 * @returns {Promise<Object>} - Object with provider ratings keyed by provider ID
 */
async function getMultipleProviderRatings(providerIds, service = null) {
  try {
    const ratings = {};
    
    // Fetch ratings for all providers
    const promises = providerIds.map(async (providerId) => {
      const rating = await getProviderRatings(providerId, service);
      ratings[providerId] = rating;
    });
    
    await Promise.all(promises);
    
    return ratings;
  } catch (error) {
    console.error('Error getting multiple provider ratings:', error);
    throw error;
  }
}

/**
 * Check if user has already reviewed a provider for a specific service
 * @param {string} userId - User ID
 * @param {string} providerId - Provider ID
 * @param {string} service - Service name
 * @returns {Promise<boolean>} - True if user has already reviewed
 */
async function hasUserReviewed(userId, providerId, service) {
  try {
    const snapshot = await db.collection('provider_feedback')
      .where('userId', '==', userId)
      .where('providerId', '==', providerId)
      .where('service', '==', service)
      .limit(1)
      .get();
    
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking user review:', error);
    return false;
  }
}

/**
 * Get sentiment analysis statistics for a provider
 * @param {string} providerId - Provider ID
 * @param {string} service - Service name (optional)
 * @returns {Promise<Object>} - Sentiment statistics
 */
async function getProviderSentimentStats(providerId, service = null) {
  try {
    let query = db.collection('provider_feedback')
      .where('providerId', '==', providerId);
    
    if (service) {
      query = query.where('service', '==', service);
    }
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return sentimentAnalysisService.getSentimentStatistics([]);
    }
    
    const reviews = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.sentimentAnalysis) {
        reviews.push(data);
      }
    });
    
    return sentimentAnalysisService.getSentimentStatistics(reviews);
  } catch (error) {
    console.error('Error getting sentiment statistics:', error);
    return sentimentAnalysisService.getSentimentStatistics([]);
  }
}

/**
 * Reprocess existing reviews for sentiment analysis
 * @param {string} providerId - Provider ID (optional, if not provided, processes all)
 * @returns {Promise<Object>} - Processing results
 */
async function reprocessSentimentAnalysis(providerId = null) {
  try {
    let query = db.collection('provider_feedback');
    
    if (providerId) {
      query = query.where('providerId', '==', providerId);
    }
    
    // Only process reviews that don't have sentiment analysis yet and have review text
    query = query.where('review', '!=', '');
    
    const snapshot = await query.get();
    let processed = 0;
    let errors = 0;
    
    console.log(`Found ${snapshot.size} reviews to process for sentiment analysis`);
    
    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        
        // Skip if already has sentiment analysis
        if (data.sentimentAnalysis) {
          continue;
        }
        
        // Perform sentiment analysis
        const sentimentAnalysis = await sentimentAnalysisService.analyzeSentiment(data.review);
        const adjustedRating = sentimentAnalysisService.applySentimentToRating(data.rating, sentimentAnalysis);
        
        // Update the document
        await doc.ref.update({
          sentimentAnalysis: sentimentAnalysis,
          adjustedRating: adjustedRating
        });
        
        processed++;
        
        // Add small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error processing sentiment for review ${doc.id}:`, error);
        errors++;
      }
    }
    
    console.log(`Sentiment reprocessing complete. Processed: ${processed}, Errors: ${errors}`);
    
    // Update ratings for affected providers
    if (providerId) {
      await updateProviderRatings(providerId);
    }
    
    return { processed, errors, total: snapshot.size };
  } catch (error) {
    console.error('Error reprocessing sentiment analysis:', error);
    throw error;
  }
}

module.exports = {
  submitFeedback,
  updateProviderRatings,
  updateHospitalRating,
  getProviderRatings,
  getProviderReviews,
  getMultipleProviderRatings,
  hasUserReviewed,
  getProviderSentimentStats,
  reprocessSentimentAnalysis
};