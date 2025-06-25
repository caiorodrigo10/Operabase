/**
 * Script para forçar algumas mensagens com status 'failed' para testar indicador visual
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceEvolutionFailure() {
  console.log('🔧 Forçando status "failed" em mensagens recentes para teste...');
  
  try {
    // Marcar as últimas 3 mensagens enviadas como 'failed'
    const { data: recentMessages, error: fetchError } = await supabase
      .from('messages')
      .select('id, content, evolution_status')
      .eq('conversation_id', '5511965860124551150391104')
      .eq('sender_type', 'professional')
      .order('timestamp', { ascending: false })
      .limit(3);
    
    if (fetchError) {
      console.error('❌ Error fetching messages:', fetchError);
      return;
    }
    
    console.log('📋 Messages found:', recentMessages?.length);
    console.log('💾 Current status:', recentMessages?.map(m => ({id: m.id, content: m.content?.substring(0, 30), status: m.evolution_status})));
    
    if (recentMessages && recentMessages.length > 0) {
      const messageIds = recentMessages.map(m => m.id);
      
      const { error: updateError } = await supabase
        .from('messages')
        .update({ evolution_status: 'failed' })
        .in('id', messageIds);
      
      if (updateError) {
        console.error('❌ Error updating messages:', updateError);
        return;
      }
      
      console.log('✅ Updated', messageIds.length, 'messages to failed status:', messageIds);
      console.log('🔍 Messages that should now show red triangle indicator');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

forceEvolutionFailure();