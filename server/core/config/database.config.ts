import { createClient } from '@supabase/supabase-js';

/**
 * Configuração do Supabase
 * Refatorado de: railway-server.ts (linhas 28-45)
 * Módulo: Database Configuration
 */
export function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('❌ Variáveis de ambiente do Supabase não configuradas');
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('🔌 Configurando Supabase Admin client...');
  return supabaseAdmin;
}

/**
 * Teste de conexão com Supabase
 * Refatorado de: railway-server.ts (linhas 55-98)
 * Módulo: Database Health Check
 */
export async function testSupabaseConnection() {
  try {
    console.log('🔍 Testando conexão com Supabase...');
    console.log('🔍 URL:', process.env.SUPABASE_URL);
    console.log('🔍 Service Role Key length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);

    const supabaseAdmin = createSupabaseClient();
    
    // Test basic connection
    const { data, error } = await supabaseAdmin
      .from('contacts')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Erro na primeira tentativa:', error.message);
      
      // Fallback configuration
      console.log('🔄 Tentando configuração alternativa...');
      const altClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      const { data: altData, error: altError } = await altClient
        .from('contacts')
        .select('count')
        .limit(1);

      if (altError) {
        console.error('❌ Erro na configuração alternativa:', altError);
        return false;
      }

      console.log('✅ Conexão alternativa bem-sucedida');
      return true;
    }

    console.log('✅ Conexão com Supabase estabelecida');
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar conexão Supabase:', error);
    return false;
  }
} 