import React, { useState } from 'react';
import { Search, MapPin, Stethoscope } from 'lucide-react';

const ServiceSearchForm = ({ 
  initialValues = {}, 
  onSearch = () => {}, 
  compact = false,
  className = '' 
}) => {
  // Form state
  const [postalCode, setPostalCode] = useState(initialValues.postalCode || '');
  const [serviceType, setServiceType] = useState(initialValues.serviceType || '');
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!postalCode || !serviceType) {
      return;
    }
    
    setIsLoading(true);
    
    // Call the onSearch callback with form data
    // Make sure we pass the data in the format the search page expects
    onSearch({
      postalCode,
      service: serviceType,     // Pass serviceType as both service code
      serviceName: serviceType  // and as the service name for display
    });
    
    // Reset loading state after a short delay
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ${className}`}>
      <div className={compact ? 'p-4' : 'p-6'}>
        {!compact && (
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Find Healthcare Prices Near You</h2>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Postal Code Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {compact ? 'ZIP Code' : 'Location'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="Enter ZIP code"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                required
              />
            </div>
          </div>
          
          {/* Service Type Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {compact ? 'Service' : 'Healthcare Service'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Stethoscope className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                placeholder="Enter healthcare service"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                required
              />
            </div>
          </div>
          
          {/* Search Button */}
          <button
            type="submit"
            disabled={isLoading || !postalCode || !serviceType}
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