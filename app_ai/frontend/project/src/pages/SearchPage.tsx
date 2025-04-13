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

  // Helper function to get price for a specific insurance plan
  const getInsurancePriceInfo = (provider: HospitalData, insuranceName: string | undefined): { price: string, savings: string } => {
    if (!insuranceName || !provider.insuranceOptions || provider.insuranceOptions.length === 0) {
      return { price: 'N/A', savings: 'N/A' };
    }

    // Find the insurance option matching the selected insurance name (case-insensitive compare)
    const insuranceOption = provider.insuranceOptions.find(
      option => option.insurance && option.insurance.toLowerCase() === insuranceName.toLowerCase()
    );

    if (!insuranceOption) {
      // Check if this provider accepts this insurance but doesn't have a specific price for it
      const acceptsInsurance = provider.acceptedInsurance.some(
        ins => ins.toLowerCase() === insuranceName.toLowerCase()
      );
      return acceptsInsurance ? 
        { price: 'Call for Price', savings: 'N/A' } : 
        { price: 'Not Covered', savings: 'N/A' };
    }

    const price = insuranceOption.negotiatedAmount !== null
      ? `$${insuranceOption.negotiatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : 'N/A';

    const savings = insuranceOption.savings !== null
      ? `$${insuranceOption.savings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : 'N/A';

    return { price, savings };
  };

   // Helper function to get the Cash Price (Standard Charge)
   const getCashPrice = (provider: HospitalData): string => {
    if (!provider.insuranceOptions || provider.insuranceOptions.length === 0) {
      return 'N/A';
    }
    
    // Find the first valid standard charge among the options
    const standardChargeOption = provider.insuranceOptions.find(opt => opt.standardCharge !== null);
    
    return standardChargeOption?.standardCharge !== null && standardChargeOption?.standardCharge !== undefined
      ? `$${standardChargeOption.standardCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : 'N/A';
  };

  // Helper function to format address
  const formatAddress = (address: HospitalAddress | undefined): string => {
    if (!address) return 'N/A';
    const parts = [address.street, address.city, address.state, address.postalCode].filter(Boolean);
    return parts.join(', ') || 'N/A';
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
            </div>

            {providers.length > 0 ? (
              <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
                <table className="min-w-full bg-white divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Cash Price
                      </th>
                      {/* Conditionally render insurance column only if an insurance was searched */}
                      {searchedInsurance && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          {searchedInsurance} Price
                        </th>
                      )}
                       {searchedInsurance && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                           Savings w/ {searchedInsurance}
                        </th>
                       )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Distance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Phone
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {providers.map((provider) => {
                      const cashPrice = getCashPrice(provider);
                      const { price: insurancePrice, savings: insuranceSavings } = searchedInsurance
                        ? getInsurancePriceInfo(provider, searchedInsurance)
                        : { price: 'N/A', savings: 'N/A' };

                      return (
                        <tr key={provider.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{provider.hospitalName}</div>
                            <div className="text-sm text-gray-500">{provider.hospitalType || 'Provider'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{provider.service.description}</div>
                            {provider.service.code && <div className="text-xs text-gray-500">Code: {provider.service.code}</div>}
                            {provider.service.setting && <div className="text-xs text-gray-500">Setting: {provider.service.setting}</div>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {cashPrice}
                          </td>
                          {/* Conditionally render insurance price cell */}
                          {searchedInsurance && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {insurancePrice}
                            </td>
                          )}
                          {/* Conditionally render savings cell */}
                           {searchedInsurance && (
                             <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${insuranceSavings !== 'N/A' && !insuranceSavings.startsWith('-$') ? 'text-green-600' : 'text-gray-900'}`}>
                               {insuranceSavings}
                             </td>
                           )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {provider.distance !== null ? `${provider.distance.toFixed(1)} km` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 max-w-xs truncate" title={formatAddress(provider.address)}>
                            {formatAddress(provider.address)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {provider.contact?.phone || 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
        
        {/* Debug Information Section (can be removed in production) */}
        {!isLoading && providers.length > 0 && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg border border-gray-300 hidden">
            <h3 className="text-lg font-medium mb-2">Debug Information</h3>
            <p className="text-sm text-gray-700">First provider insurance options count: {providers[0]?.insuranceOptions?.length || 0}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;