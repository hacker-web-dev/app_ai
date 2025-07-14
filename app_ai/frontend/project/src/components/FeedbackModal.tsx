import React, { useState } from 'react';
import { Star, X, Send, AlertCircle } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: {
    id: string;
    name: string;
  };
  service: string;
  onSubmit: (feedbackData: {
    providerId: string;
    service: string;
    rating?: number;
    review: string;
  }) => Promise<void>;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  provider,
  service,
  onSubmit
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that either rating or review is provided
    if (rating === 0 && review.trim().length === 0) {
      setError('Please provide either a rating or write a review');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const feedbackData = {
        providerId: provider.id,
        service,
        review: review.trim()
      };

      // Only include rating if it was provided
      if (rating > 0) {
        feedbackData.rating = rating;
      }

      await onSubmit(feedbackData);
      
      // Reset form
      setRating(0);
      setReview('');
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingClick = (selectedRating: number) => {
    // Allow toggling off rating by clicking the same star
    if (selectedRating === rating) {
      setRating(0);
    } else {
      setRating(selectedRating);
    }
    setError('');
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
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Share Your Feedback
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Provider Info */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                {provider.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Service: {service}
              </p>
            </div>

            {/* Info Banner */}
            <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-400">
                💡 <strong>Flexible Feedback:</strong> You can provide a star rating, write a review, or both! 
                If you only write a review, we'll analyze your comments to generate an appropriate rating.
              </p>
            </div>

            {/* Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                How would you rate this provider? (optional)
              </label>
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="p-1 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => handleRatingClick(star)}
                    disabled={isSubmitting}
                  >
                    <Star
                      size={32}
                      className={`transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {rating > 0 ? (
                  <span>
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent'}
                    <span className="text-gray-400 dark:text-gray-500 ml-2">(Click same star to remove)</span>
                  </span>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">
                    No rating selected - we'll generate one from your written feedback
                  </span>
                )}
              </div>
            </div>

            {/* Review */}
            <div className="mb-6">
              <label 
                htmlFor="review" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Share your experience {rating === 0 ? '(required if no rating)' : '(optional)'}
              </label>
              <textarea
                id="review"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={rating === 0 ? "Tell others about your experience with this provider... (We'll generate a rating from your comments)" : "Tell others about your experience with this provider..."}
                value={review}
                onChange={(e) => {
                  setReview(e.target.value);
                  setError(''); // Clear error when user starts typing
                }}
                maxLength={500}
                disabled={isSubmitting}
              />
              <div className="text-sm text-gray-500 dark:text-gray-400 text-right mt-1">
                {review.length}/500
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
                <AlertCircle size={16} className="text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
                <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={isSubmitting || (rating === 0 && review.trim().length === 0)}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={16} className="mr-2" />
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;