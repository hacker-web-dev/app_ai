import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Building, 
  MapPin, 
  Shield, 
  CheckCircle, 
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  MessageSquare,
  Star
} from 'lucide-react';
import StarRating from './StarRating';
import FeedbackModal from './FeedbackModal';

const PriceComparisionTable = ({ 
  providers = [], 
  pricingDetails = {}, 
  selectedService = "Healthcare Service",
  selectedInsurance = "", 
  isLoading = false,
  onViewPricing = () => {},
  onSubmitFeedback = () => {}
}) => {
  const [sortBy, setSortBy] = useState('distance');
  const [sortOrder, setSortOrder] = useState('asc');
  const [expandedProviders, setExpandedProviders] = useState({});
  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, provider: null });

  // Handle sort change
  const handleSortChange = (criteria) => {
    if (sortBy === criteria) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(criteria);
      setSortOrder('asc');
    }
  };

  // Toggle provider expanded state
  const toggleProviderExpanded = (providerId) => {
    setExpandedProviders(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
    
    // If not already loaded, load pricing data
    if (!pricingDetails[providerId] && onViewPricing) {
      onViewPricing(providerId);
    }
  };

  // Get best price for a provider
  const getBestPrice = (providerId) => {
    if (!pricingDetails[providerId]) return null;
    
    const details = pricingDetails[providerId];
    
    // Check if there are insurance options for the selected insurance
    if (selectedInsurance && details.insuranceOptions && details.insuranceOptions.length > 0) {
      const matchingOptions = details.insuranceOptions.filter(
        (opt) => opt.insurance === selectedInsurance
      );
      
      if (matchingOptions.length > 0) {
        // Find the cheapest option
        const cheapestOption = matchingOptions.reduce(
          (min, opt) => opt.negotiatedAmount < min.negotiatedAmount ? opt : min, 
          matchingOptions[0]
        );
        
        return {
          amount: cheapestOption.negotiatedAmount,
          insurance: true
        };
      }
    }
    
    // Fall back to standard charge
    return details.standardCharge 
      ? {
          amount: details.standardCharge.amount,
          insurance: false
        }
      : null;
  };

  // Get savings for a provider
  const getSavings = (providerId) => {
    if (!pricingDetails[providerId]) return null;
    
    const details = pricingDetails[providerId];
    
    // Need both standard charge and insurance options
    if (!details.standardCharge || !details.insuranceOptions || details.insuranceOptions.length === 0) {
      return null;
    }
    
    // Find matching insurance options
    let matchingOptions = details.insuranceOptions;
    if (selectedInsurance) {
      matchingOptions = details.insuranceOptions.filter(
        (opt) => opt.insurance === selectedInsurance
      );
      if (matchingOptions.length === 0) return null;
    }
    
    // Find cheapest option
    const cheapestOption = matchingOptions.reduce(
      (min, opt) => opt.negotiatedAmount < min.negotiatedAmount ? opt : min, 
      matchingOptions[0]
    );
    
    const savingsAmount = details.standardCharge.amount - cheapestOption.negotiatedAmount;
    if (savingsAmount <= 0) return null;
    
    const savingsPercentage = (savingsAmount / details.standardCharge.amount) * 100;
    
    return {
      amount: savingsAmount,
      percentage: savingsPercentage
    };
  };

  // Sort providers
  const sortedProviders = React.useMemo(() => {
    if (!providers || providers.length === 0) return [];
    
    return [...providers].sort((a, b) => {
      if (sortBy === 'distance') {
        const distanceA = parseFloat(a.distanceKm || 0);
        const distanceB = parseFloat(b.distanceKm || 0);
        return sortOrder === 'asc' ? distanceA - distanceB : distanceB - distanceA;
      } 
      
      if (sortBy === 'price') {
        const priceA = getBestPrice(a.id)?.amount || Infinity;
        const priceB = getBestPrice(b.id)?.amount || Infinity;
        return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
      }
      
      if (sortBy === 'rating') {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return sortOrder === 'asc' ? ratingA - ratingB : ratingB - ratingA;
      }
      
      if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      
      return 0;
    });
  }, [providers, sortBy, sortOrder, pricingDetails]);

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
        <div className="p-6 text-center">
          <XCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No providers found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            We couldn't find any providers for this service in your area. Please try a different service or location.
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
          {selectedService} - Comparison Results
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Found {providers.length} providers near you
        </p>
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
            sortBy === 'price' 
              ? 'bg-indigo-100 text-indigo-700 font-medium' 
              : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
          }`}
          onClick={() => handleSortChange('price')}
        >
          <DollarSign size={14} className="mr-1.5" />
          Price
          {sortBy === 'price' && (
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

      {/* Provider List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {sortedProviders.map((provider) => {
          const bestPrice = getBestPrice(provider.id);
          const savings = getSavings(provider.id);
          const isExpanded = expandedProviders[provider.id];
          
          return (
            <div 
              key={provider.id} 
              className={`transition-all duration-300 ${isExpanded ? 'bg-gray-50 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              {/* Provider Summary Row */}
              <div className="p-4 md:p-6 cursor-pointer"
                   onClick={() => toggleProviderExpanded(provider.id)}>
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex-1 mb-3 md:mb-0">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">{provider.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <div className="flex items-center">
                        <MapPin size={14} className="mr-1.5 flex-shrink-0" />
                        {provider.address?.city}, {provider.address?.state} • {provider.distanceKm} km away
                      </div>
                      {(provider.rating > 0 || provider.totalReviews > 0) && (
                        <StarRating 
                          rating={provider.rating || 0} 
                          totalReviews={provider.totalReviews || 0}
                          size="sm"
                          className="flex-shrink-0"
                        />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Price Display */}
                    <div className="flex flex-col items-center">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Price</p>
                      {!pricingDetails[provider.id] ? (
                        <div className="h-6 w-20 animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
                      ) : bestPrice ? (
                        <p className={`text-lg font-bold ${bestPrice.insurance ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                          ${bestPrice.amount.toFixed(2)}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Not available</p>
                      )}
                    </div>
                    
                    {/* Savings Badge */}
                    {savings && (
                      <div className="px-3 py-1 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg">
                        <p className="text-xs text-green-800 dark:text-green-400 font-medium">Save {savings.percentage.toFixed(0)}%</p>
                        <p className="text-sm font-bold text-green-700 dark:text-green-400">${savings.amount.toFixed(2)}</p>
                      </div>
                    )}
                    
                    {/* Feedback Button */}
                    <button 
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFeedbackModal({ isOpen: true, provider });
                      }}
                      title="Leave feedback"
                    >
                      <MessageSquare size={16} />
                    </button>
                    
                    {/* Expand/Collapse Button */}
                    <button 
                      className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                        isExpanded 
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                          : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProviderExpanded(provider.id);
                      }}
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-6 md:px-6 animate-fadeIn">
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    {!pricingDetails[provider.id] ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <span className="ml-3 text-gray-600 dark:text-gray-300">Loading pricing details...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Standard Price Column */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Standard Price</h5>
                          {pricingDetails[provider.id].standardCharge ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                ${pricingDetails[provider.id].standardCharge.amount.toFixed(2)}
                              </p>
                              <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <Shield size={14} className="mr-1.5" />
                                Without insurance • {pricingDetails[provider.id].standardCharge.setting}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                              <p className="text-gray-500 dark:text-gray-400 italic">No standard pricing available</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Insurance Options Column */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            {selectedInsurance 
                              ? `${selectedInsurance} Insurance Plans`
                              : 'Insurance Options'}
                          </h5>
                          
                          {pricingDetails[provider.id].insuranceOptions && 
                           pricingDetails[provider.id].insuranceOptions.length > 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                              <div className="divide-y divide-gray-100 dark:divide-gray-600">
                                {(selectedInsurance 
                                  ? pricingDetails[provider.id].insuranceOptions.filter(
                                      (opt) => opt.insurance === selectedInsurance
                                    )
                                  : pricingDetails[provider.id].insuranceOptions.slice(0, 3)
                                ).map((option, index) => (
                                  <div key={index} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-medium text-gray-800 dark:text-white">{option.insurance}</span>
                                      <span className="text-lg font-bold text-indigo-600">
                                        ${option.negotiatedAmount.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500 dark:text-gray-400">{option.plan}</span>
                                      {option.savingsPercentage && (
                                        <span className="text-green-600 font-medium">
                                          {option.savingsPercentage}% off
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      Setting: {option.setting}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              {!selectedInsurance && pricingDetails[provider.id].insuranceOptions.length > 3 && (
                                <div className="bg-gray-50 dark:bg-gray-700 p-2 text-center">
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    +{pricingDetails[provider.id].insuranceOptions.length - 3} more options
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                              <p className="text-gray-500 dark:text-gray-400 italic">No insurance options available</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        provider={feedbackModal.provider}
        service={selectedService}
        onClose={() => setFeedbackModal({ isOpen: false, provider: null })}
        onSubmit={async (feedbackData) => {
          await onSubmitFeedback(feedbackData);
          setFeedbackModal({ isOpen: false, provider: null });
        }}
      />
    </div>
  );
};

export default PriceComparisionTable;