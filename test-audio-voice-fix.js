/**
 * Teste para validar correção do sistema de áudio gravado
 * Verifica se rota específica está funcionando e usando endpoint correto
 */

import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function testAudioVoiceFix() {
  console.log('🎤 TESTE: Iniciando validação do sistema de áudio gravado...\n');
  
  try {
    // 1. Verificar se as rotas estão registradas corretamente
    console.log('🔍 ETAPA 1: Verificando logs do servidor...');
    const fetch = await import('node-fetch');
    
    // Criar arquivo de áudio simulado para teste
    const audioBuffer = Buffer.from('MOCK_AUDIO_CONTENT_FOR_TESTING');
    
    // 2. Testar rota específica de áudio gravado
    console.log('🎤 ETAPA 2: Testando rota específica /upload-voice...');
    
    const form = new FormData();
    form.append('file', audioBuffer, {
      filename: 'gravacao_test_' + Date.now() + '.webm',
      contentType: 'audio/webm'
    });
    form.append('caption', 'Teste de áudio gravado via rota específica');
    
    const response = await fetch.default('http://localhost:5000/api/conversations/5511965860124551150391104/upload-voice', {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders()
      }
    });
    
    console.log('📊 RESPOSTA DA ROTA /upload-voice:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('Body:', responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
      console.log('\n✅ RESULTADO ESTRUTURADO:');
      console.log('- Success:', result.success);
      console.log('- Message:', result.message);
      console.log('- Message Type:', result.data?.message?.message_type);
      console.log('- WhatsApp Sent:', result.data?.whatsapp?.sent);
      console.log('- WhatsApp Error:', result.data?.whatsapp?.error);
    } catch (parseError) {
      console.error('❌ Erro ao parsear resposta:', parseError.message);
    }
    
    // 3. Verificar registros no console do servidor
    console.log('\n🔍 ETAPA 3: Validação dos logs...');
    console.log('Verifique no console do servidor se apareceram:');
    console.log('- 🎤 ROTA ISOLADA ÁUDIO GRAVADO ATIVADA');
    console.log('- 🎤 BYPASS DIRETO - Payload /sendWhatsAppAudio');
    console.log('- Uso do campo "audio" no payload (não "media")');
    console.log('- Endpoint /sendWhatsAppAudio (não /sendMedia)');
    
    // 4. Resultado final
    console.log('\n📋 RESUMO DO TESTE:');
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Rota específica de áudio FUNCIONANDO');
      
      if (result?.data?.message?.message_type === 'audio_voice') {
        console.log('✅ Tipo de mensagem correto: audio_voice');
      } else {
        console.log('❌ Tipo de mensagem incorreto:', result?.data?.message?.message_type);
      }
      
      if (result?.success) {
        console.log('✅ Upload processado com sucesso');
      } else {
        console.log('⚠️ Upload processado com avisos');
      }
    } else {
      console.log('❌ Falha na rota específica de áudio');
      console.log('Status:', response.status);
      console.log('Resposta:', responseText);
    }
    
    console.log('\n🎯 PONTOS CRÍTICOS A VERIFICAR:');
    console.log('1. Logs devem mostrar uso de /sendWhatsAppAudio (não /sendMedia)');
    console.log('2. Payload deve ter campo "audio" (não "media")');
    console.log('3. message_type deve ser "audio_voice"');
    console.log('4. Rota específica deve ser executada, não a genérica');
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar teste
testAudioVoiceFix();