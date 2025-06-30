const axios = require('axios');
const NodeCache = require('node-cache');

class SentimentAnalysisService {
  constructor() {
    // Cache sentiment results for 1 hour to improve performance
    this.cache = new NodeCache({ stdTTL: 3600 });
    
    // Hugging Face API configuration
    this.hfApiUrl = "https://router.huggingface.co/hf-inference/models/cardiffnlp/twitter-roberta-base-sentiment";
    this.hfApiKey = ''; // Set this in your environment
    
    // Request queue to handle rate limiting
    this.requestQueue = [];
    this.isProcessing = false;
    this.rateLimitDelay = 1000; // 1 second between requests
  }

  /**
   * Analyze sentiment of review text using Hugging Face API
   * @param {string} text - Review text to analyze
   * @returns {Promise<Object>} - Sentiment analysis result
   */
  async analyzeSentiment(text) {
    if (!text || typeof text !== 'string') {
      return {
        score: 0,
        classification: 'neutral',
        confidence: 0,
        ratingAdjustment: 0
      };
    }

    // Check cache first
    const cacheKey = `sentiment_${text.toLowerCase().trim()}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Clean and preprocess text
      const cleanText = this.preprocessText(text);
      
      // Add to request queue for rate limiting
      const result = await this.queueHuggingFaceRequest(cleanText);
      
      // Process and enhance the result
      const enhancedResult = this.processHuggingFaceResult(result, cleanText);
      
      // Cache the result
      this.cache.set(cacheKey, enhancedResult);
      
      return enhancedResult;
    } catch (error) {
      console.error('Sentiment analysis error:', error.message);
      
      // Fallback to basic sentiment analysis
      return this.fallbackSentimentAnalysis(text);
    }
  }

  /**
   * Queue requests to handle Hugging Face rate limiting
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} - API response
   */
  async queueHuggingFaceRequest(text) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ text, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Process the request queue with rate limiting
   */
  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const { text, resolve, reject } = this.requestQueue.shift();

      try {
        const result = await this.callHuggingFaceAPI(text);
        resolve(result);
      } catch (error) {
        reject(error);
      }

      // Wait before processing next request
      if (this.requestQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
      }
    }

    this.isProcessing = false;
  }

  /**
   * Call Hugging Face API for sentiment analysis
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} - API response
   */
  async callHuggingFaceAPI(text) {
    const headers = {
      'Authorization': `Bearer ${this.hfApiKey}`,
      'Content-Type': 'application/json'
    };

    const data = {
      inputs: text,
      options: {
        wait_for_model: true
      }
    };

    const response = await axios.post(this.hfApiUrl, data, { 
      headers,
      timeout: 10000 // 10 second timeout
    });

    return response.data;
  }

  /**
   * Process Hugging Face API result
   * @param {Array} result - API response
   * @param {string} text - Original text
   * @returns {Object} - Processed sentiment result
   */
  processHuggingFaceResult(result, text) {
    if (!result || !Array.isArray(result) || result.length === 0) {
      return this.fallbackSentimentAnalysis(text);
    }

    // Sort by confidence score
    const sortedResults = result.sort((a, b) => b.score - a.score);
    const topResult = sortedResults[0];

    // Map labels to our classification system
    const labelMap = {
      'LABEL_0': 'negative',     // Negative
      'LABEL_1': 'neutral',      // Neutral  
      'LABEL_2': 'positive',     // Positive
      'negative': 'negative',
      'neutral': 'neutral',
      'positive': 'positive'
    };

    const classification = labelMap[topResult.label] || 'neutral';
    const confidence = topResult.score;

    // Calculate sentiment score based on classification and confidence
    let sentimentScore = 0;
    switch (classification) {
      case 'positive':
        sentimentScore = confidence * 2; // 0 to 2
        break;
      case 'negative':
        sentimentScore = -confidence * 2; // 0 to -2
        break;
      default:
        sentimentScore = 0;
    }

    // Calculate rating adjustment based on sentiment
    const ratingAdjustment = this.calculateRatingAdjustment(classification, confidence, text);

    return {
      score: sentimentScore,
      classification: this.enhanceClassification(classification, confidence),
      confidence: Math.round(confidence * 100) / 100,
      ratingAdjustment: ratingAdjustment,
      originalText: text,
      rawResult: topResult
    };
  }

  /**
   * Enhance classification based on confidence
   * @param {string} classification - Base classification
   * @param {number} confidence - Confidence score
   * @returns {string} - Enhanced classification
   */
  enhanceClassification(classification, confidence) {
    if (confidence > 0.8) {
      return classification === 'positive' ? 'very_positive' : 
             classification === 'negative' ? 'very_negative' : 'neutral';
    }
    return classification;
  }

  /**
   * Calculate rating adjustment based on sentiment analysis
   * @param {string} classification - Sentiment classification
   * @param {number} confidence - Confidence score
   * @param {string} text - Original text
   * @returns {number} - Rating adjustment (-1 to +1)
   */
  calculateRatingAdjustment(classification, confidence, text) {
    // Only apply adjustments for high confidence results
    if (confidence < 0.6) {
      return 0;
    }

    // Healthcare-specific keywords boost
    const healthcareBoost = this.getHealthcareContextBoost(text);
    const adjustedConfidence = Math.min(confidence + healthcareBoost, 1.0);

    let baseAdjustment = 0;
    switch (classification) {
      case 'positive':
        baseAdjustment = adjustedConfidence * 0.5; // Up to +0.5 stars
        break;
      case 'negative':
        baseAdjustment = -adjustedConfidence * 0.5; // Up to -0.5 stars
        break;
      default:
        baseAdjustment = 0;
    }

    // Round to one decimal place
    return Math.round(baseAdjustment * 10) / 10;
  }

  /**
   * Get healthcare context boost for sentiment confidence
   * @param {string} text - Review text
   * @returns {number} - Confidence boost (0-0.2)
   */
  getHealthcareContextBoost(text) {
    const positiveHealthcareTerms = [
      'excellent care', 'professional', 'caring', 'compassionate',
      'knowledgeable', 'friendly staff', 'clean', 'efficient',
      'thorough', 'respectful', 'recommend'
    ];

    const negativeHealthcareTerms = [
      'waited too long', 'rude staff', 'unprofessional', 'dirty',
      'rushed', 'dismissive', 'poor communication', 'expensive',
      'billing issues', 'uncomfortable', 'avoid'
    ];

    const lowerText = text.toLowerCase();
    let boost = 0;

    positiveHealthcareTerms.forEach(term => {
      if (lowerText.includes(term)) boost += 0.05;
    });

    negativeHealthcareTerms.forEach(term => {
      if (lowerText.includes(term)) boost += 0.05;
    });

    return Math.min(boost, 0.2);
  }

  /**
   * Preprocess text for better sentiment analysis
   * @param {string} text - Raw text
   * @returns {string} - Preprocessed text
   */
  preprocessText(text) {
    return text
      .trim()
      // Remove excessive punctuation
      .replace(/[!]{2,}/g, '!')
      .replace(/[?]{2,}/g, '?')
      .replace(/[.]{2,}/g, '.')
      // Limit text length for API efficiency
      .substring(0, 500);
  }

  /**
   * Fallback sentiment analysis using simple keyword matching
   * @param {string} text - Text to analyze
   * @returns {Object} - Basic sentiment result
   */
  fallbackSentimentAnalysis(text) {
    const positiveWords = [
      'excellent', 'great', 'good', 'amazing', 'wonderful', 'fantastic',
      'professional', 'caring', 'friendly', 'helpful', 'recommend',
      'satisfied', 'happy', 'pleased', 'comfortable'
    ];

    const negativeWords = [
      'terrible', 'awful', 'bad', 'horrible', 'worst', 'hate',
      'rude', 'unprofessional', 'dirty', 'expensive', 'slow',
      'disappointed', 'frustrated', 'angry', 'avoid', 'never'
    ];

    const lowerText = text.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });

    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });

    let classification = 'neutral';
    let score = 0;
    let confidence = 0.3; // Lower confidence for fallback

    if (positiveCount > negativeCount) {
      classification = 'positive';
      score = positiveCount - negativeCount;
      confidence = Math.min(0.3 + (positiveCount * 0.1), 0.7);
    } else if (negativeCount > positiveCount) {
      classification = 'negative';
      score = -(negativeCount - positiveCount);
      confidence = Math.min(0.3 + (negativeCount * 0.1), 0.7);
    }

    return {
      score: score,
      classification: classification,
      confidence: confidence,
      ratingAdjustment: this.calculateRatingAdjustment(classification, confidence, text),
      originalText: text,
      fallback: true
    };
  }

  /**
   * Apply sentiment-adjusted rating to original star rating
   * @param {number} originalRating - Original star rating (1-5)
   * @param {Object} sentimentResult - Sentiment analysis result
   * @returns {number} - Adjusted rating (1-5)
   */
  applySentimentToRating(originalRating, sentimentResult) {
    const adjustedRating = originalRating + sentimentResult.ratingAdjustment;
    
    // Ensure rating stays within valid range
    return Math.max(1, Math.min(5, Math.round(adjustedRating * 10) / 10));
  }

  /**
   * Convert sentiment analysis directly to star rating (when no user rating provided)
   * @param {Object} sentimentResult - Sentiment analysis result
   * @returns {number} - Generated star rating (1-5)
   */
  sentimentToStarRating(sentimentResult) {
    const { classification, confidence, score } = sentimentResult;
    
    // Base rating on sentiment classification
    let baseRating = 3; // Default neutral rating
    
    switch (classification) {
      case 'very_positive':
        baseRating = 5;
        break;
      case 'positive':
        baseRating = 4;
        break;
      case 'neutral':
        baseRating = 3;
        break;
      case 'negative':
        baseRating = 2;
        break;
      case 'very_negative':
        baseRating = 1;
        break;
    }
    
    // Fine-tune based on confidence and score
    if (confidence > 0.8) {
      // High confidence - use exact classification
      return baseRating;
    } else if (confidence > 0.6) {
      // Medium confidence - slight adjustment towards neutral
      const adjustment = (3 - baseRating) * 0.2;
      baseRating += adjustment;
    } else {
      // Low confidence - move more towards neutral
      const adjustment = (3 - baseRating) * 0.4;
      baseRating += adjustment;
    }
    
    // Additional fine-tuning based on sentiment score
    if (Math.abs(score) > 1.5) {
      // Strong sentiment - boost away from neutral
      if (score > 0) {
        baseRating += 0.3;
      } else {
        baseRating -= 0.3;
      }
    }
    
    // Healthcare context adjustments
    const healthcareBoost = this.getHealthcareContextBoost(sentimentResult.originalText || '');
    if (healthcareBoost > 0.15) {
      // Strong healthcare context detected
      if (classification.includes('positive')) {
        baseRating += 0.2;
      } else if (classification.includes('negative')) {
        baseRating -= 0.2;
      }
    }
    
    // Ensure rating stays within valid range and round to one decimal
    return Math.max(1, Math.min(5, Math.round(baseRating * 10) / 10));
  }

  /**
   * Get sentiment statistics for multiple reviews
   * @param {Array} reviews - Array of reviews with sentiment data
   * @returns {Object} - Sentiment statistics
   */
  getSentimentStatistics(reviews) {
    if (!reviews || reviews.length === 0) {
      return {
        totalReviews: 0,
        averageSentiment: 0,
        sentimentDistribution: {
          very_positive: 0,
          positive: 0,
          neutral: 0,
          negative: 0,
          very_negative: 0
        },
        averageConfidence: 0
      };
    }

    const distribution = {
      very_positive: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      very_negative: 0
    };

    let totalSentiment = 0;
    let totalConfidence = 0;

    reviews.forEach(review => {
      if (review.sentimentAnalysis) {
        const { classification, score, confidence } = review.sentimentAnalysis;
        distribution[classification] = (distribution[classification] || 0) + 1;
        totalSentiment += score || 0;
        totalConfidence += confidence || 0;
      }
    });

    return {
      totalReviews: reviews.length,
      averageSentiment: totalSentiment / reviews.length,
      sentimentDistribution: distribution,
      averageConfidence: totalConfidence / reviews.length
    };
  }
}

// Export singleton instance
module.exports = new SentimentAnalysisService();