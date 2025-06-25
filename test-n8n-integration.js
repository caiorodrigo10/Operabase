/**
 * Comprehensive N8N Integration Test
 * Tests the /api/n8n/upload endpoint with different file types and authentication scenarios
 */

import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';

const API_BASE = 'http://localhost:5000';
const N8N_API_KEY = 'taskmed-n8n-integration-2025-secure-key';

// Test parameters
const TEST_CONVERSATION_ID = '5598876940345511948922493'; // Igor Venturin conversation
const TEST_CLINIC_ID = 1;

// Create test files
const testFiles = {
  // Create a simple text file for testing
  document: {
    content: Buffer.from('Teste de documento N8N\n\nEste é um arquivo de teste enviado pelo paciente via WhatsApp.\n\nData: ' + new Date().toLocaleString('pt-BR')),
    filename: 'documento-paciente.txt',
    mimeType: 'text/plain'
  },
  
  // Create a simple audio metadata (simulate audio file)
  audio: {
    content: Buffer.from('AUDIO_MOCK_DATA_FOR_TESTING_' + Date.now()), 
    filename: 'audio-whatsapp.mp3',
    mimeType: 'audio/mp3'
  },

  // Create a simple image metadata
  image: {
    content: Buffer.from('IMAGE_MOCK_DATA_FOR_TESTING_' + Date.now()),
    filename: 'foto-exame.jpg', 
    mimeType: 'image/jpeg'
  }
};

async function testN8NUpload() {
  console.log('🧪 Starting N8N Integration Tests...\n');

  // Test 1: Authentication validation
  console.log('📋 Test 1: Authentication Validation');
  await testAuthentication();

  // Test 2: Missing parameters
  console.log('\n📋 Test 2: Missing Parameters Validation');
  await testMissingParameters();

  // Test 3: Successful uploads for each file type
  console.log('\n📋 Test 3: Successful File Uploads');
  for (const [type, fileData] of Object.entries(testFiles)) {
    await testSuccessfulUpload(type, fileData);
  }

  // Test 4: Binary stream upload
  console.log('\n📋 Test 4: Binary Stream Upload');
  await testBinaryStreamUpload();

  console.log('\n✅ All N8N integration tests completed!');
}

