import React, { useState, useEffect } from 'react';
import { Search, MapPin, Stethoscope, Shield } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const ServiceSearchForm = ({ 
  initialValues = {}, 
  onSearch = () => {}, 
  compact = false,
  className = '' 
}) => {
  // Form state
  const [postalCode, setPostalCode] = useState(initialValues.postalCode || '');
  const [selectedService, setSelectedService] = useState(initialValues.service || '');
  const [selectedServiceName, setSelectedServiceName] = useState(initialValues.serviceName || '');
  const [insurance, setInsurance] = useState(initialValues.insurance || '');
  const [isLoading, setIsLoading] = useState(false);
  
  // Data state
  const [postalCodes, setPostalCodes] = useState([]);
  const [services, setServices] = useState([]);
  const [isServicesLoading, setIsServicesLoading] = useState(true);

  // Fetch data when component mounts
  useEffect(() => {
    const fetchPostalCodes = async () => {
      try {
        // In a real implementation, you would fetch from your API
        // const response = await axios.get(`${API_URL}/postal-codes`);
        // setPostalCodes(response.data);
        
        // For now, use sample data
        setPostalCodes([
          { code: '19103', city: 'Philadelphia', state: 'PA' },
          { code: '19106', city: 'Philadelphia', state: 'PA' },
          { code: '19107', city: 'Philadelphia', state: 'PA' },
          { code: '19102', city: 'Philadelphia', state: 'PA' },
          { code: '19146', city: 'Philadelphia', state: 'PA' },
          { code: '19104', city: 'Philadelphia', state: 'PA' },
          { code: '19130', city: 'Philadelphia', state: 'PA' },
          { code: '19147', city: 'Philadelphia', state: 'PA' },
          { code: '19148', city: 'Philadelphia', state: 'PA' },
          { code: '19145', city: 'Philadelphia', state: 'PA' }
        ]);
      } catch (error) {
        console.error('Error fetching postal codes:', error);
      }
    };

    const fetchServices = async () => {
      setIsServicesLoading(true);
      try {
        const response = await axios.get(`${API_URL}/services`);
        setServices(response.data || []);
      } catch (error) {
        console.error('Error fetching services:', error);
        // Fallback to sample data
        setServices([
          { code: 'A4206', description: 'STERILE SYRINGE & NEEDLE' },
          { code: 'C1713', description: 'TRILOCK GRIDPL' },
          { code: '70551', description: 'CHG MRI BRAIN' },
          { code: '93306', description: '2D ECHO' },
          { code: '74150', description: 'ABDOMINAL CT SCAN' },
          { code: 'J7608', description: 'ACETYLCYSTEINE NON-COMP UNIT' },
          { code: '71045', description: 'CHEST X-RAY' },
          { code: '85025', description: 'COMPLETE BLOOD COUNT' }
        ]);
      } finally {
        setIsServicesLoading(false);
      }
    };

    fetchPostalCodes();
    fetchServices();
  }, []);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!postalCode || !selectedService) {
      return;
    }
    
    setIsLoading(true);
    
    // Find the service name if it's not already set
    if (!selectedServiceName && selectedService) {
      const service = services.find(s => s.code === selectedService);
      if (service) {
        setSelectedServiceName(service.description);
      }
    }
    
    // Call the onSearch callback with form data
    onSearch({
      postalCode,
      service: selectedService,
      serviceName: selectedServiceName,
      insurance
    });
    
    // Reset loading state after a short delay
    setTimeout(() => setIsLoading(false), 1000);
  };

  // Handle service selection change
  const handleServiceChange = (e) => {
    const serviceCode = e.target.value;
    setSelectedService(serviceCode);
    
    // Set the service name too
    if (serviceCode) {
      const service = services.find(s => s.code === serviceCode);
      if (service) {
        setSelectedServiceName(service.description);
      }
    } else {
      setSelectedServiceName('');
    }
  };

  // Insurance options
  const insuranceOptions = [
    { id: 'Aetna', name: 'Aetna' },
    { id: 'Humana', name: 'Humana' },
    { id: 'United Healthcare', name: 'United Healthcare' },
    { id: 'Highmark', name: 'Highmark' },
    { id: 'Amerihealth', name: 'Amerihealth' },
    { id: 'UPMC', name: 'UPMC' }
  ];

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden ${className}`}>
      <div className={compact ? 'p-4' : 'p-6'}>
        {!compact && (
          <h2 className="text-xl font-bold text-gray-800 mb-4">Find Healthcare Prices Near You</h2>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Postal Code Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {compact ? 'ZIP Code' : 'Location'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white appearance-none"
                required
              >
                <option value="">Select ZIP code</option>
                {postalCodes.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.code} - {item.city}, {item.state}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Service Selection Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {compact ? 'Service' : 'Healthcare Service'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Stethoscope className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={selectedService}
                onChange={handleServiceChange}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white appearance-none"
                required
              >
                <option value="">Select a healthcare service</option>
                {isServicesLoading ? (
                  <option value="" disabled>Loading services...</option>
                ) : services.length === 0 ? (
                  <option value="" disabled>No services available</option>
                ) : (
                  services.map((service) => (
                    <option key={service.code} value={service.code}>
                      {service.description} ({service.code})
                    </option>
                  ))
                )}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Insurance Selection Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Insurance (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Shield className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={insurance}
                onChange={(e) => setInsurance(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white appearance-none"
              >
                <option value="">Select insurance (optional)</option>
                {insuranceOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Search Button */}
          <button
            type="submit"
            disabled={isLoading || !postalCode || !selectedService}
            className={`w-full flex justify-center items-center px-4 ${compact ? 'py-2' : 'py-3'} rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                {compact ? 'Search' : 'Find Healthcare Prices'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ServiceSearchForm;