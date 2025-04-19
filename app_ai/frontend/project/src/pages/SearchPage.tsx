import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/navbar';
import ServiceSearchForm from '../components/ServiceSearchForm'
import HospitalSelectionTable from '../components/HospitalSelectionTable'
import StaticHospitalComparison from '../components/StaticHospitalComparison';
import BookingModal from '../components/BookingModel';
import axios from 'axios';
// Define interfaces for the hospital data
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
  standardCharge: number | null;
  negotiatedAmount: number | null;
  savings: number | null;
  comments?: string;
}

interface HospitalData {
  id: string;
  hospitalId: string;
  hospitalName: string;
  hospitalType?: string;
  hospitalRating?: number;
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
  // State for search parameters
  const [searchParams, setSearchParams] = useState({
    postalCode: '',
    serviceDescription: '',
    insurance: ''
  });
  
  // State for search results and UI
  const [providers, setProviders] = useState<HospitalData[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<HospitalData[]>([]);
  const [selectedProviderIds, setSelectedProviderIds] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState<number>(30);
  const [searchStep, setSearchStep] = useState<'search' | 'select' | 'compare'>('search');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Booking modal state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [bookingProviderId, setBookingProviderId] = useState<string>('');
  const [bookingProviderName, setBookingProviderName] = useState<string>('');
  
  const location = useLocation();
  const navigate = useNavigate();

  // Effect to parse URL parameters on initial load
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const postal = searchParams.get('zipCode') || '';
    const serviceDesc = searchParams.get('serviceDescription') || '';
    const insurance = searchParams.get('insurance') || '';

    if (postal && serviceDesc) {
      setSearchParams({
        postalCode: postal,
        serviceDescription: serviceDesc,
        insurance: insurance
      });

      // Trigger search
      handleSearch({
        postalCode: postal,
        service: serviceDesc,
        insurance: insurance,
        serviceName: serviceDesc
      });
    }
  }, [location.search]);

  // Filter providers by distance
  useEffect(() => {
    if (providers.length > 0) {
      const filtered = providers.filter(
        provider => provider.distance * 0.621371 <= maxDistance // Convert km to miles
      );
      setFilteredProviders(filtered);
    }
  }, [providers, maxDistance]);

  // Handle search form submission
  const handleSearch = async (searchData: { postalCode: string; service: string; insurance?: string; serviceName?: string }) => {
    setIsLoading(true);
    setError(null);
    setProviders([]);
    setFilteredProviders([]);
    setSelectedProviderIds([]);
    setSearchStep('search');

    // Update search parameters
    setSearchParams({
      postalCode: searchData.postalCode,
      serviceDescription: searchData.serviceName || searchData.service,
      insurance: searchData.insurance || ''
    });

    try {
      // Update URL with search parameters
      const urlParams = new URLSearchParams();
      if (searchData.postalCode) urlParams.set('zipCode', searchData.postalCode);
      if (searchData.service) urlParams.set('serviceDescription', searchData.service);
      if (searchData.insurance) urlParams.set('insurance', searchData.insurance);

      navigate(`${location.pathname}?${urlParams.toString()}`, { replace: true });

      // Call the API
      const response = await axios.get(`${API_URL}/search`, {
        params: {
          zipCode: searchData.postalCode,
          serviceDescription: searchData.service,
          maxDistance: 100 // Get a larger radius and filter client-side
        }
      });

      // Process results
      const hospitals = response.data.hospitals || [];
      
      // Log for debugging
      if (hospitals.length > 0) {
        console.log('First hospital data:', hospitals[0]);
      }

      setProviders(hospitals);
      setSearchStep('select'); // Move to selection step

    } catch (error: any) {
      console.error('Search error:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'An unknown error occurred while searching for providers.';
      setError(errorMsg);
      setProviders([]);
      setFilteredProviders([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle provider selection
  const handleProviderSelection = (selectedIds: string[], navigateToCompare: boolean = false) => {
    setSelectedProviderIds(selectedIds);
    
    // Only navigate to compare view if explicitly requested (by clicking the Compare button)
    if (navigateToCompare && selectedIds.length > 0) {
      setSearchStep('compare');
    }
  };

  // Handle max distance change
  const handleMaxDistanceChange = (distance: number) => {
    setMaxDistance(distance);
    
    // If we already have providers but none are in filtered range,
    // force a re-filter of the existing providers
    if (providers.length > 0 && filteredProviders.length === 0) {
      setFilteredProviders(
        providers.filter(provider => provider.distance * 0.621371 <= distance)
      );
    }
  };

  // Handle booking appointment
  const handleBookAppointment = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (provider) {
      setBookingProviderId(providerId);
      setBookingProviderName(provider.hospitalName);
      setIsBookingModalOpen(true);
    }
  };

  // Get selected providers
  const selectedProviders = providers.filter(
    provider => selectedProviderIds.includes(provider.id)
  );

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
                postalCode: searchParams.postalCode,
                serviceType: searchParams.serviceDescription,
                insurance: searchParams.insurance
              }}
              onSearch={handleSearch}
            />
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="container mx-auto px-4 md:px-8 py-12">
        {/* Step Indicator */}
        {searchStep !== 'search' && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${searchStep === 'select' || searchStep === 'compare' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    1
                  </div>
                  <div className={`h-1 w-16 mx-2 ${searchStep === 'select' || searchStep === 'compare' ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${searchStep === 'compare' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    2
                  </div>
                </div>
                <div className="flex mt-2">
                  <div className="w-8 text-center text-xs">Find</div>
                  <div className="w-16"></div>
                  <div className="w-8 text-center text-xs">Compare</div>
                </div>
              </div>
              <div className="text-right">
                <h3 className="text-lg font-medium text-gray-800">
                  {searchStep === 'select' ? 'Select Providers to Compare' : 'Compare Selected Providers'}
                </h3>
                <p className="text-sm text-gray-500">
                  {searchStep === 'select' 
                    ? 'Choose providers by checking the boxes' 
                    : `Comparing ${selectedProviderIds.length} providers`}
                </p>
              </div>
            </div>
          </div>
        )}

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

        {/* Selection Table */}
        {!isLoading && searchStep === 'select' && filteredProviders.length > 0 && (
          <HospitalSelectionTable
            providers={filteredProviders}
            onSelectionChange={handleProviderSelection}
            maxDistanceFilter={maxDistance}
            onMaxDistanceChange={handleMaxDistanceChange}
          />
        )}

        {/* Comparison View */}
        {!isLoading && searchStep === 'compare' && selectedProviders.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setSearchStep('select')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ← Back to Selection
              </button>
              <div className="text-sm text-gray-600">
                Comparing {selectedProviders.length} providers for {searchParams.serviceDescription}
              </div>
            </div>
            
            <StaticHospitalComparison
              providers={selectedProviders}
              selectedInsurance={searchParams.insurance}
              service={searchParams.serviceDescription}
              onBookAppointment={handleBookAppointment}
            />
          </div>
        )}
        
        {/* No Results Message */}
        {!isLoading && searchStep === 'select' && providers.length === 0 && !error && (
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
        
        {/* No Results After Distance Filter */}
        {!isLoading && searchStep === 'select' && providers.length > 0 && filteredProviders.length === 0 && (
          <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
            {/* Distance Filter Control - Always visible */}
            <div className="px-6 py-4 border-b border-gray-200 bg-indigo-50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">No providers within {maxDistance} miles</h3>
                  <p className="text-sm text-gray-600 mt-1">Adjust the distance slider to see more providers</p>
                </div>
                <div className="w-full md:w-2/3">
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={maxDistance}
                      onChange={(e) => handleMaxDistanceChange(parseInt(e.target.value) || 1)}
                      className="w-16 h-10 px-2 border border-gray-300 rounded-md text-center font-bold text-indigo-700"
                    />
                    <span className="text-gray-700">miles</span>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      step="1"
                      value={maxDistance}
                      onChange={(e) => handleMaxDistanceChange(parseInt(e.target.value, 10))}
                      className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center py-10 px-6">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Found {providers.length} providers, but none within {maxDistance} miles</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try increasing your distance filter using the slider above or search in a different location.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => {
                    // Set to a higher distance that will show more results
                    const newDistance = Math.min(100, Math.max(25, Math.ceil(providers[0]?.distance * 0.621371) + 5));
                    handleMaxDistanceChange(newDistance);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Show All Available Providers
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        providerId={bookingProviderId}
        providerName={bookingProviderName}
        serviceName={searchParams.serviceDescription}
      />
    </div>
  );
};

export default SearchPage;