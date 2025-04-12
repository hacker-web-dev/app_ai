import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface UseFetchOptions {
  initialData?: any;
  cacheKey?: string;
  cacheDuration?: number; // in milliseconds
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for data fetching with caching
 */
export function useDataFetching<T>(
  url: string, 
  options: UseFetchOptions = {}
): FetchState<T> {
  const { 
    initialData = null, 
    cacheKey, 
    cacheDuration = 5 * 60 * 1000, // 5 minutes default
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Check cache for data
  const getCachedData = useCallback(() => {
    if (!cacheKey) return null;
    
    try {
      const cachedItem = localStorage.getItem(`data_cache_${cacheKey}`);
      if (!cachedItem) return null;
      
      const { data, timestamp } = JSON.parse(cachedItem);
      const isExpired = Date.now() - timestamp > cacheDuration;
      
      if (isExpired) {
        localStorage.removeItem(`data_cache_${cacheKey}`);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error('Cache retrieval error:', err);
      return null;
    }
  }, [cacheKey, cacheDuration]);

  // Save data to cache
  const saveToCache = useCallback((data: T) => {
    if (!cacheKey) return;
    
    try {
      const cacheItem = {
        data,
        timestamp: Date.now()
      };
      
      localStorage.setItem(`data_cache_${cacheKey}`, JSON.stringify(cacheItem));
    } catch (err) {
      console.error('Cache saving error:', err);
    }
  }, [cacheKey]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check cache first
      const cachedData = getCachedData();
      if (cachedData) {
        setData(cachedData);
        setIsLoading(false);
        if (onSuccess) onSuccess(cachedData);
        return;
      }
      
      // Fetch from API
      const response = await axios.get(url);
      setData(response.data);
      
      // Save to cache
      saveToCache(response.data);
      
      if (onSuccess) onSuccess(response.data);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err);
      if (onError) onError(err);
    } finally {
      setIsLoading(false);
    }
  }, [url, getCachedData, saveToCache, onSuccess, onError]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch function to manually trigger a refresh
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
}

/**
 * Hook for fetching data with parameters
 */
export function useParamDataFetching<T, P extends Record<string, any>>(
  baseUrl: string,
  options: UseFetchOptions = {}
) {
  const [data, setData] = useState<T | null>(options.initialData || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchWithParams = useCallback(async (params: P) => {
    const cacheKey = options.cacheKey 
      ? `${options.cacheKey}_${JSON.stringify(params)}`
      : null;
    
    // Check cache
    if (cacheKey) {
      try {
        const cachedItem = localStorage.getItem(`data_cache_${cacheKey}`);
        if (cachedItem) {
          const { data: cachedData, timestamp } = JSON.parse(cachedItem);
          const isExpired = options.cacheDuration 
            ? Date.now() - timestamp > options.cacheDuration
            : false;
          
          if (!isExpired) {
            setData(cachedData);
            if (options.onSuccess) options.onSuccess(cachedData);
            return cachedData;
          }
          
          localStorage.removeItem(`data_cache_${cacheKey}`);
        }
      } catch (err) {
        console.error('Cache retrieval error:', err);
      }
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(baseUrl, { params });
      setData(response.data);
      
      // Save to cache
      if (cacheKey) {
        try {
          localStorage.setItem(`data_cache_${cacheKey}`, JSON.stringify({
            data: response.data,
            timestamp: Date.now()
          }));
        } catch (err) {
          console.error('Cache saving error:', err);
        }
      }
      
      if (options.onSuccess) options.onSuccess(response.data);
      return response.data;
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err);
      if (options.onError) options.onError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, options]);

  return { 
    data, 
    isLoading, 
    error, 
    fetchWithParams 
  };
}

export default useDataFetching;