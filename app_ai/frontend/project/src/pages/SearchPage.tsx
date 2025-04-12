import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/navbar';
import ServiceSearchForm from '../components/Servicesearchform';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const SearchPage = () => {
  const [providers, setProviders] = useState([]);
  const [pricingDetails, setPricingDetails] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [serviceName, setServiceName] = useState('');
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // Extract search parameters
  const initialValues = {
    postalCode: searchParams.get('postal') || '',
    service: searchParams.get('service') || '',
    insurance: searchParams.get('insurance') || '',
    serviceName: 'Healthcare Service' // Default service name for display
  };

  // Perform search when component mounts with URL parameters
  useEffect(() => {
    if (initialValues.postalCode && initialValues.service) {
      // If we initialize from URL parameters, ensure we have a service name
      // We might need to fetch the service name from the API here if needed
      // For now, use the service code as the name if nothing else is available
      setServiceName(initialValues.serviceName || initialValues.service);
      handleSearch(initialValues);
    }
  }, []);

  // Handle search form submission
  const handleSearch = async (searchData) => {
    setIsLoading(true);
    setError('');
    setProviders([]);
    setPricingDetails({});
    
    try {
      // Update URL with search parameters without page reload
      const searchParams = new URLSearchParams();
      if (searchData.postalCode) searchParams.set('postal', searchData.postalCode);
      if (searchData.service) searchParams.set('service', searchData.service);
      if (searchData.insurance) searchParams.set('insurance', searchData.insurance);
      
      window.history.replaceState(
        {}, 
        '', 
        `${window.location.pathname}?${searchParams.toString()}`
      );
      
      // Call API to fetch providers
      const response = await axios.get(`${API_URL}/providers/nearby`, {
        params: {
          postalCode: searchData.postalCode,
          serviceCode: searchData.service,
          insuranceId: searchData.insurance || undefined,
          maxDistance: 30 // 30km search radius
        }
      });
      
      setProviders(response.data.data || []);
      setSearchPerformed(true);
      setServiceName(searchData.serviceName || searchData.service);
      
      // Fetch pricing for all providers
      if (response.data && response.data.data && response.data.data.length > 0) {
        for (const provider of response.data.data) {
          fetchPricingDetails(provider.id, searchData.service, searchData.insurance);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(error.response?.data?.error || 'Error searching for providers');
      
      setSearchPerformed(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch pricing details for a provider
  const fetchPricingDetails = async (providerId, serviceCode, insuranceId) => {
    try {
      const response = await axios.get(`${API_URL}/providers/pricing`, {
        params: {
          providerId,
          serviceCode,
          insuranceId: insuranceId || undefined
        }
      });
      
      setPricingDetails(prev => ({
        ...prev,
        [providerId]: response.data
      }));
    } catch (error) {
      console.error('Error fetching pricing details:', error);
    }
  };

  // Helper function to get price for a specific insurance
  const getInsurancePrice = (providerPricing, insuranceName) => {
    if (!providerPricing || !providerPricing.insuranceOptions) return 'N/A';
    
    const insurance = providerPricing.insuranceOptions.find(
      option => option.insurance === insuranceName
    );
    
    return insurance ? `$${insurance.negotiatedAmount.toLocaleString()}` : 'N/A';
  };

  // Helper function to format address
  const formatAddress = (provider) => {
    if (!provider || !provider.address) return 'N/A';
    
    const address = provider.address;
    return `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.postalCode || ''}`;
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
              initialValues={initialValues}
              onSearch={handleSearch}
            />
          </div>
        </div>
      </div>
      
      {/* Search Results */}
      <div className="container mx-auto px-4 md:px-8 py-12">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-4"></div>
            <p className="text-gray-600">Searching for providers...</p>
          </div>
        )}
        
        {searchPerformed && !isLoading && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                {providers.length > 0 
                  ? `Found ${providers.length} providers for "${serviceName || 'Healthcare Service'}" near ${initialValues.postalCode}`
                  : `No providers found for "${serviceName || 'Healthcare Service'}" near ${initialValues.postalCode}`
                }
              </h2>
            </div>
            
            {providers.length > 0 && (
              <div className="overflow-x-auto shadow-md rounded-lg">
                <table className="min-w-full bg-white border-collapse">
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
                      {initialValues.insurance && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          {initialValues.insurance} Price
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Savings
                      </th>
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
                      const pricing = pricingDetails[provider.id];
                      const cashPrice = pricing?.standardCharge?.amount 
                        ? `$${pricing.standardCharge.amount.toLocaleString()}`
                        : 'Loading...';
                      
                      const insurancePrice = initialValues.insurance
                        ? getInsurancePrice(pricing, initialValues.insurance)
                        : null;
                      
                      const savings = pricing?.insuranceOptions?.find(
                        option => option.insurance === initialValues.insurance
                      )?.savings;
                      
                      return (
                        <tr key={provider.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {provider.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {provider.type || 'Healthcare Provider'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{serviceName || 'Healthcare Service'}</div>
                            <div className="text-xs text-gray-500">{provider.specialty || ''}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cashPrice}
                          </td>
                          {initialValues.insurance && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {insurancePrice}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {savings ? `$${savings}` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {provider.distance ? `${provider.distance.toFixed(1)} miles` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatAddress(provider)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {provider.phone || 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;