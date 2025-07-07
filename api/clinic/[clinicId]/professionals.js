export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get clinic ID from URL parameters
    const { clinicId } = req.query;
    
    // Build backend URL
    const backendUrl = 'http://operabase-backend-mvp-env-1.sa-east-1.elasticbeanstalk.com';
    const url = `${backendUrl}/api/clinic/${clinicId}/professionals`;
    
    console.log(`[Clinic Professionals Proxy] ${req.method} ${url}`);

    // Prepare headers for backend request
    const backendHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Forward authorization header if present
    if (req.headers.authorization) {
      backendHeaders['Authorization'] = req.headers.authorization;
    }

    // Prepare request options
    const requestOptions = {
      method: req.method,
      headers: backendHeaders
    };

    // Add body for non-GET requests
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      requestOptions.body = JSON.stringify(req.body);
    }

    // Forward request to backend
    const response = await fetch(url, requestOptions);

    console.log(`[Clinic Professionals Proxy] Backend response: ${response.status} ${response.statusText}`);

    // Handle JSON response
    const professionals = await response.json();
    
    res.status(response.status).json(professionals);
    
  } catch (error) {
    console.error('[Clinic Professionals Proxy] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch clinic professionals', 
      message: error.message 
    });
  }
} 