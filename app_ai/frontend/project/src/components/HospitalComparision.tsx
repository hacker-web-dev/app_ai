import React, { useState } from 'react';
import { 
  Building, 
  MapPin, 
  Star, 
  DollarSign, 
  Shield, 
  Calendar,
  ChevronDown,
  ChevronUp,
  Award,
  Check
} from 'lucide-react';

const HospitalComparison = ({ 
  providers = [], 
  selectedInsurance = "",
  service = "",
  onBookAppointment = () => {}
}) => {
  const [expandedProviders, setExpandedProviders] = useState({});

  // Toggle expanded provider details
  const toggleProviderExpanded = (providerId) => {
    setExpandedProviders(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  };

  // Get insurance price info for a provider
  const getInsurancePriceInfo = (provider) => {
    if (!provider.insuranceOptions || provider.insuranceOptions.length === 0) {
      return { price: 'N/A', savings: 'N/A', savingsPercent: 'N/A' };
    }

    // For no insurance case, return standard charge
    if (!selectedInsurance) {
      const standardOption = provider.insuranceOptions.find(opt => opt.standardCharge);
      return {
        price: standardOption?.standardCharge 
          ? `$${standardOption.standardCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : 'N/A',
        savings: 'N/A',
        savingsPercent: 'N/A'
      };
    }

    // Find the insurance option matching the selected insurance
    const insuranceOption = provider.insuranceOptions.find(
      option => option.insurance && option.insurance.toLowerCase() === selectedInsurance.toLowerCase()
    );

    if (!insuranceOption) {
      // Check if this provider accepts this insurance
      const acceptsInsurance = provider.acceptedInsurance?.some(
        ins => ins && ins.toLowerCase() === selectedInsurance.toLowerCase()
      );
      return acceptsInsurance ?
        { price: 'Call for Price', savings: 'N/A', savingsPercent: 'N/A' } :
        { price: 'Not Covered', savings: 'N/A', savingsPercent: 'N/A' };
    }

    const price = insuranceOption.negotiatedAmount !== null
      ? `$${insuranceOption.negotiatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : 'N/A';

    const savings = insuranceOption.savings !== null
      ? `$${insuranceOption.savings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : 'N/A';

    // Calculate savings percent
    let savingsPercent = 'N/A';
    if (insuranceOption.savings !== null && insuranceOption.standardCharge !== null && insuranceOption.standardCharge > 0) {
      const percent = (insuranceOption.savings / insuranceOption.standardCharge) * 100;
      savingsPercent = `${percent.toFixed(0)}%`;
    }

    return { price, savings, savingsPercent };
  };

  // Get cash price for a provider
  const getCashPrice = (provider) => {
    if (!provider.insuranceOptions || provider.insuranceOptions.length === 0) {
      return 'N/A';
    }

    // Find the standard charge
    const standardOption = provider.insuranceOptions.find(
      opt => opt.standardCharge !== null
    );

    return standardOption?.standardCharge !== null
      ? `$${standardOption.standardCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : 'N/A';
  };

  // Format address
  const formatAddress = (address) => {
    if (!address) return 'N/A';
    const parts = [address.street, address.city, address.state, address.postalCode].filter(Boolean);
    return parts.join(', ') || 'N/A';
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

  // Get top rated hospital
  const topRatedHospital = sortedByRating.length > 0 ? sortedByRating[0] : null;

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
      {/* Top Rated Recommendation */}
      {topRatedHospital && (
        <div className="rounded-xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden border-2 border-indigo-500 dark:border-indigo-400">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 px-6 py-4 border-b border-indigo-100 dark:border-indigo-800 flex items-center">
            <Award className="h-6 w-6 text-indigo-600 mr-2" />
            <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-300">
              Top Rated Recommendation
            </h3>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Hospital Info */}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{topRatedHospital.hospitalName}</h3>
                <div className="flex items-center gap-1 text-gray-600 mb-2">
                  <Building size={16} className="flex-shrink-0" />
                  <span className="text-sm">{topRatedHospital.hospitalType || 'Healthcare Provider'}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600 mb-2">
                  <MapPin size={16} className="flex-shrink-0" />
                  <span className="text-sm">{formatAddress(topRatedHospital.address)}</span>
                </div>
                <div className="mb-3">
                  {renderRating(topRatedHospital.hospitalRating)}
                </div>
                <div className="text-sm text-indigo-600 font-medium">
                  Distance: {(topRatedHospital.distance * 0.621371).toFixed(1)} miles
                </div>
              </div>
              
              {/* Pricing Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 font-medium mb-1">Cash Price</div>
                  <div className="text-lg font-bold text-gray-900">{getCashPrice(topRatedHospital)}</div>
                </div>
                
                {selectedInsurance && (
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 font-medium mb-1">{selectedInsurance} Price</div>
                    <div className="text-lg font-bold text-indigo-600">
                      {getInsurancePriceInfo(topRatedHospital).price}
                    </div>
                    {getInsurancePriceInfo(topRatedHospital).savings !== 'N/A' && (
                      <div className="text-xs text-green-600">
                        Save {getInsurancePriceInfo(topRatedHospital).savings}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Book Appointment Button */}
              <div>
                <button
                  onClick={() => onBookAppointment(topRatedHospital.id)}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
                >
                  <Calendar size={16} className="mr-2" />
                  Book Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="rounded-xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Provider Comparison for {service}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Compare pricing and details across {providers.length} providers
          </p>
        </div>
        
        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Provider
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rating
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Distance
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cash Price
                </th>
                {selectedInsurance && (
                  <>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {selectedInsurance} Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Savings
                    </th>
                  </>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {providers.map((provider) => {
                const { price: insurancePrice, savings: insuranceSavings, savingsPercent } = 
                  getInsurancePriceInfo(provider);
                
                return (
                  <React.Fragment key={provider.id}>
                    <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${provider.id === topRatedHospital?.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <Building className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{provider.hospitalName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{provider.hospitalType || 'N/A'}</div>
                          </div>
                          {provider.id === topRatedHospital?.id && (
                            <div className="ml-2 flex-shrink-0">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                                Top Rated
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderRating(provider.hospitalRating)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {(provider.distance * 0.621371).toFixed(1)} mi
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{getCashPrice(provider)}</div>
                      </td>
                      {selectedInsurance && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{insurancePrice}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {insuranceSavings !== 'N/A' ? (
                              <div className="text-sm text-green-600">
                                {insuranceSavings} ({savingsPercent})
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                            )}
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => onBookAppointment(provider.id)}
                          className="px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-sm font-medium transition-colors flex items-center"
                        >
                          <Calendar size={14} className="mr-1.5" />
                          Book
                        </button>
                      </td>
                    </tr>
                    <tr className={`border-t border-gray-100 dark:border-gray-700 ${expandedProviders[provider.id] ? 'bg-gray-50 dark:bg-gray-700' : 'hidden'}`}>
                      <td colSpan={selectedInsurance ? 7 : 5} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Provider Details */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Provider Details</h4>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600 text-sm space-y-2">
                              <div>
                                <span className="font-medium text-gray-600 dark:text-gray-300">Address:</span>
                                <span className="ml-2 text-gray-800 dark:text-gray-200">{formatAddress(provider.address)}</span>
                              </div>
                              {provider.contact?.phone && (
                                <div>
                                  <span className="font-medium text-gray-600 dark:text-gray-300">Phone:</span>
                                  <span className="ml-2 text-gray-800 dark:text-gray-200">{provider.contact.phone}</span>
                                </div>
                              )}
                              {provider.contact?.website && (
                                <div>
                                  <span className="font-medium text-gray-600">Website:</span>
                                  <a
                                    href={provider.contact.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-indigo-600 hover:text-indigo-800 break-all"
                                  >
                                    {provider.contact.website}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Insurance Details */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Insurance Details</h4>
                            <div className="bg-white rounded-lg p-3 border border-gray-200 text-sm">
                              {provider.acceptedInsurance && provider.acceptedInsurance.length > 0 ? (
                                <div>
                                  <div className="font-medium text-gray-600 mb-2">Accepted Insurance:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {provider.acceptedInsurance.map((insurance, idx) => (
                                      <span
                                        key={idx}
                                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                          selectedInsurance && insurance.toLowerCase() === selectedInsurance.toLowerCase()
                                            ? 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200'
                                            : 'bg-gray-100 text-gray-700 ring-1 ring-gray-200'
                                        }`}
                                      >
                                        {insurance}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-gray-500 italic">No insurance information available</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr className={`${expandedProviders[provider.id] ? '' : 'hidden'}`}>
                      <td colSpan={selectedInsurance ? 7 : 5} className="px-6 py-2 bg-gray-50 border-t border-gray-100">
                        <button
                          onClick={() => toggleProviderExpanded(provider.id)}
                          className="flex items-center justify-center w-full text-sm text-gray-500 hover:text-gray-700"
                        >
                          <ChevronUp size={16} className="mr-1" />
                          Show Less
                        </button>
                      </td>
                    </tr>
                    {!expandedProviders[provider.id] && (
                      <tr className="border-t border-gray-100">
                        <td colSpan={selectedInsurance ? 7 : 5} className="px-6 py-2">
                          <button
                            onClick={() => toggleProviderExpanded(provider.id)}
                            className="flex items-center justify-center w-full text-sm text-gray-500 hover:text-gray-700"
                          >
                            <ChevronDown size={16} className="mr-1" />
                            Show More
                          </button>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HospitalComparison;