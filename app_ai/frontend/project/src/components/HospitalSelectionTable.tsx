import React, { useState, useEffect } from 'react';
import { 
  Building, 
  MapPin, 
  Star, 
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Check,
  X,
  RefreshCw,
  Info,
  Eye,
  MessageCircle,
  Edit3
} from 'lucide-react';
import FeedbackModal from './FeedbackModal';
import FeedbackDisplay from './FeedbackDisplay';
import { useAuth } from '../authcontext';

const HospitalSelectionTable = ({ 
  providers = [], 
  isLoading = false,
  onSelectionChange = () => {},
  onViewSingleProvider = () => {}, // New callback for viewing a single provider
  maxDistanceFilter = 30,
  onMaxDistanceChange = () => {},
  currentService = '', // Add current service prop
  onRatingsUpdate = () => {} // Add callback for when ratings are updated
}) => {
  const [sortBy, setSortBy] = useState('rating'); // Default to rating sort
  const [sortOrder, setSortOrder] = useState('desc'); // Higher ratings first
  const [selectedProviders, setSelectedProviders] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, provider: null });
  const [feedbackDisplay, setFeedbackDisplay] = useState({ isOpen: false, provider: null });
  const { user } = useAuth();

  // Update selection when providers change
  useEffect(() => {
    if (providers.length > 0) {
      // Initialize selection state for new providers
      const initialSelection = {};
      providers.forEach(provider => {
        initialSelection[provider.id] = false;
      });
      setSelectedProviders(initialSelection);
      setSelectAll(false);
    }
  }, [providers]);

  // Handle sort change
  const handleSortChange = (criteria) => {
    if (sortBy === criteria) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(criteria);
      setSortOrder('asc');
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (providerId, event) => {
    // Prevent row click from triggering navigation
    if (event) {
      event.stopPropagation();
    }
    
    const newSelection = {
      ...selectedProviders,
      [providerId]: !selectedProviders[providerId]
    };
    
    setSelectedProviders(newSelection);
    
    // Notify parent component about selection changes
    // But don't trigger immediate navigation to comparison view
    const selectedIds = Object.keys(newSelection).filter(id => newSelection[id]);
    onSelectionChange(selectedIds, false); // Added a second parameter to control navigation
    
    // Update selectAll state
    const allSelected = Object.values(newSelection).every(Boolean);
    const noneSelected = Object.values(newSelection).every(value => !value);
    
    if (allSelected) {
      setSelectAll(true);
    } else if (noneSelected) {
      setSelectAll(false);
    }
  };

  // Handle single provider view
  const handleViewSingleProvider = (providerId, event) => {
    if (event) {
      event.stopPropagation();
    }
    onViewSingleProvider(providerId);
  };

  // Handle feedback modal
  const handleGiveFeedback = (provider, event) => {
    if (event) {
      event.stopPropagation();
    }
    setFeedbackModal({ isOpen: true, provider });
  };

  // Handle view feedback
  const handleViewFeedback = (provider, event) => {
    if (event) {
      event.stopPropagation();
    }
    setFeedbackDisplay({ isOpen: true, provider });
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      console.log('Submitting feedback:', feedbackData);
      const response = await fetch('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...feedbackData,
          userId: user?.uid || 'anonymous'
        })
      });

      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      // Close modal and refresh ratings
      setFeedbackModal({ isOpen: false, provider: null });
      
      // Trigger ratings update in parent component
      setTimeout(() => {
        onRatingsUpdate();
      }, 1000); // Small delay to allow backend processing
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  };

  // Handle select all checkbox change
  const handleSelectAllChange = () => {
    const newSelectAll = !selectAll;
    const newSelection = {};
    
    providers.forEach(provider => {
      newSelection[provider.id] = newSelectAll;
    });
    
    setSelectedProviders(newSelection);
    setSelectAll(newSelectAll);
    
    // Notify parent component about selection changes
    const selectedIds = newSelectAll ? Object.keys(newSelection) : [];
    onSelectionChange(selectedIds, false);
  };

  // Handle distance slider change
  const handleDistanceChange = (value) => {
    onMaxDistanceChange(value);
  };


  // Sort providers
  const sortedProviders = React.useMemo(() => {
    if (!providers || providers.length === 0) return [];
    
    return [...providers].sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'distance') {
        comparison = a.distance - b.distance;
      } else if (sortBy === 'rating') {
        const ratingA = parseFloat(a.hospitalRating || 0);
        const ratingB = parseFloat(b.hospitalRating || 0);
        comparison = ratingB - ratingA; // Higher ratings first
      } else if (sortBy === 'name') {
        comparison = a.hospitalName.localeCompare(b.hospitalName);
      } else if (sortBy === 'type') {
        comparison = (a.hospitalType || '').localeCompare(b.hospitalType || '');
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [providers, sortBy, sortOrder]);

  // Format address
  const formatAddress = (address) => {
    if (!address) return 'N/A';
    const parts = [address.city, address.state].filter(Boolean);
    return parts.join(', ') || 'N/A';
  };

  // Render star rating
  const renderRating = (rating, totalReviews = 0) => {
    if (!rating) return 'No Rating';
    
    rating = parseFloat(rating);
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex flex-col">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <span key={i} className={i < fullStars ? "text-yellow-400" : "text-gray-300"}>
              <Star size={16} fill={i < fullStars ? "currentColor" : (i === fullStars && hasHalfStar ? "url(#halfStar)" : "none")} />
            </span>
          ))}
          <span className="ml-1 text-sm font-medium text-gray-600">{rating.toFixed(1)}</span>
        </div>
        {totalReviews > 0 && (
          <span className="text-xs text-gray-500">({totalReviews} review{totalReviews !== 1 ? 's' : ''})</span>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="p-6 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!providers || providers.length === 0) {
    return (
      <div className="rounded-xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        {/* Distance Filter - Always visible even when no providers */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Available Healthcare Providers
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Adjust distance to find more providers
          </p>
        </div>
        
        {/* Distance Filter - Made more prominent */}
        <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/20">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex justify-between items-center">
              <span>Maximum Distance</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="1"
                max="100"
                value={maxDistanceFilter}
                onChange={(e) => handleDistanceChange(parseInt(e.target.value) || 1)}
                className="w-16 h-10 px-2 border border-gray-300 dark:border-gray-600 rounded-md text-center font-bold text-indigo-700 dark:text-indigo-400 bg-white dark:bg-gray-700"
              />
              <span className="text-gray-700 dark:text-gray-300">miles</span>
              <div className="w-full flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">1</span>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={maxDistanceFilter}
                  onChange={(e) => handleDistanceChange(parseInt(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm text-gray-500 font-medium">100</span>
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <button 
                onClick={() => onMaxDistanceChange(maxDistanceFilter)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="h-5 w-5" />
                Refresh Search
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-10 text-center">
          <X className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No providers found within {maxDistanceFilter} miles</h3>
          <p className="text-gray-500 mb-4">
            Try increasing your distance filter or search in a different location.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
      {/* Table Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Available Healthcare Providers
        </h3>
        <div className="flex flex-col md:flex-row justify-between md:items-center mt-1">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Select providers to compare ({Object.values(selectedProviders).filter(Boolean).length} selected)
          </p>
          <div className="mt-1 md:mt-0 text-sm text-indigo-600 dark:text-indigo-400 flex items-center">
            <Info size={14} className="mr-1" />
            Click on a provider's name to view detailed information
          </div>
        </div>
      </div>

      {/* Distance Filter */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter by Distance
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="100"
                value={maxDistanceFilter}
                onChange={(e) => handleDistanceChange(parseInt(e.target.value) || 1)}
                className="w-16 h-10 px-2 border border-gray-300 dark:border-gray-600 rounded-md text-center font-bold text-indigo-700 dark:text-indigo-400 bg-white dark:bg-gray-700"
              />
              <span className="text-gray-700 dark:text-gray-300">miles</span>
            </div>
          </div>
          <div className="w-full md:w-2/3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium">1 mi</span>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={maxDistanceFilter}
                onChange={(e) => handleDistanceChange(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-gray-600 font-medium">100 mi</span>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-right">
              Showing {sortedProviders.length} of {providers.length} providers within range
            </div>
          </div>
        </div>
      </div>

      {/* Table Controls */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Sort by:</span>
        
        <button 
          className={`px-3 py-1.5 rounded-full text-sm flex items-center ${
            sortBy === 'distance' 
              ? 'bg-indigo-100 text-indigo-700 font-medium' 
              : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
          }`}
          onClick={() => handleSortChange('distance')}
        >
          <MapPin size={14} className="mr-1.5" />
          Distance
          {sortBy === 'distance' && (
            sortOrder === 'asc' 
              ? <ChevronUp size={14} className="ml-1" />
              : <ChevronDown size={14} className="ml-1" />
          )}
        </button>
        
        <button 
          className={`px-3 py-1.5 rounded-full text-sm flex items-center ${
            sortBy === 'rating' 
              ? 'bg-indigo-100 text-indigo-700 font-medium' 
              : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
          }`}
          onClick={() => handleSortChange('rating')}
        >
          <Star size={14} className="mr-1.5" />
          Rating
          {sortBy === 'rating' && (
            sortOrder === 'asc' 
              ? <ChevronUp size={14} className="ml-1" />
              : <ChevronDown size={14} className="ml-1" />
          )}
        </button>
        
        <button 
          className={`px-3 py-1.5 rounded-full text-sm flex items-center ${
            sortBy === 'name' 
              ? 'bg-indigo-100 text-indigo-700 font-medium' 
              : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
          }`}
          onClick={() => handleSortChange('name')}
        >
          <Building size={14} className="mr-1.5" />
          Provider Name
          {sortBy === 'name' && (
            sortOrder === 'asc' 
              ? <ChevronUp size={14} className="ml-1" />
              : <ChevronDown size={14} className="ml-1" />
          )}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAllChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2">Select All</span>
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Provider
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Location
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Distance
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Rating
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedProviders.map((provider) => (
              <tr 
                key={provider.id} 
                className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedProviders[provider.id] ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                onClick={(e) => e.stopPropagation()} // Prevent row click from auto-selecting
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedProviders[provider.id] || false}
                    onChange={(e) => handleCheckboxChange(provider.id, e)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button 
                    onClick={(e) => handleViewSingleProvider(provider.id, e)}
                    className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 hover:underline focus:outline-none"
                  >
                    {provider.hospitalName}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-400">{provider.hospitalType || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-400">{formatAddress(provider.address)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-400">{(provider.distance * 0.621371).toFixed(1)} miles</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderRating(provider.hospitalRating, provider.totalReviews)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => handleViewSingleProvider(provider.id, e)}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                    >
                      <Eye size={14} className="mr-1" />
                      View Details
                    </button>
                    <button
                      onClick={(e) => handleViewFeedback(provider, e)}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                    >
                      <MessageCircle size={14} className="mr-1" />
                      View Feedback
                    </button>
                    <button
                      onClick={(e) => handleGiveFeedback(provider, e)}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                    >
                      <Edit3 size={14} className="mr-1" />
                      Give Feedback
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Button */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium">Tip:</span> Click on a provider's name to view detailed information about that provider
        </div>
        <button
          disabled={Object.values(selectedProviders).filter(Boolean).length === 0}
          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
          onClick={() => {
            const selectedIds = Object.keys(selectedProviders).filter(id => selectedProviders[id]);
            onSelectionChange(selectedIds, true); // Added parameter to explicitly trigger navigation
          }}
        >
          Compare Selected Providers
        </button>
      </div>

      {/* Feedback Modal */}
      {feedbackModal.isOpen && feedbackModal.provider && (
        <FeedbackModal
          isOpen={feedbackModal.isOpen}
          onClose={() => setFeedbackModal({ isOpen: false, provider: null })}
          provider={{
            id: feedbackModal.provider.hospitalId,
            name: feedbackModal.provider.hospitalName
          }}
          service={currentService}
          onSubmit={handleFeedbackSubmit}
        />
      )}

      {/* Feedback Display Modal */}
      {feedbackDisplay.isOpen && feedbackDisplay.provider && (
        <FeedbackDisplay
          isOpen={feedbackDisplay.isOpen}
          onClose={() => setFeedbackDisplay({ isOpen: false, provider: null })}
          providerId={feedbackDisplay.provider.hospitalId}
          providerName={feedbackDisplay.provider.hospitalName}
          service={currentService}
          onRatingsUpdate={onRatingsUpdate}
        />
      )}
    </div>
  );
};

export default HospitalSelectionTable;