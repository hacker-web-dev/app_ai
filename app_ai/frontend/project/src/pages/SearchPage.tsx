import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/navbar';
import ServiceSearchForm from '../components/ServiceSearchForm'
import HospitalSelectionTable from '../components/HospitalSelectionTable'
import StaticHospitalComparison from '../components/StaticHospitalComparison';
import BookingModal from '../components/BookingModel';
import Toast from '../components/Toast';
import { RefreshCw } from 'lucide-react';
import axios from 'axios';

// API Configuration
const API_URL = 'http://localhost:3000';
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
  totalReviews?: number;
  address: HospitalAddress;
  location: HospitalLocation;
  contact: HospitalContact;
  acceptedInsurance: string[];
  service: HospitalService;
  distance: number; // In km
  insuranceOptions: InsuranceOption[];
}



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
  const [singleProviderId, setSingleProviderId] = useState<string | null>(null); // New state for single provider view
  const [maxDistance, setMaxDistance] = useState<number>(30);
  const [searchStep, setSearchStep] = useState<'search' | 'select' | 'compare' | 'details'>('search'); // Added 'details' step
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshingRatings, setIsRefreshingRatings] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Toast notification state
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
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
    setSingleProviderId(null); // Reset single provider selection
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
      setSingleProviderId(null); // Clear single provider selection
      setSearchStep('compare');
    }
  };

  // Handle single provider view - New function to handle clicking on a hospital name
  const handleViewSingleProvider = (providerId: string) => {
    setSingleProviderId(providerId);
    setSearchStep('details'); // Immediately navigate to details view
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
      setBookingProviderId(provider.hospitalId); // Use hospitalId for feedback system
      setBookingProviderName(provider.hospitalName);
      setIsBookingModalOpen(true);
    }
  };

  // Refresh ratings for all providers after feedback submission
  const refreshProviderRatings = async () => {
    if (providers.length === 0) return;

    setIsRefreshingRatings(true);
    try {
      // Fetch updated ratings for all providers
      const ratingPromises = providers.map(async (provider) => {
        try {
          const response = await fetch(`http://localhost:3000/api/providers/${provider.hospitalId}/ratings?service=${searchParams.serviceDescription}`);
          const data = await response.json();
          console.log(`Rating refresh for ${provider.hospitalId}:`, data.data);
          return {
            hospitalId: provider.hospitalId,
            newRating: data.data.averageRating,
            totalReviews: data.data.totalReviews
          };
        } catch (error) {
          console.warn(`Failed to fetch rating for ${provider.hospitalId}:`, error);
          return null;
        }
      });

      const ratingUpdates = await Promise.all(ratingPromises);
      
      // Update providers with new ratings
      setProviders(prevProviders => 
        prevProviders.map(provider => {
          const ratingUpdate = ratingUpdates.find(update => 
            update && update.hospitalId === provider.hospitalId
          );
          
          if (ratingUpdate) {
            return {
              ...provider,
              hospitalRating: ratingUpdate.newRating,
              totalReviews: ratingUpdate.totalReviews
            };
          }
          return provider;
        })
      );

      console.log('Provider ratings refreshed successfully');
      
      // Show success toast
      setToastMessage('Ratings updated successfully!');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      console.error('Error refreshing provider ratings:', error);
      
      // Show error toast
      setToastMessage('Failed to update ratings. Please try again.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsRefreshingRatings(false);
    }
  };


  // Get selected providers or single provider
  const selectedProviders = searchStep === 'details' && singleProviderId 
    ? [providers.find(p => p.id === singleProviderId)].filter(Boolean) as HospitalData[]
    : providers.filter(provider => selectedProviderIds.includes(provider.id));

  // Determine if we're in single hospital view mode
  const isSingleView = searchStep === 'details' && singleProviderId !== null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      {/* Search Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-700 dark:to-blue-700 pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-8">
          <h1 className="text-3xl font-bold text-white dark:text-gray-100 mb-6">Find Healthcare Services</h1>
          <p className="text-white dark:text-gray-200 text-lg mb-8">Compare prices and find the best healthcare providers in your area</p>

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
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${searchStep !== 'search' ? 'bg-indigo-600 dark:bg-indigo-500 text-white dark:text-gray-100' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                    1
                  </div>
                  <div className={`h-1 w-16 mx-2 ${searchStep === 'compare' || searchStep === 'details' ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${searchStep === 'compare' || searchStep === 'details' ? 'bg-indigo-600 dark:bg-indigo-500 text-white dark:text-gray-100' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                    2
                  </div>
                </div>
                <div className="flex mt-2">
                  <div className="w-8 text-center text-xs text-gray-600 dark:text-gray-400">Find</div>
                  <div className="w-16"></div>
                  <div className="w-8 text-center text-xs text-gray-600 dark:text-gray-400">
                    {isSingleView ? 'Details' : 'Compare'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  {searchStep === 'select' 
                    ? 'Select Providers to Compare' 
                    : searchStep === 'details'
                      ? 'Hospital Details'
                      : selectedProviders.length === 1 
                        ? 'Hospital Details' 
                        : 'Compare Selected Providers'
                  }
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {searchStep === 'select' 
                    ? 'Choose providers by checking the boxes or click a name to view details' 
                    : searchStep === 'details'
                      ? `Viewing details for selected provider`
                      : selectedProviders.length === 1
                        ? `Viewing details for 1 provider`
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
            <p className="text-gray-600 dark:text-gray-300">Searching for providers...</p>
          </div>
        )}

        {/* Error Message */}
        {!isLoading && error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6" role="alert">
            <strong className="font-bold text-red-800 dark:text-red-200">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {/* Selection Table */}
        {!isLoading && searchStep === 'select' && filteredProviders.length > 0 && (
          <HospitalSelectionTable
            providers={filteredProviders}
            onSelectionChange={handleProviderSelection}
            onViewSingleProvider={handleViewSingleProvider} // Connect the handler
            maxDistanceFilter={maxDistance}
            onMaxDistanceChange={handleMaxDistanceChange}
            currentService={searchParams.serviceDescription} // Pass current service
            onRatingsUpdate={refreshProviderRatings} // Pass ratings refresh function
          />
        )}

        {/* Single Provider View */}
        {!isLoading && searchStep === 'details' && selectedProviders.length === 1 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setSearchStep('select')}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                ← Back to Selection
              </button>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Hospital details for {searchParams.serviceDescription}
              </div>
            </div>
            
            <StaticHospitalComparison
              providers={selectedProviders}
              selectedInsurance={searchParams.insurance}
              service={searchParams.serviceDescription}
              onBookAppointment={handleBookAppointment}
              isSingleView={true} // Tell component this is a single provider view
            />
          </div>
        )}

        {/* Comparison View */}
        {!isLoading && searchStep === 'compare' && selectedProviders.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setSearchStep('select')}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                ← Back to Selection
              </button>
              <div className="flex items-center space-x-4">
                {isRefreshingRatings && (
                  <div className="flex items-center text-indigo-600 dark:text-indigo-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 dark:border-indigo-400 mr-2"></div>
                    <span className="text-sm">Updating ratings...</span>
                  </div>
                )}
                <button
                  onClick={refreshProviderRatings}
                  disabled={isRefreshingRatings}
                  className="flex items-center px-3 py-1.5 text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh latest ratings"
                >
                  <RefreshCw 
                    size={14} 
                    className={`mr-1.5 ${isRefreshingRatings ? 'animate-spin' : ''}`} 
                  />
                  Refresh Ratings
                </button>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedProviders.length === 1 
                    ? "Hospital details for " + searchParams.serviceDescription
                    : `Comparing ${selectedProviders.length} providers for ${searchParams.serviceDescription}`
                  }
                </div>
              </div>
            </div>
            
            <StaticHospitalComparison
              providers={selectedProviders}
              selectedInsurance={searchParams.insurance}
              service={searchParams.serviceDescription}
              onBookAppointment={handleBookAppointment}
              isSingleView={selectedProviders.length === 1} // Set to true if there's only one provider
            />
          </div>
        )}
        
        {/* No Results Message */}
        {!isLoading && searchStep === 'select' && providers.length === 0 && !error && (
          <div className="text-center py-10 px-6 bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-600">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No providers found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              We couldn't find any providers matching your search criteria. Try adjusting your search terms or location.
            </p>
          </div>
        )}
        
        {/* No Results After Distance Filter */}
        {!isLoading && searchStep === 'select' && providers.length > 0 && filteredProviders.length === 0 && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
            {/* Distance Filter Control - Always visible */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600 bg-indigo-50 dark:bg-indigo-900/20">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No providers within {maxDistance} miles</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Adjust the distance slider to see more providers</p>
                </div>
                <div className="w-full md:w-2/3">
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={maxDistance}
                      onChange={(e) => handleMaxDistanceChange(parseInt(e.target.value) || 1)}
                      className="w-16 h-10 px-2 border border-gray-300 dark:border-gray-600 rounded-md text-center font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-gray-700"
                    />
                    <span className="text-gray-700 dark:text-gray-300">miles</span>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      step="1"
                      value={maxDistance}
                      onChange={(e) => handleMaxDistanceChange(parseInt(e.target.value, 10))}
                      className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center py-10 px-6">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Found {providers.length} providers, but none within {maxDistance} miles</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white dark:text-gray-100 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 dark:focus:ring-indigo-400"
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
      
      {/* Toast Notification */}
      <Toast
        isVisible={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
        duration={3000}
      />
    </div>
  );
};

export default SearchPage;