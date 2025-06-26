/**
 * Test N8N Image Upload Fix
 * Validates that image preview works and no duplication occurs
 */

import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';

const API_BASE = 'http://localhost:5000';
const TEST_CONVERSATION_ID = '559887694034551150391104';
const TEST_CLINIC_ID = 1;
const API_KEY = 'e277a75d4fc5ae0e93c3746930b36ca0551185d6e7bafa8a110850076ad818c1';

// Create a simple test image (1x1 red pixel PNG)
const createTestImage = () => {
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // Width: 1
    0x00, 0x00, 0x00, 0x01, // Height: 1
    0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth: 8, Color type: 2, Compression: 0, Filter: 0, Interlace: 0
    0x90, 0x77, 0x53, 0xDE, // IHDR CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // Image data
    0xE2, 0x21, 0xBC, 0x33, // IDAT CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // IEND CRC
  ]);
  return pngHeader;
};

async function testN8NImageUpload() {
  console.log('🖼️ Testing N8N Image Upload Fix...\n');

  try {
    console.log('1️⃣ Creating test image...');
    const testImage = createTestImage();
    const filename = `test-image-${Date.now()}.png`;
    
    console.log('2️⃣ Uploading via N8N endpoint...');
    const formData = new FormData();
    formData.append('file', testImage, {
      filename: filename,
      contentType: 'image/png'
    });

    const uploadResponse = await fetch(`${API_BASE}/api/n8n/upload`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'X-Conversation-Id': TEST_CONVERSATION_ID,
        'X-Clinic-Id': TEST_CLINIC_ID,
        'X-Filename': filename,
        'X-Mime-Type': 'image/png',
        'X-Caption': 'Test image upload fix'
      },
      body: formData
    });

    const uploadResult = await uploadResponse.json();
    
    if (!uploadResponse.ok) {
      console.log('❌ Upload failed:', uploadResult);
      return;
    }

    console.log('✅ Upload successful!');
    console.log(`   📨 Message ID: ${uploadResult.data.message.id}`);
    console.log(`   📎 Attachment ID: ${uploadResult.data.attachment.id}`);
    console.log(`   🖼️ Filename: ${uploadResult.data.attachment.filename}`);
    console.log(`   🔗 Has signed URL: ${uploadResult.data.storage.signedUrl ? 'YES' : 'NO'}\n`);

    console.log('3️⃣ Checking conversation for image preview...');
    const conversationResponse = await fetch(`${API_BASE}/api/conversations-simple/${TEST_CONVERSATION_ID}`);
    const conversationData = await conversationResponse.json();
    
    if (conversationData.conversation && conversationData.conversation.messages) {
      const latestMessage = conversationData.conversation.messages[0];
      const hasAttachment = latestMessage.attachments && latestMessage.attachments.length > 0;
      
      if (hasAttachment) {
        const attachment = latestMessage.attachments[0];
        console.log('✅ Attachment found in conversation:');
        console.log(`   📝 Filename: ${attachment.file_name}`);
        console.log(`   🎭 Type: ${attachment.file_type}`);
        console.log(`   📏 Size: ${attachment.file_size} bytes`);
        console.log(`   🔗 URL: ${attachment.file_url ? 'Present' : 'Missing'}`);
        
        // Check if filename is correct (not "audio")
        if (attachment.file_name === filename) {
          console.log('✅ Filename preserved correctly');
        } else {
          console.log('❌ Filename issue:', attachment.file_name);
        }
        
        // Check if URL exists for image preview
        if (attachment.file_url) {
          console.log('✅ Image preview should work');
        } else {
          console.log('❌ Missing file URL - image preview will fail');
        }
        
      } else {
        console.log('❌ No attachment found in conversation');
      }
    }

    console.log('\n4️⃣ Checking for storage duplication...');
    // Check how many attachments exist for this conversation
    const attachmentCount = conversationData.conversation.messages
      .flatMap(msg => msg.attachments || [])
      .length;
    
    console.log(`📊 Total attachments in conversation: ${attachmentCount}`);
    
    if (attachmentCount > 5) {
      console.log('⚠️ Many attachments found - possible duplication issue');
    } else {
      console.log('✅ Attachment count looks normal');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

console.log('🧪 N8N Image Upload Fix Test\n');
testN8NImageUpload();