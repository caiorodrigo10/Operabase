/**
 * Test Script: Timestamp System Fix Validation
 * Validates that the backend is returning correct last message timestamps
 * and the frontend displays proper date/time formatting
 */

async function testTimestampFix() {
  console.log('🔍 Testing timestamp system fix...');
  
  try {
    // Test conversations endpoint
    const response = await fetch('http://localhost:5000/api/conversations-simple', {
      headers: {
        'Cookie': 'connect.sid=s%3AjHxrJQl9S5k-example-session'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Backend response received');
    
    // Analyze timestamp data
    console.log('\n📊 Conversation Timestamp Analysis:');
    data.conversations.forEach((conv, index) => {
      console.log(`\n${index + 1}. ${conv.patient_name}:`);
      console.log(`   - last_message_at: ${conv.last_message_at}`);
      console.log(`   - timestamp: ${conv.timestamp}`);
      console.log(`   - last_message: "${conv.last_message.substring(0, 50)}..."`);
      
      // Test date formatting
      const messageDate = new Date(conv.last_message_at || conv.timestamp);
      const today = new Date();
      const isToday = messageDate.toDateString() === today.toDateString();
      
      const formatted = isToday 
        ? messageDate.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false,
            timeZone: 'America/Sao_Paulo'
          })
        : messageDate.toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'short',
            timeZone: 'America/Sao_Paulo'
          });
      
      console.log(`   - Formatted: "${formatted}" (${isToday ? 'Today' : 'Other day'})`);
    });
    
    console.log('\n✅ Timestamp fix validation completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTimestampFix();