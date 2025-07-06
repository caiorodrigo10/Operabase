/**
 * API Configuration
 * Handles different environments and API endpoints
 */

// Get API base URL based on environment
export const getApiBaseUrl = (): string => {
  // In production (Vercel), use the environment variable
  if ((import.meta as any).env.VITE_API_URL) {
    return (import.meta as any).env.VITE_API_URL;
  }
  
  // In development, use proxy (handled by Vite)
  if ((import.meta as any).env.DEV) {
    return '';
  }
  
  // Throw error instead of fallback for better debugging
  throw new Error('VITE_API_URL is required in production. Please configure it in Vercel environment variables.');
};

// Helper function to make API requests with proper base URL
export const makeApiRequest = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  const baseUrl = getApiBaseUrl();
  const url = baseUrl ? `${baseUrl}${endpoint}` : endpoint;
  
  console.log(`🌐 Making API request to: ${url}`);
  
  return fetch(url, {
    ...options,
    credentials: 'include', // Include cookies for session
  });
};

// Export API base URL for components that need it
export const API_BASE_URL = getApiBaseUrl(); 