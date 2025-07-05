import { createClient } from '@supabase/supabase-js';

async function consultarDados() {
  console.log('🔍 CONSULTANDO DADOS DO BANCO');
  console.log('============================\n');

  const SUPABASE_URL = 'https://lkwrevhxugaxfpwiktdy.supabase.co';
  const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrd3Jldmh4dWdheGZwd2lrdGR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTgyODQ2MywiZXhwIjoyMDY1NDA0NDYzfQ.Ty6qHcLKLZNKqsxJmJvhKzqEYLKL8iQqUmZvmqjnXJo';
  
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    
    console.log('📊 1. Consultando número de clínicas...');
    const { data: clinicsData, error: clinicsError } = await supabase
      .from('clinics')
      .select('*', { count: 'exact', head: true });
      
    if (clinicsError) {
      console.log('❌ Erro ao consultar clínicas:', clinicsError.message);
    } else {
      console.log(`✅ Total de clínicas: ${clinicsData?.length || 0}`);
    }

    console.log('\n📅 2. Consultando número de agendamentos...');
    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });
      
    if (appointmentsError) {
      console.log('❌ Erro ao consultar agendamentos:', appointmentsError.message);
    } else {
      console.log(`✅ Total de agendamentos: ${appointmentsData?.length || 0}`);
    }

    // Consulta alternativa usando count()
    console.log('\n📊 3. Usando consulta COUNT...');
    
    const { count: clinicsCount, error: clinicsCountError } = await supabase
      .from('clinics')
      .select('*', { count: 'exact', head: true });
      
    if (clinicsCountError) {
      console.log('❌ Erro no count de clínicas:', clinicsCountError.message);
    } else {
      console.log(`✅ Count de clínicas: ${clinicsCount}`);
    }

    const { count: appointmentsCount, error: appointmentsCountError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });
      
    if (appointmentsCountError) {
      console.log('❌ Erro no count de agendamentos:', appointmentsCountError.message);
    } else {
      console.log(`✅ Count de agendamentos: ${appointmentsCount}`);
    }

    // Listar algumas clínicas para verificar estrutura
    console.log('\n🏥 4. Listando clínicas (primeiras 3)...');
    const { data: clinicsList, error: clinicsListError } = await supabase
      .from('clinics')
      .select('id, name, created_at')
      .limit(3);
      
    if (clinicsListError) {
      console.log('❌ Erro ao listar clínicas:', clinicsListError.message);
    } else {
      console.log('✅ Clínicas encontradas:');
      clinicsList?.forEach(clinic => {
        console.log(`   - ${clinic.name} (ID: ${clinic.id})`);
      });
    }

    // Listar alguns agendamentos para verificar estrutura
    console.log('\n📅 5. Listando agendamentos (primeiros 3)...');
    const { data: appointmentsList, error: appointmentsListError } = await supabase
      .from('appointments')
      .select('id, title, start_time, end_time, status')
      .limit(3);
      
    if (appointmentsListError) {
      console.log('❌ Erro ao listar agendamentos:', appointmentsListError.message);
    } else {
      console.log('✅ Agendamentos encontrados:');
      appointmentsList?.forEach(appointment => {
        console.log(`   - ${appointment.title} (${appointment.start_time} - ${appointment.status})`);
      });
    }

  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

consultarDados().catch(console.error); 