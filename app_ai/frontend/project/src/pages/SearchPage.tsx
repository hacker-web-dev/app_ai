import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/navbar';
import ServiceSearchForm from '../components/Servicesearchform';
import axios from 'axios';

// Define the structure of the hospital data returned by the API
interface HospitalAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

interface HospitalLocation {
    latitude: number;
    longitude: number;
}

interface HospitalContact {
    phone?: string;
    email?: string;
    website?: string;
}

interface HospitalService {
    description: string;
    code?: string;
    setting?: string;
}

interface InsuranceOption {
    insurance: string;
    planName?: string;
    standardCharge: number | null; // Can be null if not provided/invalid
    negotiatedAmount: number | null; // Can be null
    savings: number | null; // Can be null
    comments?: string;
}

interface HospitalData {
  id: string; // Firestore document ID
  hospitalId: string;
  hospitalName: string;
  hospitalType?: string;
  address: HospitalAddress;
  location: HospitalLocation;
  contact: HospitalContact;
  acceptedInsurance: string[];
  service: HospitalService;
  distance: number; // In km
  insuranceOptions: InsuranceOption[];
}

const API_URL = 'http://localhost:3000';

const SearchPage = () => {
  const [providers, setProviders] = useState<HospitalData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searchedServiceName, setSearchedServiceName] = useState('');
  const [searchedPostalCode, setSearchedPostalCode] = useState('');
  const [searchedInsurance, setSearchedInsurance] = useState('');
  const [sortField, setSortField] = useState<string>('distance');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  // Removed expandedProvider state as it's no longer needed

  const location = useLocation();
  const navigate = useNavigate();

  // Effect to parse URL parameters on initial load or URL change
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const postal = searchParams.get('zipCode') || '';
    const serviceDesc = searchParams.get('serviceDescription') || '';
    const insurance = searchParams.get('insurance') || '';

    if (postal && serviceDesc) {
      setSearchedPostalCode(postal);
      setSearchedServiceName(serviceDesc);
      setSearchedInsurance(insurance);

      handleSearch({
        postalCode: postal,
        service: serviceDesc,
        insurance: insurance,
        serviceName: serviceDesc
      });
    } else {
      setProviders([]);
      setSearchPerformed(false);
      setError(null);
      setSearchedPostalCode('');
      setSearchedServiceName('');
      setSearchedInsurance('');
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Handle search form submission
  const handleSearch = async (searchData: { postalCode: string; service: string; insurance?: string; serviceName?: string }) => {
    setIsLoading(true);
    setError(null);
    setProviders([]);
    setSearchPerformed(false);
    // Removed setExpandedProvider(null);

    setSearchedPostalCode(searchData.postalCode);
    setSearchedServiceName(searchData.serviceName || searchData.service);
    setSearchedInsurance(searchData.insurance || '');

    try {
      const searchParams = new URLSearchParams();
      if (searchData.postalCode) searchParams.set('zipCode', searchData.postalCode);
      if (searchData.service) searchParams.set('serviceDescription', searchData.service);
      if (searchData.insurance) searchParams.set('insurance', searchData.insurance);

      navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });

      console.log('Calling search API with:', {
        zipCode: searchData.postalCode,
        serviceDescription: searchData.service,
        maxDistance: 30
      });

      const response = await axios.get(`${API_URL}/search`, {
        params: {
          zipCode: searchData.postalCode,
          serviceDescription: searchData.service,
          maxDistance: 30
        }
      });

      console.log('API Response:', response.data);

      // Process the hospital data to ensure insuranceOptions is properly handled
      const hospitals = response.data.hospitals || [];

      // Log the structure of the first hospital to help with debugging
      if (hospitals.length > 0) {
        console.log('First hospital insurance options:', hospitals[0].insuranceOptions);
        console.log('First hospital distance:', hospitals[0].distance);
      }

      setProviders(hospitals);

    } catch (error: any) {
      console.error('Search error:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'An unknown error occurred while searching for providers.';
      setError(errorMsg);
      setProviders([]);
    } finally {
      setIsLoading(false);
      setSearchPerformed(true);
    }
  };

  // Removed toggleProviderExpand function

  // Toggle sort field and direction
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort the providers based on the sort field and direction
  const sortedProviders = React.useMemo(() => {
    if (!providers.length) return [];

    return [...providers].sort((a, b) => {
      let comparison = 0;

      if (sortField === 'distance') {
        comparison = a.distance - b.distance;
      } else if (sortField === 'price') {
        // Get the cash price as a numeric value for sorting
        const priceA = getNumericCashPrice(a);
        const priceB = getNumericCashPrice(b);
        comparison = priceA - priceB;
      } else if (sortField === 'insurancePrice') {
        // Sort by insurance price if specified
        const priceA = getNumericInsurancePrice(a, searchedInsurance);
        const priceB = getNumericInsurancePrice(b, searchedInsurance);
        comparison = priceA - priceB;
      } else if (sortField === 'savings') {
        // Sort by savings amount
        const savingsA = getNumericSavings(a, searchedInsurance);
        const savingsB = getNumericSavings(b, searchedInsurance);
        comparison = savingsB - savingsA; // Higher savings first by default
      } else if (sortField === 'name') {
        comparison = a.hospitalName.localeCompare(b.hospitalName);
      } else if (sortField === 'setting') {
        const settingA = a.service.setting || '';
        const settingB = b.service.setting || '';
        comparison = settingA.localeCompare(settingB);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [providers, sortField, sortDirection, searchedInsurance]);

  // Helper function to get numeric cash price for sorting
  const getNumericCashPrice = (provider: HospitalData): number => {
    if (!provider.insuranceOptions || provider.insuranceOptions.length === 0) {
      return Infinity; // Put items with no price at the end when sorting ascending
    }

    // Find the first valid standard charge among the options
    const standardChargeOption = provider.insuranceOptions.find(opt => opt.standardCharge !== null);

    return (standardChargeOption?.standardCharge !== null && standardChargeOption?.standardCharge !== undefined)
      ? standardChargeOption.standardCharge
      : Infinity;
  };

  // Helper function to get numeric insurance price for sorting
  const getNumericInsurancePrice = (provider: HospitalData, insuranceName: string | undefined): number => {
    if (!insuranceName || !provider.insuranceOptions || provider.insuranceOptions.length === 0) {
      return Infinity;
    }

    const insuranceOption = provider.insuranceOptions.find(
      option => option.insurance && option.insurance.toLowerCase() === insuranceName.toLowerCase()
    );

    return (insuranceOption?.negotiatedAmount !== null && insuranceOption?.negotiatedAmount !== undefined)
      ? insuranceOption.negotiatedAmount
      : Infinity;
  };

  // Helper function to get numeric savings for sorting
  const getNumericSavings = (provider: HospitalData, insuranceName: string | undefined): number => {
    if (!insuranceName || !provider.insuranceOptions || provider.insuranceOptions.length === 0) {
      return 0;
    }

    const insuranceOption = provider.insuranceOptions.find(
      option => option.insurance && option.insurance.toLowerCase() === insuranceName.toLowerCase()
    );

    return (insuranceOption?.savings !== null && insuranceOption?.savings !== undefined)
      ? insuranceOption.savings
      : 0;
  };

  // Helper function to get insurance price info for a specific provider
  const getInsurancePriceInfo = (provider: HospitalData, insuranceName: string | undefined): { price: string, savings: string, savingsPercent: string } => {
    if (!insuranceName || !provider.insuranceOptions || provider.insuranceOptions.length === 0) {
      return { price: 'N/A', savings: 'N/A', savingsPercent: 'N/A' };
    }

    // Find the insurance option matching the selected insurance name (case-insensitive compare)
    const insuranceOption = provider.insuranceOptions.find(
      option => option.insurance && option.insurance.toLowerCase() === insuranceName.toLowerCase()
    );

    if (!insuranceOption) {
      // Check if this provider accepts this insurance but doesn't have a specific price for it
      const acceptsInsurance = provider.acceptedInsurance.some(
        ins => ins && ins.toLowerCase() === insuranceName.toLowerCase()
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

  // Check if insurance is accepted
  const isInsuranceAccepted = (provider: HospitalData, insuranceName: string | undefined): boolean => {
    if (!insuranceName) return false;

    // First check specific insurance options
    const hasInsuranceOption = provider.insuranceOptions.some(
      option => option.insurance && option.insurance.toLowerCase() === insuranceName.toLowerCase()
    );

    if (hasInsuranceOption) return true;

    // Then check accepted insurance list
    return provider.acceptedInsurance.some(
      ins => ins && ins.toLowerCase() === insuranceName.toLowerCase()
    );
  };

  // Helper function to get the Cash Price (Standard Charge)
  const getCashPrice = (provider: HospitalData): string => {
    if (!provider.insuranceOptions || provider.insuranceOptions.length === 0) {
      return 'N/A';
    }

    // Find the primary standard charge - prioritize non-N/A insurance options
    const primaryOption = provider.insuranceOptions.find(
      opt => opt.standardCharge !== null && opt.insurance !== 'N/A'
    ) || provider.insuranceOptions.find(
      opt => opt.standardCharge !== null
    );

    return primaryOption?.standardCharge !== null
      ? `$${primaryOption.standardCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : 'N/A';
  };

  // Helper function to format address
  const formatAddress = (address: HospitalAddress | undefined): string => {
    if (!address) return 'N/A';
    const parts = [address.street, address.city, address.state, address.postalCode].filter(Boolean);
    return parts.join(', ') || 'N/A';
  };

  // Helper function to get setting badge style
  const getSettingBadgeStyle = (setting: string | undefined): string => {
    if (!setting) return 'bg-gray-100 text-gray-500';

    switch (setting.toUpperCase()) {
      case 'INPATIENT':
        return 'bg-blue-100 text-blue-700';
      case 'OUTPATIENT':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Search Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-8">
          <h1 className="text-3xl font-bold text-white mb-6">Find Healthcare Services</h1>
          <p className="text-white text-lg mb-8">Compare prices and find the best healthcare providers in your area</p>

          {/* Search Form */}
          <div className="max-w-4xl mx-auto">
            <ServiceSearchForm
              initialValues={{
                  postalCode: searchedPostalCode,
                  service: searchedServiceName,
                  insurance: searchedInsurance
              }}
              onSearch={handleSearch}
            />
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="container mx-auto px-4 md:px-8 py-12">
        {/* Loading Indicator */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-4"></div>
            <p className="text-gray-600">Searching for providers...</p>
          </div>
        )}

        {/* Error Message */}
        {!isLoading && error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {/* Search Results Display */}
        {!isLoading && searchPerformed && !error && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                {providers.length > 0
                  ? `Found ${providers.length} provider${providers.length === 1 ? '' : 's'} for "${searchedServiceName || 'Healthcare Service'}" near ${searchedPostalCode}`
                  : `No providers found for "${searchedServiceName || 'Healthcare Service'}" near ${searchedPostalCode}`
                }
              </h2>
              {/* Potential Sort Controls Here */}
            </div>

            {providers.length > 0 ? (
              <div className="space-y-6">
                {sortedProviders.map((provider) => {
                  const cashPrice = getCashPrice(provider);
                  const { price: insurancePrice, savings: insuranceSavings, savingsPercent } = searchedInsurance
                    ? getInsurancePriceInfo(provider, searchedInsurance)
                    : { price: 'N/A', savings: 'N/A', savingsPercent: 'N/A' };
                  const settingBadgeStyle = getSettingBadgeStyle(provider.service.setting);
                  const acceptsInsurance = searchedInsurance ? isInsuranceAccepted(provider, searchedInsurance) : false;

                  return (
                    <div
                      key={provider.id}
                      className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden p-4 md:p-6" // Added padding here
                    >
                      {/* Provider Summary Top Section */}
                      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-medium text-gray-900">{provider.hospitalName}</h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-500 mt-1 flex-wrap">
                            <span>{provider.hospitalType || 'Provider'}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>{formatAddress(provider.address)}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>{(provider.distance * 0.621371).toFixed(1)} miles</span>
                            {provider.service.setting && (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${settingBadgeStyle}`}>
                                  {provider.service.setting}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Pricing Information (Inline) */}
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mt-2 md:mt-0">
                          {/* Cash Price */}
                          {/* <div className="text-center px-4 py-2 bg-gray-50 rounded-lg">
                            <div className="text-xs text-gray-500 font-medium">Cash Price</div>
                            <div className="text-lg font-bold text-gray-900">{cashPrice}</div>
                          </div> */}

                          {/* Insurance Price */}
                          {searchedInsurance && (
                            <div className={`text-center px-4 py-2 rounded-lg ${acceptsInsurance ? 'bg-indigo-50' : 'bg-gray-50'}`}>
                              <div className="text-xs text-gray-500 font-medium">{searchedInsurance} Price</div>
                              <div className={`text-lg font-bold ${insurancePrice !== 'N/A' && insurancePrice !== 'Call for Price' && insurancePrice !== 'Not Covered' ? 'text-indigo-600' : 'text-gray-700'}`}>
                                {insurancePrice}
                              </div>
                              {insuranceSavings !== 'N/A' && insuranceSavings !== '-' && (
                                <div className="text-xs text-green-600 font-medium">
                                  Save {insuranceSavings} ({savingsPercent})
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Provider Details (Always Visible) */}
                      <div className="border-t border-gray-200 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                          {/* Service Details */}
                          <div>
                            <h4 className="font-medium text-gray-800 mb-2 text-sm uppercase tracking-wide">Service Details</h4>
                            <div className="bg-gray-50 rounded-lg p-3 text-sm">
                              <div className="mb-1">
                                <span className="font-medium text-gray-600">Service:</span>
                                <span className="ml-2 text-gray-900">{provider.service.description}</span>
                              </div>
                              {provider.service.code && (
                                <div className="mb-1">
                                  <span className="font-medium text-gray-600">Code:</span>
                                  <span className="ml-2 text-gray-900">{provider.service.code}</span>
                                </div>
                              )}
                              {provider.service.setting && (
                                <div>
                                  <span className="font-medium text-gray-600">Setting:</span>
                                  <span className="ml-2 text-gray-900">{provider.service.setting}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Contact Information */}
                          <div>
                            <h4 className="font-medium text-gray-800 mb-2 text-sm uppercase tracking-wide">Contact Information</h4>
                            <div className="bg-gray-50 rounded-lg p-3 text-sm">
                              <div className="mb-1">
                                <span className="font-medium text-gray-600">Address:</span>
                                <span className="ml-2 text-gray-900">{formatAddress(provider.address)}</span>
                              </div>
                              <div className="mb-1">
                                <span className="font-medium text-gray-600">Phone:</span>
                                <span className="ml-2 text-gray-900">{provider.contact?.phone || 'N/A'}</span>
                              </div>
                              {/* {provider.contact?.website && (
                                <div>
                                  <span className="font-medium text-gray-600">Website:</span>
                                  <a
                                    href={provider.contact.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-indigo-600 hover:text-indigo-900 break-all" // Added break-all for long URLs
                                  >
                                    Visit Website
                                  </a>
                                </div>
                              )} */}
                            </div>
                          </div>

                          {/* Insurance Options Table */}
                          <div className="md:col-span-2 mt-2">
                            <h4 className="font-medium text-gray-800 mb-2 text-sm uppercase tracking-wide">Insurance & Pricing Details</h4>
                            <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insurance</th>
                                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Standard Price</th>
                                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Negotiated Price</th>
                                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">You Save</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {provider.insuranceOptions
                                      .filter(option => option.insurance !== 'N/A') // Filter out N/A insurance options
                                      .map((option, index) => (
                                        <tr key={index} className={option.insurance.toLowerCase() === searchedInsurance.toLowerCase() ? 'bg-indigo-50' : ''}>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {option.insurance}
                                            {option.insurance.toLowerCase() === searchedInsurance.toLowerCase() && (
                                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                Selected
                                              </span>
                                            )}
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {option.planName !== 'N/A' ? option.planName : '-'}
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {option.standardCharge !== null ?
                                              `$${option.standardCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` :
                                              'N/A'}
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {option.negotiatedAmount !== null ?
                                              `$${option.negotiatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` :
                                              'N/A'}
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap">
                                            {option.savings !== null && option.savings > 0 ? (
                                              <div className="text-sm text-green-600 font-medium">
                                                ${option.savings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                {option.standardCharge !== null && option.standardCharge > 0 && (
                                                  <span className="ml-1 text-xs">
                                                    ({((option.savings / option.standardCharge) * 100).toFixed(0)}%)
                                                  </span>
                                                )}
                                              </div>
                                            ) : (
                                              <span className="text-sm text-gray-500">-</span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              </div>
                                {provider.insuranceOptions.filter(option => option.insurance !== 'N/A').length === 0 && (
                                  <div className="px-4 py-3 text-sm text-gray-500 italic text-center">
                                    No specific insurance pricing information available for this provider and service. See Accepted Insurance list below.
                                  </div>
                                )}
                            </div>
                          </div>

                          {/* Accepted Insurance List */}
                          {/* {provider.acceptedInsurance && provider.acceptedInsurance.length > 0 && (
                            <div className="md:col-span-2 mt-2">
                              <h4 className="font-medium text-gray-800 mb-2 text-sm uppercase tracking-wide">Accepted Insurance Plans (General)</h4>
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <div className="flex flex-wrap gap-1">
                                  {provider.acceptedInsurance.map((insurance, idx) => (
                                    <span
                                      key={idx}
                                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                        searchedInsurance && insurance.toLowerCase() === searchedInsurance.toLowerCase()
                                          ? 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200' // Highlight selected
                                          : 'bg-gray-100 text-gray-700 ring-1 ring-gray-200'
                                      }`}
                                    >
                                      {insurance}
                                    </span>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2 italic">Note: This is a general list. Specific plan coverage may vary. Please verify with the provider and your insurance.</p>
                              </div>
                            </div>
                          )} */}
                        </div>
                      </div>
                      {/* Removed Cost Summary Box */}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Message when no providers are found after a search
              <div className="text-center py-10 px-6 bg-white shadow rounded-lg border border-gray-200">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No providers found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    We couldn't find any providers matching your search criteria. Try adjusting your search terms or location.
                  </p>
              </div>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
};

export default SearchPage;