/**
 * API Configuration
 * Handles different environments and API endpoints
 */

// Get API base URL based on environment
export const getApiBaseUrl = (): string => {
  const viteApiUrl = (import.meta as any).env.VITE_API_URL;
  const isDev = (import.meta as any).env.DEV;
  
  console.log('🔧 [API Config] Environment check:', {
    VITE_API_URL: viteApiUrl,
    isDev,
    mode: (import.meta as any).env.MODE,
    prod: (import.meta as any).env.PROD
  });
  
  // In production (Vercel), use the environment variable
  if (viteApiUrl) {
    console.log('✅ [API Config] Using VITE_API_URL:', viteApiUrl);
    return viteApiUrl;
  }
  
  // In development, use proxy (handled by Vite)
  if (isDev) {
    console.log('🔄 [API Config] Using development proxy (empty string)');
    return '';
  }
  
  // Production without VITE_API_URL - log error but don't crash
  console.error('❌ [API Config] VITE_API_URL is required in production but not found');
  console.error('🔍 [API Config] Available env vars:', Object.keys((import.meta as any).env));
  
  // Return empty string as fallback instead of throwing
  return '';
};

// Helper function to make API requests with proper base URL
export const makeApiRequest = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  const baseUrl = getApiBaseUrl();
  const url = baseUrl ? `${baseUrl}${endpoint}` : endpoint;
  
  console.log(`🌐 [API Request] Making request:`, {
    endpoint,
    baseUrl,
    fullUrl: url,
    options: options ? Object.keys(options) : 'none'
  });
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Include cookies for session
    });
    
    const responseTime = Date.now() - startTime;
    
    console.log(`📊 [API Response] ${endpoint}:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      responseTime: `${responseTime}ms`,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    return response;
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error(`💥 [API Error] ${endpoint}:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${responseTime}ms`,
      url
    });
    
    throw error;
  }
};

// Export API base URL getter function instead of trying to get it immediately
export const getApiBaseUrlSafe = (): string => {
  try {
    return getApiBaseUrl();
  } catch (error) {
    console.error('❌ [API Config] Failed to get base URL:', error);
    return '';
  }
};

// Helper function to build full API URLs - SEMPRE usa URL completa
export const buildApiUrl = (endpoint: string): string => {
  // SEMPRE usar o backend AWS em produção com HTTPS para evitar Mixed Content
  const baseUrl = (import.meta as any).env.VITE_API_URL || 'https://operabase-backend-mvp-env-1.sa-east-1.elasticbeanstalk.com';
  
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // SEMPRE usar URL completa (nunca proxy)
  const fullUrl = `${baseUrl}${cleanEndpoint}`;
  console.log('🔗 [API] Building URL:', fullUrl);
  return fullUrl;
}; 