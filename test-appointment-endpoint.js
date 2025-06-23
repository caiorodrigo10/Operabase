const { db } = require('./server/db');
const { api_keys } = require('./shared/schema');
const bcrypt = require('bcryptjs');

async function testAppointmentEndpoint() {
  try {
    console.log('🔧 Creating test API key...');
    
    // Generate a test API key
    const clinicId = 1;
    const keyHash = 'a1b2c3d4e5f6789012345678901234ab'; // 32 hex chars
    const testApiKey = `tk_clinic_${clinicId}_${keyHash}`;
    
    // Insert test API key into database
    await db.insert(api_keys).values({
      api_key: testApiKey,
      key_name: 'Test Key for Endpoint',
      clinic_id: clinicId,
      permissions: ['read', 'write'],
      is_active: true,
      created_by: 'system',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: null // No expiration for test
    }).onConflictDoNothing();
    
    console.log('✅ Test API key created:', testApiKey);
    
    // Test the endpoint
    const response = await fetch('http://localhost:5000/api/mcp/appointments?limit=2', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Endpoint response:', JSON.stringify(data, null, 2));
      
      // Check if appointment_id field is present instead of id
      if (data.success && data.data && data.data.length > 0) {
        const firstAppointment = data.data[0];
        if (firstAppointment.appointment_id !== undefined && firstAppointment.id === undefined) {
          console.log('✅ SUCCESS: Field transformation working! "id" changed to "appointment_id"');
        } else {
          console.log('❌ ISSUE: Field transformation not working properly');
          console.log('First appointment keys:', Object.keys(firstAppointment));
        }
      }
    } else {
      const errorData = await response.text();
      console.log('❌ Error response:', response.status, errorData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAppointmentEndpoint();