const { admin, db } = require('./firebase-config');

/**
 * Submit feedback for a provider
 * @param {Object} feedbackData - Feedback data
 * @param {string} feedbackData.providerId - Provider ID
 * @param {string} feedbackData.service - Service name
 * @param {number} feedbackData.rating - Rating (1-5)
 * @param {string} feedbackData.review - Review text
 * @param {string} feedbackData.userId - User ID
 * @returns {Promise<Object>} - Submitted feedback
 */
async function submitFeedback(feedbackData) {
  try {
    const { providerId, service, rating, review, userId } = feedbackData;
    
    console.log('Submitting feedback for provider:', providerId, 'service:', service, 'rating:', rating);
    
    // Create feedback document
    const feedback = {
      providerId,
      service,
      rating,
      review,
      userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString()
    };
    
    // Add feedback to collection
    const feedbackRef = await db.collection('provider_feedback').add(feedback);
    console.log('Feedback document created:', feedbackRef.id);
    
    // Update provider ratings summary
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
    
    // Calculate new ratings from user feedback
    let userFeedbackRating = 0;
    let userFeedbackCount = 0;
    const userRatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    snapshot.forEach(doc => {
      const data = doc.data();
      userFeedbackRating += data.rating;
      userFeedbackCount++;
      userRatingDistribution[data.rating]++;
    });
    
    // Combine with existing data if available
    let finalRating;
    let finalCount;
    let finalDistribution;
    
    if (existingData && existingData.isInitial) {
      // Mix initial random rating with user feedback
      // Weight: 70% user feedback, 30% initial random rating
      const initialWeight = 0.3;
      const userWeight = 0.7;
      
      const weightedInitialRating = existingData.averageRating * existingData.totalReviews * initialWeight;
      const weightedUserRating = (userFeedbackRating / userFeedbackCount) * userFeedbackCount * userWeight;
      
      finalRating = Math.round(((weightedInitialRating + weightedUserRating) / (existingData.totalReviews * initialWeight + userFeedbackCount * userWeight)) * 10) / 10;
      finalCount = existingData.totalReviews + userFeedbackCount;
      
      // Combine distributions
      finalDistribution = { ...existingData.ratingDistribution };
      for (let rating in userRatingDistribution) {
        finalDistribution[rating] += userRatingDistribution[rating];
      }
    } else {
      // Only user feedback
      finalRating = Math.round((userFeedbackRating / userFeedbackCount) * 10) / 10;
      finalCount = userFeedbackCount;
      finalDistribution = userRatingDistribution;
    }
    
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
    
    // Also update overall rating if this was for a specific service
    if (service) {
      await updateProviderRatings(providerId, null);
    }
    
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

module.exports = {
  submitFeedback,
  updateProviderRatings,
  updateHospitalRating,
  getProviderRatings,
  getProviderReviews,
  getMultipleProviderRatings,
  hasUserReviewed
};