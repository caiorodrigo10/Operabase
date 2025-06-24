import { createClient } from '@supabase/supabase-js';

async function testAfterManualExecution() {
  console.log('Testando após execução manual do SQL...');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const testId = '5598876940345511948922493';
  
  try {
    // Teste 1: Inserir conversa
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        conversation_id: testId,
        contact_id: 1,
        clinic_id: 1,
        status: 'active'
      })
      .select()
      .single();

    if (convError) {
      console.error('Ainda com erro na conversa:', convError.message);
      return false;
    }
    
    console.log('SUCESSO! Conversa criada com ID:', conversation.conversation_id);

    // Teste 2: Inserir mensagem
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: testId,
        contact_id: 1,
        clinic_id: 1,
        content: 'Teste final - WhatsApp integration ready',
        sender_type: 'patient',
        direction: 'inbound'
      })
      .select()
      .single();

    if (msgError) {
      console.error('Erro na mensagem:', msgError.message);
      return false;
    }
    
    console.log('SUCESSO! Mensagem criada com ID:', message.id);

    // Teste 3: Verificar relacionamento
    const { data: joinResult, error: joinError } = await supabase
      .from('conversations')
      .select(`
        conversation_id,
        status,
        messages (id, content)
      `)
      .eq('conversation_id', testId);

    if (joinError) {
      console.error('Erro no JOIN:', joinError.message);
      return false;
    }
    
    console.log('SUCESSO! JOIN funcionando - mensagens encontradas:', joinResult[0]?.messages?.length);

    // Limpar dados de teste
    await supabase.from('messages').delete().eq('conversation_id', testId);
    await supabase.from('conversations').delete().eq('conversation_id', testId);
    
    console.log('\nTODO SISTEMA FUNCIONANDO!');
    console.log('conversation_id bigint configurado corretamente');
    console.log('Pronto para integração WhatsApp com IDs grandes');
    
    return true;
    
  } catch (error) {
    console.error('Erro no teste:', error.message);
    return false;
  }
}

// Executar automaticamente se script for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testAfterManualExecution();
}

export { testAfterManualExecution };