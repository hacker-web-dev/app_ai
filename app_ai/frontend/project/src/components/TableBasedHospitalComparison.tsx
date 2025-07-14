import React, { useState } from 'react';
import { Star, Calendar, ChevronDown, ChevronUp, DollarSign, Info } from 'lucide-react';

const TableBasedHospitalComparison = ({ 
  providers = [], 
  selectedInsurance = "",
  service = "",
  onBookAppointment = () => {}
}) => {
  const [expandedRows, setExpandedRows] = useState({});

  // Toggle expanded row
  const toggleRowExpanded = (providerId) => {
    setExpandedRows(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  };

  // Render star rating
  const renderRating = (rating) => {
    if (!rating) return 'No Rating';
    
    rating = parseFloat(rating);
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={i < fullStars ? "text-yellow-400" : "text-gray-300"}>
            <Star size={16} fill={i < fullStars ? "currentColor" : (i === fullStars && hasHalfStar ? "url(#halfStar)" : "none")} />
          </span>
        ))}
        <span className="ml-1 text-sm font-medium text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Sort providers by rating
  const sortedByRating = [...providers].sort((a, b) => {
    const ratingA = parseFloat(a.hospitalRating || 0);
    const ratingB = parseFloat(b.hospitalRating || 0);
    return ratingB - ratingA; // Higher ratings first
  });

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return 'N/A';
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculate savings
  const calculateSavings = (standard, negotiated) => {
    if (standard === null || negotiated === null || isNaN(standard) || isNaN(negotiated)) return null;
    return standard - negotiated;
  };

  // Calculate savings percentage
  const calculateSavingsPercentage = (standard, savings) => {
    if (standard === null || savings === null || standard === 0) return null;
    return (savings / standard) * 100;
  };

  // Get standard charge for a provider
  const getStandardCharge = (provider) => {
    if (!provider.insuranceOptions || provider.insuranceOptions.length === 0) return null;
    
    // Find the first option with a standard charge
    const option = provider.insuranceOptions.find(opt => opt.standardCharge !== null && opt.standardCharge !== undefined);
    return option ? option.standardCharge : null;
  };

  if (!providers || providers.length === 0) {
    return (
      <div className="rounded-xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No providers selected</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Please select providers to compare.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Provider Comparison for {service}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Sorted by hospital rating - highest rated shown first
          </p>
        </div>
        
        {/* Hospital Comparison Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Hospital
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rating
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Address
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Distance
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Standard Price
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Insurance Options
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedByRating.map((provider, index) => {
                // Get standard charge (cash price)
                const standardCharge = getStandardCharge(provider);
                const formattedStandardCharge = formatCurrency(standardCharge);
                
                // Format address
                const address = provider.address 
                  ? [provider.address.city, provider.address.state].filter(Boolean).join(', ')
                  : 'N/A';
                
                // Count of insurance options
                const insuranceOptionsCount = provider.insuranceOptions ? 
                  provider.insuranceOptions.filter(opt => opt.insurance !== 'N/A').length : 0;
                
                // Is row expanded
                const isExpanded = expandedRows[provider.id] || false;
                
                return (
                  <React.Fragment key={provider.id}>
                    {/* Main row */}
                    <tr className={`${index === 0 ? "bg-indigo-50 dark:bg-indigo-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-700"} cursor-pointer`} 
                       onClick={() => toggleRowExpanded(provider.id)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{provider.hospitalName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{provider.hospitalType || 'Healthcare Provider'}</div>
                            {index === 0 && (
                              <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                Top Rated
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderRating(provider.hospitalRating)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{address}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{(provider.distance * 0.621371).toFixed(1)} miles</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{formattedStandardCharge}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-700 dark:text-gray-300 mr-2">{insuranceOptionsCount} options</span>
                          {isExpanded ? 
                            <ChevronUp size={16} className="text-gray-400" /> : 
                            <ChevronDown size={16} className="text-gray-400" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onBookAppointment(provider.id);
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <Calendar className="mr-1.5 h-3.5 w-3.5" />
                          Book
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded insurance details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                          <div className="overflow-hidden">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Insurance Options</h4>
                            
                            {provider.insuranceOptions && provider.insuranceOptions.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                                  <thead className="bg-gray-100 dark:bg-gray-600">
                                    <tr>
                                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Insurance
                                      </th>
                                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Plan
                                      </th>
                                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Standard Price
                                      </th>
                                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Negotiated Price
                                      </th>
                                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Savings
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {provider.insuranceOptions
                                      .filter(option => option.insurance !== 'N/A')
                                      .map((option, idx) => {
                                        const savings = calculateSavings(option.standardCharge, option.negotiatedAmount);
                                        const savingsPercentage = calculateSavingsPercentage(option.standardCharge, savings);
                                        
                                        // Check if this is the selected insurance
                                        const isSelectedInsurance = selectedInsurance && 
                                          option.insurance.toLowerCase() === selectedInsurance.toLowerCase();
                                          
                                        return (
                                          <tr key={idx} className={`${isSelectedInsurance ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                              <div className="flex items-center">
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{option.insurance}</span>
                                                {isSelectedInsurance && (
                                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                    Selected
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                              {option.planName !== 'N/A' ? option.planName : '-'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                              {formatCurrency(option.standardCharge)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                              {formatCurrency(option.negotiatedAmount)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                              {savings > 0 ? (
                                                <div className="text-sm text-green-600 font-medium">
                                                  {formatCurrency(savings)}
                                                  {savingsPercentage && (
                                                    <span className="ml-1 text-xs">
                                                      ({savingsPercentage.toFixed(0)}%)
                                                    </span>
                                                  )}
                                                </div>
                                              ) : (
                                                <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                                No specific insurance information available for this provider.
                              </div>
                            )}
                            
                            {/* Accepted Insurance Display */}
                            {provider.acceptedInsurance && provider.acceptedInsurance.length > 0 && (
                              <div className="mt-4">
                                <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Accepted Insurance Plans:</h5>
                                <div className="flex flex-wrap gap-1">
                                  {provider.acceptedInsurance.map((insurance, idx) => (
                                    <span
                                      key={idx}
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                        selectedInsurance && insurance.toLowerCase() === selectedInsurance.toLowerCase()
                                          ? 'bg-indigo-100 text-indigo-800'
                                          : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                      }`}
                                    >
                                      {insurance}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Service Details */}
                            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                              <div className="flex items-center">
                                <Info size={12} className="mr-1" />
                                <span>Service: {service} • Setting: {provider.service?.setting || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Service Details */}
        
      </div>
    </div>
  );
};

export default TableBasedHospitalComparison;