import React, { useState, useEffect } from 'react';
import { Star, MessageCircle, X, User, Calendar, ThumbsUp, ThumbsDown, Meh } from 'lucide-react';

interface Review {
  id: string;
  providerId: string;
  service: string;
  rating?: number;
  finalRating: number;
  adjustedRating?: number;
  review: string;
  userId: string;
  isRatingGenerated: boolean;
  timestamp: any;
  createdAt: string;
  sentimentAnalysis?: {
    classification: string;
    confidence: number;
    sentiment: string;
  };
}

interface FeedbackDisplayProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
  providerName: string;
  service: string;
  onRatingsUpdate?: () => void;
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({
  isOpen,
  onClose,
  providerId,
  providerName,
  service,
  onRatingsUpdate
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ratings, setRatings] = useState<any>(null);

  // Load reviews when modal opens - always fresh data
  useEffect(() => {
    if (isOpen && providerId) {
      // Add timestamp to force fresh data
      setTimeout(() => {
        loadReviews();
        loadRatings();
      }, 100);
    }
  }, [isOpen, providerId, service]);

  const loadReviews = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`http://localhost:3000/api/providers/${providerId}/reviews?service=${service}&limit=20`);
      if (!response.ok) {
        throw new Error('Failed to load reviews');
      }
      
      const data = await response.json();
      setReviews(data.data || []);
    } catch (err) {
      setError('Failed to load reviews');
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRatings = async () => {
    try {
      console.log(`Loading ratings for provider: ${providerId}, service: ${service}`);
      const response = await fetch(`http://localhost:3000/api/providers/${providerId}/ratings?service=${service}`);
      if (!response.ok) {
        throw new Error('Failed to load ratings');
      }
      
      const data = await response.json();
      console.log('Ratings data received:', data.data);
      setRatings(data.data || null);
    } catch (err) {
      console.error('Error loading ratings:', err);
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < fullStars ? "text-yellow-400 fill-yellow-400" : "text-gray-300 dark:text-gray-600"}
          />
        ))}
        <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const getSentimentIcon = (sentiment?: string) => {
    if (!sentiment) return <Meh size={16} className="text-gray-500" />;
    
    switch (sentiment.toLowerCase()) {
      case 'positive':
      case 'very_positive':
        return <ThumbsUp size={16} className="text-green-500" />;
      case 'negative':
      case 'very_negative':
        return <ThumbsDown size={16} className="text-red-500" />;
      default:
        return <Meh size={16} className="text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    if (!sentiment) return 'bg-gray-50 border-gray-200 text-gray-800';
    
    switch (sentiment.toLowerCase()) {
      case 'positive':
      case 'very_positive':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'negative':
      case 'very_negative':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'Recent';
    
    try {
      let date;
      if (timestamp.toDate) {
        date = timestamp.toDate();
      } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp._seconds) {
        date = new Date(timestamp._seconds * 1000);
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else {
        date = new Date(timestamp);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Recent';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Recent';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Patient Reviews & Feedback
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {providerName} - {service}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Rating Summary */}
          {ratings && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center mb-2">
                    {renderStars(ratings.averageRating)}
                    <span className="ml-3 text-sm text-gray-600 dark:text-gray-300">
                      Based on {ratings.totalReviews} review{ratings.totalReviews !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Rating Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-sm">
                {[5, 4, 3, 2, 1].map(stars => (
                  <div key={stars} className="flex items-center">
                    <span className="w-3 text-gray-600 dark:text-gray-300">{stars}</span>
                    <Star size={12} className="text-gray-400 mx-1" />
                    <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mx-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full" 
                        style={{ 
                          width: `${ratings.totalReviews > 0 ? (ratings.ratingDistribution[stars] / ratings.totalReviews) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 text-xs w-6">
                      {ratings.ratingDistribution[stars] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-300">Loading reviews...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">{error}</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No reviews yet for this service.</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Be the first to share your experience!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                          <User size={16} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {review.userId === 'anonymous' ? 'Anonymous Patient' : `User ${review.userId.substring(0, 8)}`}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <Calendar size={12} className="mr-1" />
                            {formatDate(review.timestamp)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Rating and Sentiment */}
                      <div className="flex flex-col items-end">
                        {review.finalRating && renderStars(review.finalRating)}
                        {review.isRatingGenerated && (
                          <span className="text-xs text-blue-600 mt-1">Auto-Generated</span>
                        )}
                        {review.sentimentAnalysis && (
                          <div className={`mt-2 px-2 py-1 rounded-full text-xs border flex items-center ${getSentimentColor(review.sentimentAnalysis.sentiment || review.sentimentAnalysis.classification)}`}>
                            {getSentimentIcon(review.sentimentAnalysis.sentiment || review.sentimentAnalysis.classification)}
                            <span className="ml-1 capitalize">{review.sentimentAnalysis.sentiment || review.sentimentAnalysis.classification || 'neutral'}</span>
                            <span className="ml-1">({Math.round((review.sentimentAnalysis.confidence || 0) * 100)}%)</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Review Text */}
                    {review.review && (
                      <div className="mt-3">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{review.review}</p>
                      </div>
                    )}
                    
                    {/* Rating Info */}
                    <div className="mt-3 flex items-center text-xs text-gray-500 dark:text-gray-400">
                      {review.rating && review.adjustedRating && review.rating !== review.adjustedRating && (
                        <div className="flex items-center">
                          <span>Original: {review.rating}★</span>
                          <span className="mx-2">→</span>
                          <span>Adjusted: {review.adjustedRating.toFixed(1)}★</span>
                        </div>
                      )}
                      {review.isRatingGenerated && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Rating generated from review text
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDisplay;