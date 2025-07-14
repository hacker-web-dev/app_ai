import axios from 'axios';

// Configure the API base URL - use environment variable or default to localhost
const API_URL = 'http://localhost:3000/api';

// Configure axios instance with common settings
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
});

// Add request interceptor for authentication if needed
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    // const token = localStorage.getItem('auth_token');
    // if (token) {
    //   config.headers['Authorization'] = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      console.error('API Error Response:', error.response.status, error.response.data);
      
      // Handle specific status codes
      if (error.response.status === 401) {
        // Unauthorized - could redirect to login
        console.error('Authentication error. Please log in again.');
      }
    } else if (error.request) {
      // Request was made but no response received (network error)
      console.error('Network Error. Please check your connection.');
    } else {
      // Something else happened in setting up the request
      console.error('API Request Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Define service interfaces
interface Service {
  code: string;
  description: string;
}

interface Provider {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  distanceKm: string;
  rating?: number;
  totalReviews?: number;
  matchingServices?: Service[];
}

interface PricingDetails {
  available: boolean;
  provider: {
    id: string;
    name: string;
    address: any;
  } | null;
  service: string;
  standardCharge: {
    amount: number;
    setting: string;
  } | null;
  insuranceOptions: {
    insurance: string;
    plan: string;
    negotiatedAmount: number;
    setting: string;
    savings: string | null;
    savingsPercentage: string | null;
  }[];
}

interface Recommendation {
  provider: {
    id: string;
    name: string;
    address: any;
    distance: string;
    rating?: number;
    totalReviews?: number;
  };
  pricing: PricingDetails;
}

interface FeedbackData {
  providerId: string;
  service: string;
  rating?: number; // Made optional
  review: string;
}

interface ProviderRating {
  providerId: string;
  service: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
}

interface Review {
  id: string;
  providerId: string;
  service: string;
  rating: number;
  review: string;
  userId: string;
  timestamp: any;
  createdAt: string;
}

interface ProvidersResponse {
  success: boolean;
  count: number;
  data: Provider[];
}

// API Service with typed methods
export const apiService = {
  /**
   * Get all available healthcare services, optionally filtered by search term
   * @param searchTerm Optional term to filter services
   * @returns List of services
   */
  getServices: async (searchTerm = ''): Promise<Service[]> => {
    try {
      const response = await apiClient.get('/services', {
        params: { search: searchTerm }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  },
  
  /**
   * Find healthcare providers near a postal code
   * @param postalCode User's postal code
   * @param serviceCode Optional service to filter providers
   * @param insuranceId Optional insurance to filter providers
   * @param maxDistance Maximum distance in kilometers (default: 30)
   * @returns List of nearby providers
   */
  findProvidersByPostalCode: async (
    postalCode: string, 
    serviceCode?: string, 
    insuranceId?: string, 
    maxDistance = 30
  ): Promise<ProvidersResponse> => {
    try {
      const response = await apiClient.get('/providers/nearby', {
        params: {
          postalCode,
          serviceName: serviceCode,
          insuranceId,
          maxDistance
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error finding providers:', error);
      throw error;
    }
  },
  
  /**
   * Get pricing details for a specific service at a provider
   * @param providerId Provider ID
   * @param serviceCode Service code
   * @param insuranceId Optional insurance ID
   * @returns Pricing details
   */
  getServicePricing: async (
    providerId: string, 
    serviceCode: string, 
    insuranceId?: string
  ): Promise<PricingDetails> => {
    try {
      const response = await apiClient.get('/providers/pricing', {
        params: {
          providerId,
          serviceCode,
          insuranceId
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting pricing:', error);
      throw error;
    }
  },
  
  /**
   * Compare prices for a service across multiple providers
   * @param providerIds Array of provider IDs
   * @param serviceCode Service code
   * @param insuranceId Optional insurance ID
   * @returns Comparison of pricing across providers
   */
  comparePrices: async (
    providerIds: string[], 
    serviceCode: string, 
    insuranceId?: string
  ): Promise<PricingDetails[]> => {
    try {
      const response = await apiClient.get('/providers/compare', {
        params: {
          providerIds: providerIds.join(','),
          serviceCode,
          insuranceId
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error comparing prices:', error);
      throw error;
    }
  },
  
  /**
   * Get recommendations for a service near a postal code
   * @param postalCode User's postal code
   * @param serviceCode Service code
   * @param insuranceId Optional insurance ID
   * @param maxDistance Maximum distance in kilometers (default: 15)
   * @returns Recommendations
   */
  getRecommendations: async (
    postalCode: string, 
    serviceCode: string, 
    insuranceId?: string, 
    maxDistance = 15
  ): Promise<{success: boolean, count: number, data: Recommendation[]}> => {
    try {
      const response = await apiClient.get('/recommendations', {
        params: {
          postalCode,
          serviceCode,
          insuranceId,
          maxDistance
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  },

  /**
   * Submit feedback for a provider
   * @param feedbackData Feedback data including rating and review
   * @returns Success response
   */
  submitFeedback: async (feedbackData: FeedbackData): Promise<{success: boolean, data: any}> => {
    try {
      const response = await apiClient.post('/feedback', feedbackData);
      return response.data;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  },

  /**
   * Get provider ratings
   * @param providerId Provider ID
   * @param service Optional service name
   * @returns Provider ratings
   */
  getProviderRatings: async (providerId: string, service?: string): Promise<ProviderRating> => {
    try {
      const response = await apiClient.get(`/providers/${providerId}/ratings`, {
        params: { service }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting provider ratings:', error);
      throw error;
    }
  },

  /**
   * Get provider reviews
   * @param providerId Provider ID
   * @param service Optional service name
   * @param limit Number of reviews to fetch
   * @param offset Number of reviews to skip
   * @returns Provider reviews
   */
  getProviderReviews: async (
    providerId: string, 
    service?: string, 
    limit = 10, 
    offset = 0
  ): Promise<Review[]> => {
    try {
      const response = await apiClient.get(`/providers/${providerId}/reviews`, {
        params: { service, limit, offset }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting provider reviews:', error);
      throw error;
    }
  }
};

export default apiService;