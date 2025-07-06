export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Build backend URL
    const backendUrl = 'http://operabase-backend-mvp-env-1.sa-east-1.elasticbeanstalk.com';
    const queryString = new URLSearchParams(req.query).toString();
    const url = `${backendUrl}/api/contacts${queryString ? `?${queryString}` : ''}`;
    
    console.log(`[Proxy] ${req.method} ${url}`);
    console.log(`[Proxy] Headers:`, req.headers);

    // Forward request to backend
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
        'Accept': 'application/json'
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    });

    console.log(`[Proxy] Backend response: ${response.status}`);

    // Get response data
    const data = await response.json();
    
    // Forward response
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('[Proxy] Error:', error);
    res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message 
    });
  }
} 