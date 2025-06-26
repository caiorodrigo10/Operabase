/**
 * Test Script: WhatsApp Webhook Authentication
 * Validates that the N8N_API_KEY authentication is working correctly
 * Created: June 26, 2025
 */

const API_KEY = 'e277a75d4fc5ae0e93c3746930b36ca0551185d6e7bafa8a110850076ad818c1';
const BASE_URL = 'https://df0b3851-aaaa-4197-a6b1-d560b7c6c6d4-00-3i6k0prixkpej.spock.replit.dev';

async function testWhatsAppWebhookAuth() {
  console.log('🔐 Testing WhatsApp Webhook Authentication System...\n');
  
  // Test 1: Webhook sem API Key (deve falhar com 401)
  console.log('📋 Test 1: Request without API Key');
  try {
    const response = await fetch(`${BASE_URL}/api/whatsapp/webhook/connection-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instanceName: 'test-instance',
        connectionStatus: 'open',
        event: 'connection.update'
      })
    });
    
    const result = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Message: "${result.message}"`);
    console.log(`Result: ${response.status === 401 ? '✅ PASS' : '❌ FAIL'} - ${response.status === 401 ? 'Access denied without API key' : 'Should have been denied'}\n`);
  } catch (error) {
    console.log(`❌ FAIL - Network error: ${error.message}\n`);
  }

  // Test 2: Webhook com API Key válida (deve funcionar com 200)
  console.log('📋 Test 2: Request with valid API Key');
  try {
    const response = await fetch(`${BASE_URL}/api/whatsapp/webhook/connection-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        instanceName: 'test-instance',
        connectionStatus: 'open',
        phoneNumber: '+5511999999999',
        profileName: 'Test Profile',
        event: 'connection.update'
      })
    });
    
    const result = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Message: "${result.message}"`);
    console.log(`Result: ${response.status === 200 || response.status === 404 ? '✅ PASS' : '❌ FAIL'} - ${response.status === 200 ? 'Webhook authorized successfully' : response.status === 404 ? 'Authorized but instance not found (expected)' : 'Authorization failed'}\n`);
  } catch (error) {
    console.log(`❌ FAIL - Network error: ${error.message}\n`);
  }

  // Test 3: Webhook com API Key inválida (deve falhar com 401)
  console.log('📋 Test 3: Request with invalid API Key');
  try {
    const response = await fetch(`${BASE_URL}/api/whatsapp/webhook/connection-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'invalid-key-123'
      },
      body: JSON.stringify({
        instanceName: 'test-instance',
        connectionStatus: 'open',
        event: 'connection.update'
      })
    });
    
    const result = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Message: "${result.message}"`);
    console.log(`Result: ${response.status === 401 ? '✅ PASS' : '❌ FAIL'} - ${response.status === 401 ? 'Invalid API key rejected' : 'Should have been rejected'}\n`);
  } catch (error) {
    console.log(`❌ FAIL - Network error: ${error.message}\n`);
  }

  // Test 4: Teste do endpoint de webhook test
  console.log('📋 Test 4: Test webhook endpoint with API Key');
  try {
    const response = await fetch(`${BASE_URL}/api/whatsapp/webhook/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        test: true,
        message: 'Authentication test'
      })
    });
    
    const result = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Message: "${result.message}"`);
    console.log(`Result: ${response.status === 200 ? '✅ PASS' : '❌ FAIL'} - ${response.status === 200 ? 'Test endpoint authorized successfully' : 'Test endpoint authorization failed'}\n`);
  } catch (error) {
    console.log(`❌ FAIL - Network error: ${error.message}\n`);
  }

  // Test 5: Teste de rate limiting (múltiplas requisições)
  console.log('📋 Test 5: Rate limiting (multiple requests)');
  let rateLimitHit = false;
  for (let i = 0; i < 5; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/whatsapp/webhook/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify({ test: i })
      });
      
      if (response.status === 429) {
        rateLimitHit = true;
        console.log(`Rate limit hit on request ${i + 1}`);
        break;
      }
    } catch (error) {
      // Continue testing
    }
  }
  console.log(`Result: Rate limiting ${rateLimitHit ? 'is working' : 'allowed 5 requests (normal)'}\n`);
  
  console.log('🔐 WhatsApp Webhook Authentication Test Complete!');
}

// Execute tests
testWhatsAppWebhookAuth().catch(console.error);