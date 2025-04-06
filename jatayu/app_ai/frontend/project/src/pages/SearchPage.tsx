import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/navbar';
import PriceComparisionTable from '../components/PriceComparisionTable';
import ServiceSearchForm from '../components/Servicesearchform'
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const SearchPage = () => {
  const [providers, setProviders] = useState([]);
  const [pricingDetails, setPricingDetails] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // Extract search parameters
  const initialValues = {
    postalCode: searchParams.get('postal') || '',
    service: searchParams.get('service') || '',
    insurance: searchParams.get('insurance') || ''
  };

  // Perform search when component mounts with URL parameters
  useEffect(() => {
    if (initialValues.postalCode && initialValues.service) {
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
      
      // Fetch pricing for the first few providers
      if (response.data && response.data.data && response.data.data.length > 0) {
        const initialProviders = response.data.data.slice(0, 3);
        for (const provider of initialProviders) {
          fetchPricingDetails(provider.id, searchData.service, searchData.insurance);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(error.response?.data?.error || 'Error searching for providers');
      
      // For demo purposes, if the API fails, show sample data
      setProviders([
        {
          id: 'hospital1',
          name: 'General Hospital',
          address: { street: '123 Main St', city: 'Philadelphia', state: 'PA', postalCode: '19103' },
          distanceKm: '0.5'
        },
        {
          id: 'hospital2',
          name: 'Medical Center',
          address: { street: '456 Elm St', city: 'Philadelphia', state: 'PA', postalCode: '19106' },
          distanceKm: '0.8'
        },
        {
          id: 'hospital3',
          name: 'Community Hospital',
          address: { street: '789 Oak St', city: 'Philadelphia', state: 'PA', postalCode: '19107' },
          distanceKm: '1.2'
        }
      ]);
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
      
      // For demo purposes, provide sample pricing data if API fails
      const samplePricing = {
        available: true,
        provider: {
          id: providerId,
          name: providers.find(p => p.id === providerId)?.name
        },
        service: serviceCode,
        standardCharge: {
          amount: Math.floor(Math.random() * 1000) + 200,
          setting: 'OUTPATIENT'
        },
        insuranceOptions: [
          {
            insurance: 'Aetna',
            plan: 'Aetna Commercial',
            negotiatedAmount: Math.floor(Math.random() * 800) + 150,
            setting: 'OUTPATIENT',
            savings: '50.00',
            savingsPercentage: '25.0'
          },
          {
            insurance: 'United Healthcare',
            plan: 'United Healthcare CHIP',
            negotiatedAmount: Math.floor(Math.random() * 700) + 130,
            setting: 'OUTPATIENT',
            savings: '70.00',
            savingsPercentage: '35.0'
          }
        ]
      };
      
      setPricingDetails(prev => ({
        ...prev,
        [providerId]: samplePricing
      }));
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
                  ? `Found ${providers.length} providers for ${initialValues.service} near ${initialValues.postalCode}`
                  : `No providers found for ${initialValues.service} near ${initialValues.postalCode}`
                }
              </h2>
            </div>
            
            {providers.length > 0 && (
              <PriceComparisionTable
                providers={providers}
                pricingDetails={pricingDetails}
                selectedService={initialValues.service}
                selectedInsurance={initialValues.insurance}
                isLoading={isLoading}
                onViewPricing={(providerId) => {
                  fetchPricingDetails(
                    providerId, 
                    initialValues.service,
                    initialValues.insurance
                  );
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;