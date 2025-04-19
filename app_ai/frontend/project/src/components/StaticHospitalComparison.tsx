import React from 'react';
import { Star, Calendar, Info } from 'lucide-react';

const StaticHospitalComparison = ({ 
  providers = [], 
  selectedInsurance = "",
  service = "",
  onBookAppointment = () => {}
}) => {
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
    const option = provider.insuranceOptions.find(opt => opt.standardCharge !== null && opt.standardCharge !== undefined);
    return option ? option.standardCharge : null;
  };

  if (!providers || providers.length === 0) {
    return (
      <div className="rounded-xl bg-white shadow-lg overflow-hidden">
        <div className="p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No providers selected</h3>
          <p className="text-gray-500">
            Please select providers to compare.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white shadow-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Provider Comparison for {service}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Sorted by hospital rating - highest rated shown first
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hospital
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distance
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Standard Price
                </th>
                {selectedInsurance && (
                  <>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {selectedInsurance} Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Savings
                    </th>
                  </>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedByRating.map((provider, index) => {
                const standardCharge = getStandardCharge(provider);
                const formattedStandardCharge = formatCurrency(standardCharge);
                const address = provider.address 
                  ? [provider.address.city, provider.address.state].filter(Boolean).join(', ')
                  : 'N/A';
                let insurancePrice = 'N/A';
                let savings = null;
                let savingsPercentage = null;

                if (selectedInsurance && provider.insuranceOptions) {
                  const insuranceOption = provider.insuranceOptions.find(
                    option => option.insurance && option.insurance.toLowerCase() === selectedInsurance.toLowerCase()
                  );
                  if (insuranceOption && insuranceOption.negotiatedAmount) {
                    insurancePrice = formatCurrency(insuranceOption.negotiatedAmount);
                    savings = calculateSavings(standardCharge, insuranceOption.negotiatedAmount);
                    savingsPercentage = calculateSavingsPercentage(standardCharge, savings);
                  }
                }

                return (
                  <>
                    <tr key={provider.id} className={index === 0 ? "bg-indigo-50" : "hover:bg-gray-50"}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{provider.hospitalName}</div>
                            <div className="text-sm text-gray-500">{provider.hospitalType || 'Healthcare Provider'}</div>
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
                        <div className="text-sm text-gray-900">{address}</div>
                        {provider.address?.street && (
                          <div className="text-xs text-gray-500">{provider.address.street}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{(provider.distance * 0.621371).toFixed(1)} miles</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formattedStandardCharge}</div>
                      </td>
                      {selectedInsurance && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-indigo-600">{insurancePrice}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
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
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => onBookAppointment(provider.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <Calendar className="mr-1.5 h-3.5 w-3.5" />
                          Book
                        </button>
                      </td>
                    </tr>
                    {provider.insuranceOptions && provider.insuranceOptions.length > 0 && (
                      <tr>
                        <td colSpan={selectedInsurance ? 8 : 5} className="px-6 py-4 bg-gray-50">
                          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insurance</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Standard Price</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Negotiated Price</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Savings</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Setting</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {provider.insuranceOptions
                                .filter(option => option.insurance !== 'N/A')
                                .map((option, idx) => {
                                  const savings = calculateSavings(option.standardCharge, option.negotiatedAmount);
                                  const savingsPercentage = calculateSavingsPercentage(option.standardCharge, savings);
                                  const isSelectedInsurance = selectedInsurance && 
                                    option.insurance.toLowerCase() === selectedInsurance.toLowerCase();
                                  return (
                                    <tr key={idx} className={isSelectedInsurance ? 'bg-indigo-50' : ''}>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center">
                                          <span className="text-sm font-medium text-gray-900">{option.insurance}</span>
                                          {isSelectedInsurance && (
                                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                              Selected
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                        {option.planName !== 'N/A' ? option.planName : '-'}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                        {formatCurrency(option.standardCharge)}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-indigo-600">
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
                                          <span className="text-sm text-gray-500">-</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                        {provider.service?.setting || 'N/A'}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
        
        
      </div>
    </div>
  );
};

export default StaticHospitalComparison;