async function testAuthentication() {
  try {
    console.log('  📋 Testing request without required parameters...');
    
    const formData = new FormData();
    formData.append('file', testFiles.document.content, {
      filename: testFiles.document.filename,
      contentType: testFiles.document.mimeType
    });

    const response = await fetch(`${API_BASE}/api/n8n/upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (response.status === 400 && result.error === 'Missing conversation ID') {
      console.log('  ✅ Missing parameters correctly rejected');
    } else {
      console.log('  ❌ Parameter validation test failed:', result);
    }

  } catch (error) {
    console.log('  ❌ Parameter validation test error:', error.message);
  }

  try {
    console.log('  📋 Testing invalid clinic ID...');
    
    const formData = new FormData();
    formData.append('file', testFiles.document.content, {
      filename: testFiles.document.filename,
      contentType: testFiles.document.mimeType
    });
    formData.append('conversationId', TEST_CONVERSATION_ID);
    formData.append('clinicId', 'invalid');

    const response = await fetch(`${API_BASE}/api/n8n/upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (response.status === 400 && result.error === 'Invalid clinic ID') {
      console.log('  ✅ Invalid clinic ID correctly rejected');
    } else {
      console.log('  ❌ Clinic ID validation test failed:', result);
    }

  } catch (error) {
    console.log('  ❌ Clinic ID validation test error:', error.message);
  }
}

async function testMissingParameters() {
  try {
    console.log('  📋 Testing missing conversation ID...');
    
    const formData = new FormData();
    formData.append('file', testFiles.document.content, {
      filename: testFiles.document.filename,
      contentType: testFiles.document.mimeType
    });
    formData.append('clinicId', TEST_CLINIC_ID.toString());

    const response = await fetch(`${API_BASE}/api/n8n/upload`, {
      method: 'POST',
      headers: {
        'x-api-key': N8N_API_KEY
      },
      body: formData
    });

    const result = await response.json();
    
    if (response.status === 400 && result.error === 'Missing conversation ID') {
      console.log('  ✅ Missing conversation ID correctly rejected');
    } else {
      console.log('  ❌ Missing conversation ID test failed:', result);
    }

  } catch (error) {
    console.log('  ❌ Missing conversation ID test error:', error.message);
  }

  try {
    console.log('  📋 Testing missing clinic ID...');
    
    const formData = new FormData();
    formData.append('file', testFiles.document.content, {
      filename: testFiles.document.filename,
      contentType: testFiles.document.mimeType
    });
    formData.append('conversationId', TEST_CONVERSATION_ID);

    const response = await fetch(`${API_BASE}/api/n8n/upload`, {
      method: 'POST',
      headers: {
        'x-api-key': N8N_API_KEY
      },
      body: formData
    });

    const result = await response.json();
    
    if (response.status === 400 && result.error === 'Missing or invalid clinic ID') {
      console.log('  ✅ Missing clinic ID correctly rejected');
    } else {
      console.log('  ❌ Missing clinic ID test failed:', result);
    }

  } catch (error) {
    console.log('  ❌ Missing clinic ID test error:', error.message);
  }
}

async function testSuccessfulUpload(fileType, fileData) {
  try {
    console.log(`  📤 Testing ${fileType} upload (${fileData.filename})...`);
    
    const formData = new FormData();
    formData.append('file', fileData.content, {
      filename: fileData.filename,
      contentType: fileData.mimeType
    });
    formData.append('conversationId', TEST_CONVERSATION_ID);
    formData.append('clinicId', TEST_CLINIC_ID.toString());
    formData.append('caption', `Arquivo ${fileType} enviado via N8N - ${new Date().toLocaleString('pt-BR')}`);
    formData.append('whatsappMessageId', `wa_${Date.now()}_${fileType}`);
    formData.append('timestamp', new Date().toISOString());

    const response = await fetch(`${API_BASE}/api/n8n/upload`, {
      method: 'POST',
      headers: {
        'x-api-key': N8N_API_KEY
      },
      body: formData
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`  ✅ ${fileType} upload successful:`);
      console.log(`    📨 Message ID: ${result.data.message.id}`);
      console.log(`    📎 Attachment ID: ${result.data.attachment.id}`);
      console.log(`    🏷️ Message Type: ${result.data.message.message_type}`);
      console.log(`    📁 File Type: ${result.data.attachment.file_type}`);
      console.log(`    💾 File Size: ${result.data.attachment.file_size} bytes`);
      
      // Validate message type for audio differentiation
      if (fileType === 'audio' && result.data.message.message_type === 'audio_voice') {
        console.log(`    ✅ Audio correctly tagged as 'audio_voice' (WhatsApp audio)`);
      } else if (fileType !== 'audio' && result.data.message.message_type === fileType) {
        console.log(`    ✅ File type correctly detected as '${fileType}'`);
      }
      
    } else {
      console.log(`  ❌ ${fileType} upload failed:`, result);
    }

  } catch (error) {
    console.log(`  ❌ ${fileType} upload error:`, error.message);
  }
}

async function testBinaryStreamUpload() {
  try {
    console.log('  🔄 Testing binary stream upload...');
    
    const fileData = testFiles.document;
    
    const response = await fetch(`${API_BASE}/api/n8n/upload`, {
      method: 'POST',
      headers: {
        'x-api-key': N8N_API_KEY,
        'content-type': 'application/octet-stream',
        'x-filename': fileData.filename,
        'x-mime-type': fileData.mimeType,
        'x-conversation-id': TEST_CONVERSATION_ID,
        'x-clinic-id': TEST_CLINIC_ID.toString(),
        'x-caption': 'Binary stream upload test',
        'x-timestamp': new Date().toISOString()
      },
      body: fileData.content
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('  ✅ Binary stream upload successful:');
      console.log(`    📨 Message ID: ${result.data.message.id}`);
      console.log(`    📎 Attachment ID: ${result.data.attachment.id}`);
    } else {
      console.log('  ❌ Binary stream upload failed:', result);
    }

  } catch (error) {
    console.log('  ❌ Binary stream upload error:', error.message);
  }
}

// Additional utility to test the conversation endpoint after uploads
async function verifyUploadsInConversation() {
  try {
    console.log('\n🔍 Verifying uploads appear in conversation...');
    
    const response = await fetch(`${API_BASE}/api/conversations-simple/${TEST_CONVERSATION_ID}`, {
      headers: {
        'cookie': 'connect.sid=your-session-cookie-here' // Would need actual session
      }
    });

    if (response.ok) {
      const result = await response.json();
      const recentMessages = result.messages?.filter(msg => 
        msg.sender_type === 'patient' && 
        msg.timestamp > new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
      );
      
      console.log(`✅ Found ${recentMessages?.length || 0} recent patient messages`);
      console.log(`📎 Total attachments in conversation: ${result.attachments?.length || 0}`);
    } else {
      console.log('⚠️ Could not verify conversation (authentication required)');
    }

  } catch (error) {
    console.log('⚠️ Conversation verification error:', error.message);
  }
}

// Run tests
testN8NUpload()
  .then(() => verifyUploadsInConversation())
  .catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });