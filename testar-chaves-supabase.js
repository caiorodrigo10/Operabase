import { createClient } from '@supabase/supabase-js';

async function testarChaves() {
  console.log('🔑 TESTANDO CHAVES DO SUPABASE');
  console.log('=============================\n');

  const SUPABASE_URL = 'https://lkwrevhxugaxfpwiktdy.supabase.co';
  
  // Testar chave anon
  console.log('📋 1. Testando chave ANON...');
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrd3Jldmh4dWdheGZwd2lrdGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4Mjg0NjMsImV4cCI6MjA2NTQwNDQ2M30.sWOsGKa_PWfjth6iaXcTpyGa95xmGZO_vnBnrFnK-sc';
  
  try {
    const supabaseAnon = createClient(SUPABASE_URL, ANON_KEY);
    
    const { data, error } = await supabaseAnon
      .from('users')
      .select('count')
      .limit(1);
      
    if (error) {
      console.log('❌ Chave ANON inválida:', error.message);
    } else {
      console.log('✅ Chave ANON válida');
    }
  } catch (e) {
    console.log('❌ Erro com chave ANON:', e.message);
  }

  // Testar chave service_role
  console.log('\n📋 2. Testando chave SERVICE_ROLE...');
  const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrd3Jldmh4dWdheGZwd2lrdGR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTgyODQ2MywiZXhwIjoyMDY1NDA0NDYzfQ.Ty6qHcLKLZNKqsxJmJvhKzqEYLKL8iQqUmZvmqjnXJo';
  
  try {
    const supabaseService = createClient(SUPABASE_URL, SERVICE_KEY);
    
    const { data, error } = await supabaseService
      .from('users')
      .select('count')
      .limit(1);
      
    if (error) {
      console.log('❌ Chave SERVICE_ROLE inválida:', error.message);
    } else {
      console.log('✅ Chave SERVICE_ROLE válida');
    }
  } catch (e) {
    console.log('❌ Erro com chave SERVICE_ROLE:', e.message);
  }

  // Testar inserção com service_role
  console.log('\n📋 3. Testando inserção com SERVICE_ROLE...');
  try {
    const supabaseService = createClient(SUPABASE_URL, SERVICE_KEY);
    
    // Tentar inserir um registro de teste
    const { data, error } = await supabaseService
      .from('clinics')
      .insert([
        {
          name: 'Teste Clínica',
          work_start: '08:00',
          work_end: '18:00',
          lunch_start: '12:00',
          lunch_end: '13:00',
          has_lunch_break: true,
          working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          timezone: 'America/Sao_Paulo'
        }
      ])
      .select()
      .single();
      
    if (error) {
      console.log('❌ Erro ao inserir:', error.message);
      console.log('   Detalhes:', error);
    } else {
      console.log('✅ Inserção bem-sucedida:', data.name);
      
      // Remover o registro de teste
      await supabaseService
        .from('clinics')
        .delete()
        .eq('id', data.id);
      console.log('✅ Registro de teste removido');
    }
  } catch (e) {
    console.log('❌ Erro na inserção:', e.message);
  }

  // Verificar estrutura da tabela
  console.log('\n📋 4. Verificando estrutura das tabelas...');
  try {
    const supabaseService = createClient(SUPABASE_URL, SERVICE_KEY);
    
    // Listar tabelas disponíveis
    const { data, error } = await supabaseService.rpc('get_schema', {});
    
    if (error) {
      console.log('❌ Erro ao verificar schema:', error.message);
    } else {
      console.log('✅ Schema verificado');
    }
  } catch (e) {
    console.log('⚠️ Não foi possível verificar schema (normal)');
  }

  console.log('\n🔍 DIAGNÓSTICO FINAL:');
  console.log('Se as chaves estão válidas mas ainda há erro "Invalid API key",');
  console.log('pode ser um problema de RLS (Row Level Security) ou permissões.');
}

testarChaves().catch(console.error); 