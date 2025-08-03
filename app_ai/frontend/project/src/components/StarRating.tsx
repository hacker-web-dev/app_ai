import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  totalReviews?: number;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  totalReviews,
  size = 'md',
  showText = true,
  className = ''
}) => {
  const sizes = {
    sm: 14,
    md: 16,
    lg: 20
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const starSize = sizes[size];
  const textSize = textSizes[size];

  // Round rating to 1 decimal place
  const roundedRating = Math.round(rating * 10) / 10;

  // Generate stars array
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const isFilled = i <= roundedRating;
    const isHalfFilled = i > roundedRating && i - 0.5 <= roundedRating;
    
    stars.push(
      <Star
        key={i}
        size={starSize}
        className={`${
          isFilled 
            ? 'text-yellow-400 fill-yellow-400' 
            : isHalfFilled
            ? 'text-yellow-400 fill-yellow-400 opacity-50'
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex">
        {stars}
      </div>
      {showText && (
        <div className={`${textSize} text-gray-600 dark:text-gray-300 ml-1`}>
          <span className="font-medium">{roundedRating}</span>
          {totalReviews !== undefined && (
            <span className="text-gray-500 dark:text-gray-400">
              {' '}({totalReviews} review{totalReviews !== 1 ? 's' : ''})
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StarRating;