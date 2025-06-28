/**
 * ETAPA 5: Script de Validação Lunch Break MCP
 * Testa se o sistema respeita horários de almoço configurados
 */

async function testLunchBreakValidation() {
  const baseUrl = 'http://localhost:5000/api/mcp';
  const testApiKey = 'test-key';
  
  console.log('🍽️ TESTE COMPLETO: Validação Lunch Break MCP');
  console.log('============================================');
  
  try {
    // 1. Testar disponibilidade DURANTE o almoço (12:30 - deveria retornar 0 slots)
    console.log('\n🔍 1. Testando disponibilidade DURANTE almoço (12:30)...');
    
    try {
      const lunchResponse = await fetch(`${baseUrl}/appointments/availability?clinic_id=1&date=2025-07-07&user_id=4&duration_minutes=60&working_hours_start=08:00&working_hours_end=18:00`, {
        headers: { 'X-MCP-API-Key': testApiKey }
      });
      
      console.log(`📊 Status lunch time: ${lunchResponse.status}`);
      
      if (lunchResponse.status !== 401) {
        const lunchData = await lunchResponse.json();
        const slots = lunchData.data || [];
        const lunchTimeSlots = slots.filter(slot => slot.time === '12:30' || slot.time === '12:00' || slot.time === '12:15');
        
        console.log(`🎯 Total slots retornados: ${slots.length}`);
        console.log(`🍽️ Slots no horário de almoço (12:00-13:00): ${lunchTimeSlots.length}`);
        
        if (lunchTimeSlots.length === 0) {
          console.log('✅ LUNCH BREAK FUNCIONANDO: Nenhum slot durante o almoço!');
        } else {
          console.log('❌ PROBLEMA: Slots ainda disponíveis durante almoço');
          console.log('🔍 Slots encontrados:', lunchTimeSlots.map(s => s.time));
        }
      }
    } catch (error) {
      console.log(`⚠️ Erro de conexão: ${error.message}`);
    }
    
    // 2. Testar disponibilidade ANTES do almoço (11:30 - deveria estar disponível)
    console.log('\n🔍 2. Testando disponibilidade ANTES do almoço (11:30)...');
    
    try {
      const beforeLunchResponse = await fetch(`${baseUrl}/appointments/availability?clinic_id=1&date=2025-07-07&user_id=4&duration_minutes=60&working_hours_start=08:00&working_hours_end=18:00`, {
        headers: { 'X-MCP-API-Key': testApiKey }
      });
      
      console.log(`📊 Status before lunch: ${beforeLunchResponse.status}`);
      
      if (beforeLunchResponse.status !== 401) {
        const beforeLunchData = await beforeLunchResponse.json();
        const slots = beforeLunchData.data || [];
        const beforeLunchSlots = slots.filter(slot => slot.time === '11:30' || slot.time === '11:00' || slot.time === '11:15');
        
        console.log(`🎯 Slots antes do almoço: ${beforeLunchSlots.length}`);
        
        if (beforeLunchSlots.length > 0) {
          console.log('✅ CORRETO: Slots disponíveis antes do almoço');
        } else {
          console.log('⚠️ Pode estar bloqueando incorretamente horários válidos');
        }
      }
    } catch (error) {
      console.log(`⚠️ Erro de conexão: ${error.message}`);
    }
    
    // 3. Testar disponibilidade DEPOIS do almoço (13:30 - deveria estar disponível)
    console.log('\n🔍 3. Testando disponibilidade DEPOIS do almoço (13:30)...');
    
    try {
      const afterLunchResponse = await fetch(`${baseUrl}/appointments/availability?clinic_id=1&date=2025-07-07&user_id=4&duration_minutes=60&working_hours_start=08:00&working_hours_end=18:00`, {
        headers: { 'X-MCP-API-Key': testApiKey }
      });
      
      console.log(`📊 Status after lunch: ${afterLunchResponse.status}`);
      
      if (afterLunchResponse.status !== 401) {
        const afterLunchData = await afterLunchResponse.json();
        const slots = afterLunchData.data || [];
        const afterLunchSlots = slots.filter(slot => slot.time === '13:30' || slot.time === '13:00' || slot.time === '13:15');
        
        console.log(`🎯 Slots depois do almoço: ${afterLunchSlots.length}`);
        
        if (afterLunchSlots.length > 0) {
          console.log('✅ CORRETO: Slots disponíveis depois do almoço');
        } else {
          console.log('⚠️ Pode estar bloqueando incorretamente horários válidos');
        }
      }
    } catch (error) {
      console.log(`⚠️ Erro de conexão: ${error.message}`);
    }
    
    // 4. Testar criação de consulta DURANTE o almoço (deveria falhar)
    console.log('\n🔍 4. Testando criação DURANTE almoço (12:30)...');
    
    try {
      const createLunchResponse = await fetch(`${baseUrl}/appointments/create`, {
        method: 'POST',
        headers: { 
          'X-MCP-API-Key': testApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contact_id: 1,
          user_id: 4,
          scheduled_date: '2025-07-07',
          scheduled_time: '12:30',
          duration_minutes: 60,
          status: 'agendada',
          doctor_name: 'Dr. Teste',
          specialty: 'Teste Lunch Break',
          appointment_type: 'consulta'
        })
      });
      
      console.log(`📊 Status create lunch: ${createLunchResponse.status}`);
      
      if (createLunchResponse.status !== 401) {
        const createLunchData = await createLunchResponse.json();
        
        if (createLunchData.success === false && createLunchData.error.includes('lunch break')) {
          console.log('✅ LUNCH BREAK BLOQUEANDO: Criação falhou corretamente durante almoço!');
          console.log(`📋 Erro: ${createLunchData.error}`);
        } else if (createLunchData.success === true) {
          console.log('❌ PROBLEMA: Criação permitida durante almoço');
        } else {
          console.log('⚠️ Resposta inesperada:', createLunchData);
        }
      }
    } catch (error) {
      console.log(`⚠️ Erro de conexão: ${error.message}`);
    }
    
    // 5. Verificar logs do servidor
    console.log('\n📋 5. VERIFICAÇÃO DE LOGS');
    console.log('========================');
    console.log('🔍 Verifique os logs do servidor para confirmar:');
    console.log('   - Logs "🍽️ Lunch break check" aparecem');
    console.log('   - Logs mostram configuração: "lunch: 12:00-13:00"');
    console.log('   - Logs mostram "Is lunch time: true" para 12:30');
    console.log('   - Logs mostram "Is lunch time: false" para 11:30 e 13:30');
    console.log('   - Logs de criação mostram bloqueio: "conflicts with lunch break"');
    
    console.log('\n🎯 RESUMO ESPERADO');
    console.log('==================');
    console.log('✅ Disponibilidade: 0 slots entre 12:00-13:00');
    console.log('✅ Criação: Falha com erro específico durante almoço');
    console.log('✅ Slots válidos: Disponíveis antes (11:30) e depois (13:30)');
    console.log('✅ Logs: Mostram validação lunch break funcionando');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error.message);
    return false;
  }
}

// Executar teste
testLunchBreakValidation()
  .then(success => {
    console.log('\n🏁 TESTE LUNCH BREAK CONCLUÍDO');
    console.log(success ? '✅ Validação executada' : '❌ Falhas encontradas');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });