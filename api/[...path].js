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
    // Get the path from the URL
    const { path } = req.query;
    const apiPath = Array.isArray(path) ? path.join('/') : path;
    
    // Build backend URL
    const backendUrl = 'http://operabase-backend-mvp-env-1.sa-east-1.elasticbeanstalk.com';
    const queryString = new URLSearchParams(req.query).toString();
    
    // Remove the path from query string since it's already in the URL
    const cleanQuery = new URLSearchParams();
    Object.entries(req.query).forEach(([key, value]) => {
      if (key !== 'path') {
        cleanQuery.append(key, Array.isArray(value) ? value[0] : value);
      }
    });
    
    const url = `${backendUrl}/api/${apiPath}${cleanQuery.toString() ? `?${cleanQuery.toString()}` : ''}`;
    
    console.log(`[Proxy] ${req.method} ${url}`);
    console.log(`[Proxy] Headers:`, {
      authorization: req.headers.authorization ? 'Bearer ***' : 'none',
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    });

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

    console.log(`[Proxy] Backend response: ${response.status} ${response.statusText}`);

    // Handle different response types
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const text = await response.text();
      res.status(response.status).send(text);
    }
    
  } catch (error) {
    console.error('[Proxy] Error:', error);
    res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message,
      path: req.query.path 
    });
  }
} 