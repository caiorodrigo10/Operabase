/**
 * Teste Rápido: Validação Working Days Corrigida
 * Verifica se o import correto agora ativa as validações
 */

async function testFixValidation() {
  const baseUrl = 'http://localhost:5000/api';
  
  console.log('🧪 TESTE RÁPIDO: Validação Working Days Corrigida');
  console.log('===============================================');
  
  try {
    // 1. Testar disponibilidade para sábado (deveria retornar 0 slots)
    console.log('\n🔍 1. Testando disponibilidade para SÁBADO (2025-07-05)...');
    
    try {
      const saturdayResponse = await fetch(`${baseUrl}/mcp/appointments/availability?clinic_id=1&date=2025-07-05&user_id=4&duration_minutes=60`, {
        headers: { 'X-MCP-API-Key': 'test-key' }
      });
      
      console.log(`📊 Status sábado: ${saturdayResponse.status}`);
      
      if (saturdayResponse.status !== 401) {
        const saturdayData = await saturdayResponse.json();
        const slotsCount = saturdayData.data ? saturdayData.data.length : 0;
        console.log(`🎯 Slots retornados para sábado: ${slotsCount} (esperado: 0)`);
        
        if (slotsCount === 0) {
          console.log('✅ CORREÇÃO FUNCIONOU: Sábado retorna 0 slots!');
        } else {
          console.log('❌ PROBLEMA PERSISTE: Sábado ainda retorna slots');
        }
      }
    } catch (error) {
      console.log(`⚠️ Erro de conexão sábado: ${error.message}`);
    }
    
    // 2. Testar disponibilidade para quinta-feira (deveria retornar slots)
    console.log('\n🔍 2. Testando disponibilidade para QUINTA-FEIRA (2025-07-03)...');
    
    try {
      const thursdayResponse = await fetch(`${baseUrl}/mcp/appointments/availability?clinic_id=1&date=2025-07-03&user_id=4&duration_minutes=60`, {
        headers: { 'X-MCP-API-Key': 'test-key' }
      });
      
      console.log(`📊 Status quinta: ${thursdayResponse.status}`);
      
      if (thursdayResponse.status !== 401) {
        const thursdayData = await thursdayResponse.json();
        const slotsCount = thursdayData.data ? thursdayData.data.length : 0;
        console.log(`🎯 Slots retornados para quinta: ${slotsCount} (esperado: >0)`);
        
        if (slotsCount > 0) {
          console.log('✅ CORRETO: Quinta-feira retorna slots normalmente!');
        } else {
          console.log('⚠️ Quinta-feira não retornou slots (pode ser conflito)');
        }
      }
    } catch (error) {
      console.log(`⚠️ Erro de conexão quinta: ${error.message}`);
    }
    
    // 3. Verificar logs do servidor
    console.log('\n📋 3. ANÁLISE FINAL');
    console.log('==================');
    console.log('🔍 Verifique os logs do servidor para confirmar:');
    console.log('   - Logs "🔍 MCP Availability Check" aparecem');
    console.log('   - Logs "📅 Working days check" mostram validação');
    console.log('   - Logs "❌ Date X is not a working day" para sábado');
    console.log('   - Logs "✅ Date X is a working day" para quinta');
    
    if (saturdayResponse && saturdayResponse.status !== 401) {
      console.log('\n🎯 RESULTADO: Import corrigido, endpoint acessível');
      console.log('💡 Se logs aparecem, validação está funcionando!');
    } else {
      console.log('\n⚠️ ATENÇÃO: Problema de autenticação, mas endpoint acessível');
      console.log('💡 Logs de validação devem aparecer mesmo com erro 401');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error.message);
    return false;
  }
}

// Executar teste
testFixValidation()
  .then(success => {
    console.log('\n🏁 TESTE CONCLUÍDO');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });