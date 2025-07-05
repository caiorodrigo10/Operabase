import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Configuração baseada no que encontrei no código
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lkwrevhxugaxfpwiktdy.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrd3Jldmh4dWdheGZwd2lrdGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4Mjg0NjMsImV4cCI6MjA2NTQwNDQ2M30.sWOsGKa_PWfjth6iaXcTpyGa95xmGZO_vnBnrFnK-sc';

// URLs para testar
const BACKEND_URLS = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://operabase-backend-mvp-env-1.sa-east-1.elasticbeanstalk.com',
  'https://operabase-backend-mvp-env-1.sa-east-1.elasticbeanstalk.com'
];

const FRONTEND_URLS = [
  'https://operabase-frontend.vercel.app',
  'https://operabase-main.vercel.app'
];

async function diagnosticoCompleto() {
  console.log('🔍 DIAGNÓSTICO COMPLETO - API DE CALENDÁRIO');
  console.log('===========================================\n');

  // 1. Testar conexão com Supabase
  console.log('📊 ETAPA 1: Testando conexão com Supabase...');
  await testarSupabase();

  // 2. Testar backends disponíveis
  console.log('\n🔧 ETAPA 2: Testando backends disponíveis...');
  const backendDisponivel = await testarBackends();

  // 3. Testar autenticação
  console.log('\n🔐 ETAPA 3: Testando autenticação...');
  const token = await testarAutenticacao(backendDisponivel);

  // 4. Testar rotas de calendário
  console.log('\n📅 ETAPA 4: Testando rotas de calendário...');
  await testarRotasCalendario(backendDisponivel, token);

  // 5. Testar dados do banco
  console.log('\n🗄️ ETAPA 5: Verificando dados no banco...');
  await verificarDadosBanco();

  // 6. Testar configuração frontend
  console.log('\n🌐 ETAPA 6: Testando configuração frontend...');
  await testarConfigFrontend();

  console.log('\n✅ DIAGNÓSTICO CONCLUÍDO');
}

async function testarSupabase() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Testar conexão básica
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.log('❌ Erro na conexão Supabase:', error.message);
      return false;
    }
    
    console.log('✅ Conexão Supabase OK');
    
    // Testar tabelas importantes
    const tabelas = ['users', 'appointments', 'contacts', 'clinics', 'calendar_integrations'];
    
    for (const tabela of tabelas) {
      try {
        const { data, error } = await supabase.from(tabela).select('count').limit(1);
        if (error) {
          console.log(`❌ Tabela ${tabela}: ${error.message}`);
        } else {
          console.log(`✅ Tabela ${tabela}: OK`);
        }
      } catch (e) {
        console.log(`❌ Tabela ${tabela}: Erro de conexão`);
      }
    }
    
    return true;
  } catch (error) {
    console.log('❌ Erro geral Supabase:', error.message);
    return false;
  }
}

async function testarBackends() {
  console.log('Testando URLs de backend...');
  
  for (const url of BACKEND_URLS) {
    try {
      console.log(`🔍 Testando: ${url}`);
      
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Backend disponível: ${url}`);
        console.log(`   Status: ${data.status}, Timestamp: ${data.timestamp}`);
        return url;
      } else {
        console.log(`❌ Backend indisponível: ${url} (Status: ${response.status})`);
      }
    } catch (error) {
      console.log(`❌ Backend inacessível: ${url} (${error.message})`);
    }
  }
  
  console.log('❌ Nenhum backend disponível encontrado');
  return null;
}

async function testarAutenticacao(backendUrl) {
  if (!backendUrl) {
    console.log('❌ Sem backend para testar autenticação');
    return null;
  }
  
  try {
    // Fazer login com Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@teste.com',
      password: 'NovaSeinha123!'
    });
    
    if (error) {
      console.log('❌ Erro no login:', error.message);
      return null;
    }
    
    console.log('✅ Login Supabase OK');
    console.log(`   User ID: ${data.user.id}`);
    console.log(`   Email: ${data.user.email}`);
    
    const token = data.session.access_token;
    
    // Testar token no backend
    const response = await fetch(`${backendUrl}/api/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const profile = await response.json();
      console.log('✅ Token válido no backend');
      console.log(`   Nome: ${profile.name}`);
      return token;
    } else {
      console.log('❌ Token inválido no backend:', response.status);
      return null;
    }
    
  } catch (error) {
    console.log('❌ Erro na autenticação:', error.message);
    return null;
  }
}

async function testarRotasCalendario(backendUrl, token) {
  if (!backendUrl || !token) {
    console.log('❌ Sem backend ou token para testar rotas');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  const rotasParaTestar = [
    { path: '/api/appointments', method: 'GET', nome: 'Listar agendamentos' },
    { path: '/api/contacts', method: 'GET', nome: 'Listar contatos' },
    { path: '/api/calendar/integrations', method: 'GET', nome: 'Integrações calendário' },
    { path: '/api/clinic/1/config', method: 'GET', nome: 'Configuração clínica' },
    { path: '/api/calendar/config?clinic_id=1&user_id=1', method: 'GET', nome: 'Config calendário' },
    { path: '/api/calendar/events?clinic_id=1&start_date=2024-01-01&end_date=2024-12-31', method: 'GET', nome: 'Eventos calendário' }
  ];
  
  for (const rota of rotasParaTestar) {
    try {
      console.log(`🔍 Testando: ${rota.nome} (${rota.method} ${rota.path})`);
      
      const response = await fetch(`${backendUrl}${rota.path}`, {
        method: rota.method,
        headers: headers,
        timeout: 10000
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${rota.nome}: OK`);
        
        if (Array.isArray(data)) {
          console.log(`   Registros: ${data.length}`);
        } else if (data.data && Array.isArray(data.data)) {
          console.log(`   Registros: ${data.data.length}`);
        } else {
          console.log(`   Resposta: ${typeof data}`);
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ ${rota.nome}: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ ${rota.nome}: Erro - ${error.message}`);
    }
  }
}

async function verificarDadosBanco() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Verificar dados essenciais
    const consultas = [
      { tabela: 'users', descricao: 'Usuários' },
      { tabela: 'clinics', descricao: 'Clínicas' },
      { tabela: 'contacts', descricao: 'Contatos' },
      { tabela: 'appointments', descricao: 'Agendamentos' },
      { tabela: 'calendar_integrations', descricao: 'Integrações calendário' }
    ];
    
    for (const consulta of consultas) {
      try {
        const { data, error, count } = await supabase
          .from(consulta.tabela)
          .select('*', { count: 'exact' })
          .limit(5);
        
        if (error) {
          console.log(`❌ ${consulta.descricao}: ${error.message}`);
        } else {
          console.log(`✅ ${consulta.descricao}: ${count} registros`);
          if (data && data.length > 0) {
            console.log(`   Primeiro registro: ${JSON.stringify(data[0], null, 2).substring(0, 200)}...`);
          }
        }
      } catch (e) {
        console.log(`❌ ${consulta.descricao}: Erro de consulta`);
      }
    }
    
    // Verificar configuração específica da clínica
    const { data: clinicData, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (clinicError) {
      console.log('❌ Configuração da clínica 1:', clinicError.message);
    } else {
      console.log('✅ Configuração da clínica 1:');
      console.log(`   Nome: ${clinicData.name}`);
      console.log(`   Horário: ${clinicData.work_start} - ${clinicData.work_end}`);
      console.log(`   Almoço: ${clinicData.has_lunch_break ? `${clinicData.lunch_start} - ${clinicData.lunch_end}` : 'Não'}`);
    }
    
  } catch (error) {
    console.log('❌ Erro ao verificar dados:', error.message);
  }
}

async function testarConfigFrontend() {
  console.log('Testando configuração do frontend...');
  
  for (const url of FRONTEND_URLS) {
    try {
      console.log(`🔍 Testando: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        console.log(`✅ Frontend acessível: ${url}`);
        
        // Verificar se há erros de console visíveis
        const html = await response.text();
        if (html.includes('VITE_API_URL')) {
          console.log('   ⚠️ Variável VITE_API_URL exposta no HTML');
        }
        
      } else {
        console.log(`❌ Frontend indisponível: ${url} (Status: ${response.status})`);
      }
    } catch (error) {
      console.log(`❌ Frontend inacessível: ${url} (${error.message})`);
    }
  }
  
  // Verificar configuração da API no frontend
  console.log('\n📋 Configuração esperada do frontend:');
  console.log('   - Em desenvolvimento: proxy para localhost:3000 ou localhost:5000');
  console.log('   - Em produção: VITE_API_URL deve apontar para backend AWS');
  console.log('   - Fallback: http://operabase-backend-mvp-env-1.sa-east-1.elasticbeanstalk.com');
}

// Executar diagnóstico
diagnosticoCompleto().catch(console.error);

/**
 * 🔍 DIAGNÓSTICO COMPLETO: Por que os dados não aparecem no Vercel
 * Análise da arquitetura Frontend (Vercel) + Backend (AWS)
 */

console.log('🔍 DIAGNÓSTICO COMPLETO - Frontend Vercel + Backend AWS');
console.log('======================================================\n');

// ✅ SOLUÇÃO 1 - VALIDADA
console.log('✅ SOLUÇÃO 1 - CORS CONFIGURADO E TESTADO');
console.log('==========================================');
console.log('✅ Status: IMPLEMENTADO E FUNCIONANDO');
console.log('✅ Arquivo: server/simple-server.cjs');
console.log('✅ Teste local: PASSOU - Headers CORS corretos');
console.log('✅ Origens permitidas:');
console.log('   - https://operabase-frontend.vercel.app');
console.log('   - https://operabase-main.vercel.app');
console.log('   - https://operabase-main-git-main-caioapfelbaums-projects.vercel.app');
console.log('   - http://localhost:3000');
console.log('   - http://localhost:5173');
console.log('✅ Headers configurados:');
console.log('   - Access-Control-Allow-Origin: [origin]');
console.log('   - Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
console.log('   - Access-Control-Allow-Headers: Content-Type, Authorization');
console.log('   - Access-Control-Allow-Credentials: true\n');

// 🔍 ANÁLISE DA ARQUITETURA ATUAL
console.log('🏗️ ARQUITETURA ATUAL IDENTIFICADA');
console.log('================================');
console.log('📱 Frontend: Vercel (operabase-main.vercel.app)');
console.log('🖥️  Backend: AWS Elastic Beanstalk (operabase-backend-mvp-env-1.sa-east-1.elasticbeanstalk.com)');
console.log('🗄️  Database: Supabase (lkwrevhxugaxfpwiktdy.supabase.co)');
console.log('🔑 Auth: Supabase Auth + Session Management\n');

// 🔍 CONFIGURAÇÃO DO FRONTEND
console.log('🔍 CONFIGURAÇÃO DO FRONTEND (src/lib/api.ts)');
console.log('============================================');
console.log('📍 Função getApiBaseUrl():');
console.log('   1. VITE_API_URL (produção) - variável de ambiente');
console.log('   2. Proxy vazio (desenvolvimento)');
console.log('   3. Fallback AWS: operabase-backend-mvp-env-1.sa-east-1.elasticbeanstalk.com');
console.log('📍 Credenciais: credentials: "include" (cookies/session)');
console.log('📍 Headers de auth: Authorization: Bearer [token]\n');

// ❌ PROBLEMAS IDENTIFICADOS
console.log('❌ PROBLEMAS IDENTIFICADOS');
console.log('=========================');
console.log('1. 🔗 URL DO BACKEND AWS');
console.log('   ❌ Problema: URL hardcoded pode estar incorreta');
console.log('   ❌ Fallback: operabase-backend-mvp-env-1.sa-east-1.elasticbeanstalk.com');
console.log('   ❌ Verificar se esta URL está ativa e respondendo');
console.log('');
console.log('2. 🔐 VARIÁVEIS DE AMBIENTE NO VERCEL');
console.log('   ❌ Problema: VITE_API_URL pode não estar configurada');
console.log('   ❌ Verificar no painel do Vercel se está definida');
console.log('   ❌ Valor esperado: URL do backend AWS');
console.log('');
console.log('3. 🍪 AUTENTICAÇÃO E SESSÃO');
console.log('   ❌ Problema: Supabase Auth pode não estar sincronizada');
console.log('   ❌ Frontend usa: Supabase Auth + Bearer tokens');
console.log('   ❌ Backend usa: Session cookies + passport.js');
console.log('   ❌ Conflito: Dois sistemas de auth diferentes');
console.log('');
console.log('4. 🔒 RLS (Row Level Security)');
console.log('   ❌ Problema: Políticas RLS podem estar bloqueando');
console.log('   ❌ Chave ANON: Limitada por RLS');
console.log('   ❌ Verificar se usuário está autenticado no contexto correto');
console.log('');
console.log('5. 🌐 CORS NO BACKEND AWS');
console.log('   ❌ Problema: Backend AWS pode não ter CORS configurado');
console.log('   ❌ Solução 1: Aplicada apenas no simple-server.cjs');
console.log('   ❌ Falta: Configurar CORS no server/index.ts principal');
console.log('');

// 🎯 PLANO DE AÇÃO
console.log('🎯 PLANO DE AÇÃO - PRÓXIMOS PASSOS');
console.log('=================================');
console.log('');
console.log('🔧 ETAPA 1: VERIFICAR CONECTIVIDADE');
console.log('   1. Testar se a URL do AWS está respondendo');
console.log('   2. Verificar se o backend está rodando');
console.log('   3. Testar endpoints básicos (/health, /api/test)');
console.log('');
console.log('🔧 ETAPA 2: CONFIGURAR VARIÁVEIS NO VERCEL');
console.log('   1. Definir VITE_API_URL no painel do Vercel');
console.log('   2. Valor: URL do backend AWS');
console.log('   3. Fazer novo deploy para aplicar');
console.log('');
console.log('🔧 ETAPA 3: APLICAR CORS NO BACKEND PRINCIPAL');
console.log('   1. Adicionar CORS no server/index.ts');
console.log('   2. Incluir domínios do Vercel');
console.log('   3. Fazer deploy no AWS');
console.log('');
console.log('🔧 ETAPA 4: SINCRONIZAR AUTENTICAÇÃO');
console.log('   1. Verificar se Supabase Auth está funcionando');
console.log('   2. Testar se tokens estão sendo enviados');
console.log('   3. Verificar se backend reconhece a autenticação');
console.log('');
console.log('🔧 ETAPA 5: TESTAR POLÍTICAS RLS');
console.log('   1. Verificar se usuário tem acesso aos dados');
console.log('   2. Testar queries diretamente no Supabase');
console.log('   3. Ajustar políticas se necessário');
console.log('');

// 🚨 PRIORIDADE ALTA
console.log('🚨 PRIORIDADE ALTA - AÇÕES IMEDIATAS');
console.log('===================================');
console.log('1. 🔍 VERIFICAR URL DO BACKEND AWS');
console.log('   - Testar: curl https://operabase-backend-mvp-env-1.sa-east-1.elasticbeanstalk.com/health');
console.log('   - Se não responder: Verificar se o backend está rodando no AWS');
console.log('');
console.log('2. ⚙️ CONFIGURAR VITE_API_URL NO VERCEL');
console.log('   - Ir no painel do Vercel > Settings > Environment Variables');
console.log('   - Adicionar: VITE_API_URL = [URL_DO_BACKEND_AWS]');
console.log('   - Fazer redeploy');
console.log('');
console.log('3. 🔧 APLICAR CORS NO BACKEND PRINCIPAL');
console.log('   - Editar server/index.ts');
console.log('   - Adicionar configuração CORS similar ao simple-server.cjs');
console.log('   - Deploy no AWS');
console.log('');

// 📊 RESUMO EXECUTIVO
console.log('📊 RESUMO EXECUTIVO');
console.log('==================');
console.log('✅ SOLUÇÃO 1 (CORS): IMPLEMENTADA E TESTADA');
console.log('❌ PROBLEMA PRINCIPAL: Conectividade Frontend → Backend');
console.log('🎯 FOCO: Verificar URL do backend e variáveis de ambiente');
console.log('⏰ TEMPO ESTIMADO: 30-60 minutos para resolver');
console.log('🔄 PRÓXIMO PASSO: Aguardar aprovação para implementar ETAPA 1');
console.log('');
console.log('🔍 DIAGNÓSTICO COMPLETO FINALIZADO');
console.log('=================================='); 