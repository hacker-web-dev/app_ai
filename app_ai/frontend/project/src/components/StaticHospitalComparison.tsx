import React from 'react';
import { Star, Calendar, Info, MapPin, Phone, Globe, Shield, Building } from 'lucide-react';

const StaticHospitalComparison = ({
  providers = [],
  selectedInsurance = "",
  service = "",
  onBookAppointment = () => {},
  isSingleView = false // Prop remains, but logic for multi-view also shows details
}) => {

  // Render star rating
  const renderRating = (rating) => {
    if (!rating) return <span className="text-sm text-gray-500">No Rating</span>;

    rating = parseFloat(rating);
    if (isNaN(rating)) return <span className="text-sm text-gray-500">Invalid Rating</span>;

    const fullStars = Math.floor(rating);
    // Basic fill logic, no visual half star here
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={i < fullStars ? "text-yellow-400" : "text-gray-300"}>
            <Star size={16} fill={i < fullStars ? "currentColor" : "none"} />
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
    if (isNaN(ratingA) && isNaN(ratingB)) return 0;
    if (isNaN(ratingA)) return 1;
    if (isNaN(ratingB)) return -1;
    return ratingB - ratingA;
  });

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return 'N/A';
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculate savings
  const calculateSavings = (standard, negotiated) => {
    if (standard === null || negotiated === null || isNaN(standard) || isNaN(negotiated) || standard <= 0) return null;
    if (negotiated >= standard) return 0; // No savings if negotiated is higher or equal
    return standard - negotiated;
  };

  // Calculate savings percentage
  const calculateSavingsPercentage = (standard, savings) => {
    if (standard === null || savings === null || isNaN(standard) || isNaN(savings) || standard <= 0 || savings <= 0) return null;
    return (savings / standard) * 100;
  };

  // Get standard charge for a provider (find first valid standard charge)
  const getStandardCharge = (provider) => {
    if (!provider.insuranceOptions || provider.insuranceOptions.length === 0) return null;
    const option = provider.insuranceOptions.find(opt => opt.standardCharge !== null && opt.standardCharge !== undefined && !isNaN(opt.standardCharge));
    return option ? option.standardCharge : null;
  };

  // Format full address
  const formatFullAddress = (address) => {
    if (!address) return 'N/A';
    const parts = [
      address.street,
      [address.city, address.state].filter(Boolean).join(', '),
      address.zip || address.postalCode
    ].filter(Boolean);
    return parts.join(', ') || 'N/A';
  };

  // Format shorter address
  const formatShortAddress = (address) => {
    if (!address) return 'N/A';
    return [address.city, address.state].filter(Boolean).join(', ') || 'N/A';
  };

  // --- Reusable Insurance Detail Table Component ---
  const InsuranceDetailTable = ({ provider, standardCharge, providerId }) => {
      const hasValidInsuranceOptions = provider.insuranceOptions && provider.insuranceOptions.some(opt => opt.insurance && opt.insurance !== 'N/A');

      if (!hasValidInsuranceOptions) {
          return (
              <div className="px-4 py-3 text-sm text-gray-500 bg-white">
                  No specific insurance plan pricing available for this provider.
              </div>
          );
      }

      return (
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 rounded-lg"> {/* Added border and rounding */}
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-100 dark:bg-gray-700"> {/* Changed header bg */}
                      <tr>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Insurance
                          </th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Plan
                          </th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Your Price
                          </th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Savings (vs Std.)
                          </th>
                      </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {provider.insuranceOptions
                          .filter(option => option.insurance && option.insurance !== 'N/A')
                          .sort((a, b) => a.insurance.localeCompare(b.insurance))
                          .map((option, idx) => {
                              const isSelectedInsurance = selectedInsurance &&
                                  option.insurance.toLowerCase() === selectedInsurance.toLowerCase();
                              // Use option's standard if available, else provider's general standard
                              const standardForCalc = option.standardCharge ?? standardCharge;
                              const savings = calculateSavings(standardForCalc, option.negotiatedAmount);
                              const savingsPercentage = calculateSavingsPercentage(standardForCalc, savings);

                              return (
                                  <tr key={`${providerId}-ins-${idx}`} className={isSelectedInsurance ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}>
                                      {/* Insurance Name */}
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
                                      {/* Plan Name */}
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                          {option.planName && option.planName !== 'N/A' ? option.planName : '-'}
                                      </td>
                                      {/* Negotiated Price */}
                                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                          {formatCurrency(option.negotiatedAmount)}
                                      </td>
                                      {/* Savings */}
                                      <td className="px-4 py-3 whitespace-nowrap">
                                          {savings !== null && savings > 0 ? (
                                              <div className="text-sm text-green-600 font-medium">
                                                  {formatCurrency(savings)}
                                                  {savingsPercentage !== null && (
                                                      <span className="ml-1 text-xs">
                                                          ({savingsPercentage.toFixed(0)}%)
                                                      </span>
                                                  )}
                                              </div>
                                          ) : savings === 0 ? (
                                             <span className="text-sm text-gray-500 dark:text-gray-400">No Savings</span>
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
      );
  };


  // --- Render Logic ---

  if (!providers || providers.length === 0) {
    return (
      <div className="rounded-xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No providers selected</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Please select providers to compare or search for one.
          </p>
        </div>
      </div>
    );
  }

  // --- Single Provider Detail View ---
  if (isSingleView || providers.length === 1) {
    const provider = providers[0];
    const providerId = provider.id || 0; // Use index as fallback key if id missing
    const standardCharge = getStandardCharge(provider);
    const formattedStandardCharge = formatCurrency(standardCharge);

    return (
      <div className="space-y-6">
        {/* --- Hospital Card --- */}
        <div className="rounded-xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {service ? `Details for ${service}` : 'Provider Details'}
            </h3>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Hospital Info Header */}
            <div className="flex flex-col sm:flex-row items-start justify-between mb-6 gap-4">
              {/* Left Side: Name, Type, Rating */}
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                    <Building className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{provider.hospitalName || 'Unnamed Provider'}</h3>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">{provider.hospitalType || 'Healthcare Provider'}</div>
                    <div className="mb-2">{renderRating(provider.hospitalRating)}</div>
                  </div>
                </div>
              </div>
              {/* Right Side: Book Button */}
              <div className="flex-shrink-0 w-full sm:w-auto">
                 <button
                  onClick={() => onBookAppointment(providerId)}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Book Appointment
                </button>
              </div>
            </div>

            {/* Grid Layout for Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Left Column: Contact & Location Info */}
              <div className="md:col-span-1 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Contact & Location</h4>
                  <div className="space-y-3">
                    {/* Address */}
                    <div className="flex items-start">
                      <MapPin size={16} className="text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="text-sm text-gray-800 dark:text-gray-200">{formatFullAddress(provider.address)}</div>
                    </div>
                    {/* Phone */}
                    {provider.contact?.phone && (
                      <div className="flex items-center">
                        <Phone size={16} className="text-gray-500 mr-2 flex-shrink-0" />
                        <div className="text-sm text-gray-800 dark:text-gray-200">{provider.contact.phone}</div>
                      </div>
                    )}
                    {/* Website */}
                    {provider.contact?.website && (
                      <div className="flex items-start">
                        <Globe size={16} className="text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                        <a
                          href={provider.contact.website.startsWith('http') ? provider.contact.website : `//${provider.contact.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:underline break-all"
                        >
                          {provider.contact.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    {/* Distance */}
                    {provider.distance !== null && provider.distance !== undefined && (
                       <div className="flex items-center pt-1">
                         <div className="text-sm font-medium text-indigo-600">
                            Distance: {(provider.distance * 0.621371).toFixed(1)} miles
                         </div>
                       </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Columns: Pricing Info */}
              <div className="md:col-span-2">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                   <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Pricing Information</h4>

                  {/* Price Summary Boxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {/* Standard Price Box */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                      <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-1">
                        <Shield size={14} className="mr-1.5" />
                        Standard Price
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{formattedStandardCharge}</div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Estimated cash price</div>
                    </div>

                    {/* Selected Insurance Price Box */}
                    {selectedInsurance && (
                      <div className="bg-white p-4 rounded-lg border border-indigo-200 shadow-sm">
                        <div className="flex items-center text-gray-500 text-sm mb-1">
                          <Shield size={14} className="mr-1.5" />
                          {selectedInsurance} Price
                        </div>
                        {(() => {
                          const insuranceOption = provider.insuranceOptions?.find(
                            option => option.insurance && option.insurance.toLowerCase() === selectedInsurance.toLowerCase()
                          );

                          if (!insuranceOption || insuranceOption.negotiatedAmount === null || insuranceOption.negotiatedAmount === undefined) {
                            const isAccepted = provider.acceptedInsurance?.some(ins => ins.toLowerCase() === selectedInsurance.toLowerCase());
                             return (
                              <div className="text-base text-gray-800 mt-2">
                                {isAccepted ? "Price unavailable" : "Not listed/covered"}
                              </div>
                            );
                          }

                          const negotiatedAmount = insuranceOption.negotiatedAmount;
                          const standardForCalc = insuranceOption.standardCharge ?? standardCharge;
                          const savings = calculateSavings(standardForCalc, negotiatedAmount);
                          const savingsPercentage = calculateSavingsPercentage(standardForCalc, savings);

                          return (
                            <>
                              <div className="text-2xl font-bold text-indigo-600">
                                {formatCurrency(negotiatedAmount)}
                              </div>
                              {savings !== null && savings > 0 && (
                                <div className="mt-1 text-sm text-green-600">
                                  Save {formatCurrency(savings)}
                                  {savingsPercentage !== null && (
                                    <span className="ml-1">({savingsPercentage.toFixed(0)}%)</span>
                                  )}
                                </div>
                              )}
                               {savings === 0 && (
                                 <div className="mt-1 text-sm text-gray-500">Same as standard price</div>
                               )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div> {/* End Price Summary Boxes */}

                  {/* --- Insurance Options Table (Rendered Statically) --- */}
                  <div className="mt-6">
                      <h5 className="text-sm font-medium text-gray-600 mb-2">
                          All Insurance Plan Details
                      </h5>
                     <InsuranceDetailTable provider={provider} standardCharge={standardCharge} providerId={providerId}/>
                  </div>

                </div> {/* End Pricing Info Box */}
              </div> {/* End Right Columns */}
            </div> {/* End Grid Layout */}
          </div> {/* End Card Body */}

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Info size={14} className="mr-2 flex-shrink-0 text-gray-400 dark:text-gray-500" />
              <p>Prices shown are estimates and may vary. Contact the provider or your insurance company for the most accurate cost information.</p>
            </div>
          </div>
        </div> {/* End Hospital Card */}
      </div> /* End Single View Container */
    );
  }

  // --- Multiple Providers Comparison View ---
  // Now ALSO includes the static insurance detail table per provider

  const topProvider = sortedByRating[0];
  const topStandardCharge = getStandardCharge(topProvider);
  const topFormattedStandardCharge = formatCurrency(topStandardCharge);
  const topAddress = formatShortAddress(topProvider.address);

  // Calculate the colspan needed for the detail row
  const baseColspan = 5; // Hospital, Rating, Location, Distance, Standard Price
  const insuranceColspan = selectedInsurance ? 2 : 0; // Insurance Price, Savings
  const actionColspan = 1; // Action Button
  const totalColspan = baseColspan + insuranceColspan + actionColspan;


  return (
    <div className="space-y-6">
      {/* Recommendation Card (Same as before) */}
      <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 shadow-lg overflow-hidden border border-indigo-200 dark:border-indigo-800">
        <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 flex items-center text-indigo-800 dark:text-indigo-300 text-sm font-medium">
          <Star size={14} className="mr-2" />
          Top Rated Recommendation
        </div>
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-lg font-medium text-gray-900 dark:text-white">{topProvider.hospitalName}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{topProvider.hospitalType || 'Healthcare Provider'}</div>
            <div className="mt-2 flex items-center">
              {renderRating(topProvider.hospitalRating)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 flex items-center">
                <MapPin size={14} className="mr-1 text-gray-400"/> {topAddress}
            </div>
             {topProvider.distance !== null && topProvider.distance !== undefined && (
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Distance: {(topProvider.distance * 0.621371).toFixed(1)} miles
                </div>
             )}
          </div>
          <div className="flex flex-col items-stretch sm:items-end w-full sm:w-auto">
            <div className="bg-white p-2 rounded-md shadow-sm text-center sm:text-right text-sm font-medium text-gray-900 mb-3">
              Standard Price<br />
              <span className="text-lg font-bold">{topFormattedStandardCharge}</span>
            </div>
            <button
              onClick={() => onBookAppointment(topProvider.id)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Book Appointment
            </button>
          </div>
        </div>
      </div>

      {/* Main Comparison Table */}
      <div className="rounded-xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {`Compare Providers for ${service || 'Selected Service'}`}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Sorted by hospital rating (highest first). Insurance details shown below each provider.
          </p>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {/* Use border-collapse and manage borders carefully */}
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600 border-collapse">
            {/* Table Head */}
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                  Hospital
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                  Rating
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                  Location
                </th>
                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                  Distance
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                  Standard Price
                </th>
                {selectedInsurance && (
                  <>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                      {selectedInsurance} Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                      Savings
                    </th>
                  </>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                  Action
                </th>
              </tr>
            </thead>
            {/* Table Body - No divide-y here, manage borders manually */}
            <tbody className="bg-white">
              {sortedByRating.map((provider, index) => {
                const providerId = provider.id || index; // Use index as fallback key
                const standardCharge = getStandardCharge(provider);
                const formattedStandardCharge = formatCurrency(standardCharge);
                const address = formatShortAddress(provider.address);
                let insurancePrice = 'N/A';
                let savings = null;
                let savingsPercentage = null;

                if (selectedInsurance && provider.insuranceOptions) {
                  const insuranceOption = provider.insuranceOptions.find(
                    option => option.insurance && option.insurance.toLowerCase() === selectedInsurance.toLowerCase()
                  );
                  if (insuranceOption && insuranceOption.negotiatedAmount !== null && insuranceOption.negotiatedAmount !== undefined) {
                    const negotiatedAmount = insuranceOption.negotiatedAmount;
                    insurancePrice = formatCurrency(negotiatedAmount);
                    const standardForCalc = insuranceOption.standardCharge ?? standardCharge;
                    savings = calculateSavings(standardForCalc, negotiatedAmount);
                    savingsPercentage = calculateSavingsPercentage(standardForCalc, savings);
                  } else {
                     const isAccepted = provider.acceptedInsurance?.some(ins => ins.toLowerCase() === selectedInsurance.toLowerCase());
                     insurancePrice = isAccepted ? "Not priced" : "Not listed";
                  }
                }

                const isTopRated = index === 0;
                const hasValidInsuranceOptions = provider.insuranceOptions && provider.insuranceOptions.some(opt => opt.insurance && opt.insurance !== 'N/A');

                // Add border bottom to the main row only if the details row WILL be shown
                const mainRowClass = `
                  ${isTopRated ? "bg-indigo-50 hover:bg-indigo-100" : "hover:bg-gray-50"}
                  ${hasValidInsuranceOptions ? "" : "border-b border-gray-300"}
                `;

                return (
                  <React.Fragment key={providerId}>
                    {/* --- Main Provider Row --- */}
                    <tr className={mainRowClass}>
                      {/* Hospital Name & Type */}
                      <td className="px-6 py-4 whitespace-nowrap align-top"> {/* Align top */}
                         <div className="text-sm font-medium text-gray-900">{provider.hospitalName}</div>
                         <div className="text-sm text-gray-500">{provider.hospitalType || 'Provider'}</div>
                          {isTopRated && (
                            <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              Top Rated
                            </div>
                          )}
                      </td>
                      {/* Rating */}
                      <td className="px-6 py-4 whitespace-nowrap align-top">{renderRating(provider.hospitalRating)}</td>
                      {/* Location (Short Address) */}
                      <td className="px-6 py-4 whitespace-nowrap align-top">
                        <div className="text-sm text-gray-900">{address}</div>
                      </td>
                       {/* Distance */}
                      <td className="px-6 py-4 whitespace-nowrap align-top">
                         {provider.distance !== null && provider.distance !== undefined ? (
                            <div className="text-sm text-gray-900">{(provider.distance * 0.621371).toFixed(1)} mi</div>
                         ) : (
                            <div className="text-sm text-gray-500">-</div>
                         )}
                      </td>
                      {/* Standard Price */}
                      <td className="px-6 py-4 whitespace-nowrap align-top">
                        <div className="text-sm font-medium text-gray-900">{formattedStandardCharge}</div>
                      </td>
                      {/* Insurance Price (Conditional) */}
                      {selectedInsurance && (
                        <td className="px-6 py-4 whitespace-nowrap align-top">
                          <div className={`text-sm font-medium ${insurancePrice.startsWith('$') ? 'text-indigo-600' : 'text-gray-500'}`}>
                            {insurancePrice}
                          </div>
                        </td>
                      )}
                      {/* Savings (Conditional) */}
                      {selectedInsurance && (
                        <td className="px-6 py-4 whitespace-nowrap align-top">
                          {savings !== null && savings > 0 ? (
                            <div className="text-sm text-green-600 font-medium">
                              {formatCurrency(savings)}
                              {savingsPercentage !== null && (
                                <span className="ml-1 text-xs">
                                  ({savingsPercentage.toFixed(0)}%)
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                      )}
                      {/* Action Button */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium align-top">
                        <button
                          onClick={() => onBookAppointment(providerId)}
                           className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <Calendar className="mr-1.5 h-3.5 w-3.5" />
                          Book
                        </button>
                      </td>
                    </tr>

                    {/* --- Static Insurance Detail Row (Conditionally Rendered) --- */}
                    {hasValidInsuranceOptions && (
                         <tr className="border-b border-gray-300"> {/* Add bottom border here */}
                            {/* This cell spans all columns and contains the nested table */}
                            <td colSpan={totalColspan} className="p-0"> {/* Remove padding */}
                               <div className="px-6 py-4 bg-gray-50"> {/* Add padding here + bg */}
                                  <InsuranceDetailTable provider={provider} standardCharge={standardCharge} providerId={providerId} />
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

        {/* Table Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-600">
            <Info size={14} className="mr-2" />
             <p>Comparison based on available data. Prices are estimates.</p>
          </div>
           <p className="mt-1 text-xs text-gray-500">
             Contact providers directly or check with your insurance for confirmed costs.
          </p>
        </div>
      </div> {/* End Comparison Table Card */}
    </div> /* End Multi-View Container */
  );
};

export default StaticHospitalComparison;