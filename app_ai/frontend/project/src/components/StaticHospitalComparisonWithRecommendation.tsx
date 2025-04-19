import React from 'react';
import { Star, Calendar, Info, Award, MapPin, Building } from 'lucide-react';

const StaticHospitalComparisonWithRecommendation = ({ 
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
    
    // Find the first option with a standard charge
    const option = provider.insuranceOptions.find(opt => opt.standardCharge !== null && opt.standardCharge !== undefined);
    return option ? option.standardCharge : null;
  };
  
  // Format address
  const formatAddress = (address) => {
    if (!address) return 'N/A';
    const parts = [address.street, address.city, address.state, address.postalCode].filter(Boolean);
    return parts.join(', ') || 'N/A';
  };

  // Get top rated hospital
  const topRatedHospital = sortedByRating.length > 0 ? sortedByRating[0] : null;
  
  // Get insurance pricing for top rated hospital
  const getTopHospitalPricing = () => {
    if (!topRatedHospital) return { standard: 'N/A', insurance: 'N/A', savings: 'N/A' };
    
    const standardCharge = getStandardCharge(topRatedHospital);
    const standard = formatCurrency(standardCharge);
    
    if (!selectedInsurance) return { standard, insurance: 'N/A', savings: 'N/A' };
    
    const insuranceOption = topRatedHospital.insuranceOptions?.find(
      opt => opt.insurance.toLowerCase() === selectedInsurance.toLowerCase()
    );
    
    if (!insuranceOption || !insuranceOption.negotiatedAmount) {
      return { standard, insurance: 'N/A', savings: 'N/A' };
    }
    
    const insurance = formatCurrency(insuranceOption.negotiatedAmount);
    const savings = calculateSavings(standardCharge, insuranceOption.negotiatedAmount);
    const savingsFormatted = savings > 0 ? formatCurrency(savings) : 'N/A';
    
    return { standard, insurance, savings: savingsFormatted };
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

  const { standard, insurance, savings } = getTopHospitalPricing();

  return (
    <div className="space-y-6">
      {/* Top Recommendation Section */}
      {topRatedHospital && (
        <div className="rounded-xl bg-white shadow-lg overflow-hidden border-2 border-indigo-500">
          <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100">
            <div className="flex items-center">
              <Award className="h-6 w-6 text-indigo-600 mr-2" />
              <h3 className="text-lg font-semibold text-indigo-800">
                Top Rated Recommendation
              </h3>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{topRatedHospital.hospitalName}</h3>
                <div className="flex items-center mb-2">
                  {renderRating(topRatedHospital.hospitalRating)}
                </div>
                <div className="flex items-center gap-1 text-gray-600 mb-2">
                  <Building size={16} className="flex-shrink-0" />
                  <span className="text-sm">{topRatedHospital.hospitalType || 'Healthcare Provider'}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600 mb-2">
                  <MapPin size={16} className="flex-shrink-0" />
                  <span className="text-sm">{formatAddress(topRatedHospital.address)}</span>
                </div>
                <div className="text-sm text-indigo-600 font-medium">
                  Distance: {(topRatedHospital.distance * 0.621371).toFixed(1)} miles
                </div>
              </div>
              
              <div className="lg:w-96 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 font-medium mb-1">Cash Price</div>
                  <div className="text-lg font-bold text-gray-900">{standard}</div>
                </div>
                
                {selectedInsurance && (
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 font-medium mb-1">{selectedInsurance} Price</div>
                    <div className="text-lg font-bold text-indigo-600">{insurance}</div>
                    {savings !== 'N/A' && (
                      <div className="text-xs text-green-600">Save {savings}</div>
                    )}
                  </div>
                )}
              </div>
              
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
      
      {/* Main Comparison Table */}
      <div className="rounded-xl bg-white shadow-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Provider Comparison for {service}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Sorted by hospital rating - highest rated shown first
          </p>
        </div>
        
        {/* Main Hospital Comparison Table */}
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
                // Get standard charge (cash price)
                const standardCharge = getStandardCharge(provider);
                const formattedStandardCharge = formatCurrency(standardCharge);
                
                // Format address
                const address = provider.address 
                  ? [provider.address.city, provider.address.state].filter(Boolean).join(', ')
                  : 'N/A';
                
                // Get insurance info if selected
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
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Detailed Insurance Table */}
        <div className="border-t border-gray-200 pt-6 pb-4 px-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Detailed Insurance Pricing Information</h4>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hospital
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Insurance
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Standard Price
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Negotiated Price
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Savings
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Setting
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedByRating.flatMap((provider) => {
                  if (!provider.insuranceOptions || provider.insuranceOptions.length === 0) {
                    return [{
                      key: `${provider.id}-no-insurance`,
                      hospitalName: provider.hospitalName,
                      hospitalRating: provider.hospitalRating,
                      insurance: 'N/A',
                      plan: 'N/A',
                      standardPrice: formatCurrency(getStandardCharge(provider)),
                      negotiatedPrice: 'N/A',
                      savings: 'N/A',
                      setting: provider.service?.setting || 'N/A',
                      isSelected: false
                    }];
                  }
                  
                  return provider.insuranceOptions
                    .filter(option => option.insurance !== 'N/A')
                    .map((option, idx) => {
                      const savings = calculateSavings(option.standardCharge, option.negotiatedAmount);
                      const savingsPercentage = calculateSavingsPercentage(option.standardCharge, savings);
                      const isSelectedInsurance = selectedInsurance && 
                        option.insurance.toLowerCase() === selectedInsurance.toLowerCase();
                        
                      return {
                        key: `${provider.id}-${idx}`,
                        hospitalName: provider.hospitalName,
                        hospitalRating: provider.hospitalRating,
                        insurance: option.insurance,
                        plan: option.planName !== 'N/A' ? option.planName : '-',
                        standardPrice: formatCurrency(option.standardCharge),
                        negotiatedPrice: formatCurrency(option.negotiatedAmount),
                        savings: savings > 0 ? 
                          `${formatCurrency(savings)} ${savingsPercentage ? `(${savingsPercentage.toFixed(0)}%)` : ''}` : 
                          '-',
                        setting: provider.service?.setting || 'N/A',
                        isSelected: isSelectedInsurance
                      };
                    });
                }).map((row, index) => (
                  <tr key={row.key} className={row.isSelected ? 'bg-indigo-50' : ''}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{row.hospitalName}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{row.insurance}</span>
                        {row.isSelected && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            Selected
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {row.plan}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {row.standardPrice}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-indigo-600">
                      {row.negotiatedPrice}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={row.savings !== '-' ? "text-sm text-green-600 font-medium" : "text-sm text-gray-500"}>
                        {row.savings}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {row.setting}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        
      </div>
    </div>
  );
};

export default StaticHospitalComparisonWithRecommendation;