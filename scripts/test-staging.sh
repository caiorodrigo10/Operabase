#!/bin/bash

# 🧪 Script de Teste - Servidor Refatorado em Staging
# Testa todas as funcionalidades do servidor refatorado

set -e  # Exit on any error

echo "🧪 INICIANDO TESTES DE STAGING - Servidor Refatorado"
echo "=================================================="

# Configuração
BASE_URL="http://localhost:3001"
SERVER_PID=""

# Função para cleanup
cleanup() {
    echo ""
    echo "🧹 Limpando recursos..."
    if [ ! -z "$SERVER_PID" ]; then
        echo "📴 Parando servidor (PID: $SERVER_PID)..."
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
    fi
    echo "✅ Cleanup concluído"
}

# Trap para cleanup automático
trap cleanup EXIT INT TERM

# Verificar se .env.local existe
echo "🔍 Verificando configuração..."
if [ ! -f ".env.local" ]; then
    echo "❌ Arquivo .env.local não encontrado!"
    echo "📝 Crie o arquivo .env.local baseado em server/core/config/staging.env.example"
    echo "💡 Exemplo:"
    echo "   cp server/core/config/staging.env.example .env.local"
    echo "   # Edite .env.local com suas credenciais reais"
    exit 1
fi

echo "✅ Arquivo .env.local encontrado"

# Carregar variáveis de ambiente
echo "🔧 Carregando variáveis de ambiente..."
export $(cat .env.local | grep -v '^#' | xargs)

# Verificar variáveis obrigatórias
echo "🔍 Verificando variáveis obrigatórias..."
if [ "$SUPABASE_URL" = "your_supabase_url_here" ] || [ -z "$SUPABASE_URL" ]; then
    echo "❌ SUPABASE_URL não configurada corretamente"
    exit 1
fi

if [ "$SUPABASE_SERVICE_ROLE_KEY" = "your_service_role_key_here" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY não configurada corretamente"
    exit 1
fi

echo "✅ Variáveis de ambiente configuradas"

# Iniciar servidor em background
echo "🚀 Iniciando servidor refatorado..."
npx ts-node server/core/server.ts &
SERVER_PID=$!

echo "📡 Servidor iniciado (PID: $SERVER_PID)"
echo "⏳ Aguardando servidor ficar pronto..."

# Aguardar servidor ficar pronto
for i in {1..30}; do
    if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
        echo "✅ Servidor pronto!"
        break
    fi
    
    if [ $i -eq 30 ]; then
        echo "❌ Timeout: Servidor não ficou pronto em 30 segundos"
        exit 1
    fi
    
    echo "⏳ Aguardando... ($i/30)"
    sleep 1
done

echo ""
echo "🧪 EXECUTANDO TESTES DE ENDPOINTS"
echo "================================="

# Função para testar endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    local data=$5
    
    echo -n "🔍 $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "%{http_code}" -o /tmp/response.json "$BASE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "%{http_code}" -o /tmp/response.json -X POST -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    if [ "$response" = "$expected_status" ]; then
        echo "✅ OK ($response)"
        return 0
    else
        echo "❌ FALHOU ($response)"
        echo "📄 Resposta:"
        cat /tmp/response.json 2>/dev/null || echo "Sem resposta"
        return 1
    fi
}

# Testes dos endpoints
FAILED_TESTS=0

# 1. Health Check
test_endpoint "GET" "/health" "200" "Health check" || ((FAILED_TESTS++))

# 2. API Info
test_endpoint "GET" "/api" "200" "API info" || ((FAILED_TESTS++))

# 3. Debug Info
test_endpoint "GET" "/api/debug" "200" "Debug info" || ((FAILED_TESTS++))

# 4. Contatos
test_endpoint "GET" "/api/contacts" "200" "Listar contatos" || ((FAILED_TESTS++))

# 5. Agendamentos
test_endpoint "GET" "/api/appointments" "200" "Listar agendamentos" || ((FAILED_TESTS++))

# 6. Auth Profile
test_endpoint "GET" "/api/auth/profile" "200" "Perfil usuário" || ((FAILED_TESTS++))

# 7. Auth Login
test_endpoint "POST" "/api/auth/login" "200" "Login" '{"email":"test@test.com","password":"123"}' || ((FAILED_TESTS++))

# 8. Clínica Users
test_endpoint "GET" "/api/clinic/1/users/management" "200" "Usuários clínica" || ((FAILED_TESTS++))

# 9. Clínica Config
test_endpoint "GET" "/api/clinic/1/config" "200" "Config clínica" || ((FAILED_TESTS++))

# 10. Página inicial (SPA)
test_endpoint "GET" "/" "200" "Página inicial" || ((FAILED_TESTS++))

echo ""
echo "📊 RESULTADOS DOS TESTES"
echo "======================="

TOTAL_TESTS=10
PASSED_TESTS=$((TOTAL_TESTS - FAILED_TESTS))

echo "✅ Testes passaram: $PASSED_TESTS/$TOTAL_TESTS"
echo "❌ Testes falharam: $FAILED_TESTS/$TOTAL_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo "🎉 TODOS OS TESTES PASSARAM!"
    echo "✅ Servidor refatorado está funcionando perfeitamente"
    echo "🚀 Pronto para substituir o arquivo original"
else
    echo ""
    echo "⚠️  ALGUNS TESTES FALHARAM"
    echo "🔍 Verifique os logs do servidor e as configurações"
    exit 1
fi

echo ""
echo "🔗 ENDPOINTS TESTADOS:"
echo "- $BASE_URL/health"
echo "- $BASE_URL/api"
echo "- $BASE_URL/api/contacts"
echo "- $BASE_URL/api/appointments"
echo "- $BASE_URL/api/auth/profile"
echo "- $BASE_URL/api/clinic/1/config"

echo ""
echo "📝 PRÓXIMOS PASSOS:"
echo "1. Se todos os testes passaram, o servidor refatorado está pronto"
echo "2. Para integrar: mv server/railway-server.ts server/railway-server-old.ts"
echo "3. Depois: cp server/core/server.ts server/railway-server.ts"
echo "4. Atualizar imports se necessário"

echo ""
echo "🧪 TESTE DE STAGING CONCLUÍDO" 