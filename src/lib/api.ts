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
  
  // Fallback to AWS backend
  return 'http://operabase-backend-mvp-env-1.sa-east-1.elasticbeanstalk.com';
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