const { InferenceClient } = require("@huggingface/inference");

class SentimentAnalysisService {
  constructor() {
    this.client = new InferenceClient("");
  }

  /**
   * Legacy method - now calls commentToStarRating
   * @param {string} text - Review text to analyze
   * @returns {Promise<Object>} - Sentiment analysis result
   */
  async analyzeSentiment(text) {
    const rating = await this.commentToStarRating(text);
    
    // Return in old format for compatibility
    return {
      score: rating - 3, // Convert to -2 to +2 range
      classification: rating >= 4 ? 'positive' : rating <= 2 ? 'negative' : 'neutral',
      confidence: 0.8,
      ratingAdjustment: 0
    };
  }

  /**
   * Apply sentiment-adjusted rating to original star rating
   * @param {number} originalRating - Original star rating (1-5)
   * @param {Object} sentimentResult - Sentiment analysis result
   * @returns {number} - Adjusted rating (1-5)
   */
  applySentimentToRating(originalRating, sentimentResult) {
    return originalRating; // No adjustment needed as we use AI rating directly
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

    reviews.forEach(review => {
      if (review.sentimentAnalysis) {
        const { classification } = review.sentimentAnalysis;
        distribution[classification] = (distribution[classification] || 0) + 1;
      }
    });

    return {
      totalReviews: reviews.length,
      averageSentiment: 0,
      sentimentDistribution: distribution,
      averageConfidence: 0.8
    };
  }

  /**
   * Convert comment text directly to star rating using AI model
   * @param {string} comment - Raw comment text
   * @returns {number} - Generated star rating (1-5)
   */
  async commentToStarRating(comment) {
    if (!comment || typeof comment !== 'string') {
      return 3;
    }

    try {
      const prompt = `Rate this healthcare review comment on a scale of 1-5 stars:

Comment: "${comment}"

Consider:
- Tone and sentiment
- Sarcasm detection (e.g., "good but I will never visit" = low rating)
- Intensity (e.g., "worst ever" = 1, "amazing" = 5)
- Healthcare context

Respond with only a number (1-5):`;

      const chatCompletion = await this.client.chatCompletion({
        provider: "featherless-ai",
        model: "Qwen/Qwen2-7B-Instruct",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 5,
        temperature: 0.1,
      });

      if (chatCompletion.choices && chatCompletion.choices[0] && chatCompletion.choices[0].message) {
        const generatedText = chatCompletion.choices[0].message.content.trim();
        const rating = parseFloat(generatedText.match(/\d+\.?\d*/)?.[0] || '3');
        return isNaN(rating) ? 3 : Math.max(1, Math.min(5, rating));
      }

      return 3;
    } catch (error) {
      console.error('AI rating error:', error.message);
      return 3;
    }
  }
}

module.exports = new SentimentAnalysisService();