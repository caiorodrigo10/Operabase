import { createClient } from '@supabase/supabase-js';

async function consultarComAnon() {
  console.log('🔍 CONSULTANDO DADOS COM CHAVE ANON');
  console.log('===================================\n');

  const SUPABASE_URL = 'https://lkwrevhxugaxfpwiktdy.supabase.co';
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrd3Jldmh4dWdheGZwd2lrdGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4Mjg0NjMsImV4cCI6MjA2NTQwNDQ2M30.sWOsGKa_PWfjth6iaXcTpyGa95xmGZO_vnBnrFnK-sc';
  
  try {
    const supabase = createClient(SUPABASE_URL, ANON_KEY);
    
    console.log('📊 1. Testando acesso às tabelas...');
    
    // Tentar acessar tabela de clínicas
    console.log('\n🏥 Testando tabela CLINICS...');
    const { data: clinicsData, error: clinicsError, count: clinicsCount } = await supabase
      .from('clinics')
      .select('*', { count: 'exact' })
      .limit(3);
      
    if (clinicsError) {
      console.log('❌ Erro ao acessar clínicas:', clinicsError.message);
      console.log('   Detalhes:', clinicsError.hint || 'Sem detalhes');
    } else {
      console.log(`✅ Tabela CLINICS acessível - Total: ${clinicsCount} registros`);
      if (clinicsData && clinicsData.length > 0) {
        console.log('   Primeiras clínicas:');
        clinicsData.forEach(clinic => {
          console.log(`   - ${clinic.name || clinic.id}`);
        });
      } else {
        console.log('   Nenhuma clínica encontrada');
      }
    }

    // Tentar acessar tabela de agendamentos
    console.log('\n📅 Testando tabela APPOINTMENTS...');
    const { data: appointmentsData, error: appointmentsError, count: appointmentsCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact' })
      .limit(3);
      
    if (appointmentsError) {
      console.log('❌ Erro ao acessar agendamentos:', appointmentsError.message);
      console.log('   Detalhes:', appointmentsError.hint || 'Sem detalhes');
    } else {
      console.log(`✅ Tabela APPOINTMENTS acessível - Total: ${appointmentsCount} registros`);
      if (appointmentsData && appointmentsData.length > 0) {
        console.log('   Primeiros agendamentos:');
        appointmentsData.forEach(appointment => {
          console.log(`   - ${appointment.title || appointment.id} (${appointment.start_time})`);
        });
      } else {
        console.log('   Nenhum agendamento encontrado');
      }
    }

    // Tentar outras tabelas comuns
    console.log('\n👥 Testando tabela USERS...');
    const { data: usersData, error: usersError, count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .limit(3);
      
    if (usersError) {
      console.log('❌ Erro ao acessar usuários:', usersError.message);
    } else {
      console.log(`✅ Tabela USERS acessível - Total: ${usersCount} registros`);
    }

    console.log('\n📋 Testando tabela PROFILES...');
    const { data: profilesData, error: profilesError, count: profilesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .limit(3);
      
    if (profilesError) {
      console.log('❌ Erro ao acessar profiles:', profilesError.message);
    } else {
      console.log(`✅ Tabela PROFILES acessível - Total: ${profilesCount} registros`);
    }

  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }

  console.log('\n🔍 RESUMO:');
  console.log('- Chave ANON está funcionando');
  console.log('- Problemas podem ser relacionados a RLS (Row Level Security)');
  console.log('- Talvez precisemos de autenticação de usuário para acessar os dados');
}

consultarComAnon().catch(console.error); 