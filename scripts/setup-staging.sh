#!/bin/bash

# 🔧 Setup de Staging - Servidor Refatorado
# Configura ambiente de teste para o servidor refatorado

echo "🔧 CONFIGURANDO AMBIENTE DE STAGING"
echo "==================================="

# Verificar se exemplo existe
if [ ! -f "server/core/config/staging.env.example" ]; then
    echo "❌ Arquivo staging.env.example não encontrado"
    exit 1
fi

# Criar .env.local se não existir
if [ ! -f ".env.local" ]; then
    echo "📝 Criando arquivo .env.local..."
    cp server/core/config/staging.env.example .env.local
    echo "✅ Arquivo .env.local criado"
    echo ""
    echo "⚠️  IMPORTANTE: Edite o arquivo .env.local com suas credenciais reais:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo "   - SUPABASE_ANON_KEY"
    echo "   - EVOLUTION_API_KEY (opcional)"
    echo ""
    echo "💡 Exemplo de edição:"
    echo "   nano .env.local"
    echo "   # ou"
    echo "   code .env.local"
    echo ""
    echo "🚀 Após configurar, execute:"
    echo "   bash scripts/test-staging.sh"
else
    echo "✅ Arquivo .env.local já existe"
    echo ""
    echo "🔍 Verificando configuração atual..."
    
    # Verificar se ainda tem valores placeholder
    if grep -q "your_.*_here" .env.local; then
        echo "⚠️  Ainda há valores placeholder no .env.local:"
        grep "your_.*_here" .env.local
        echo ""
        echo "📝 Edite o arquivo .env.local com suas credenciais reais"
        echo "🚀 Após configurar, execute:"
        echo "   bash scripts/test-staging.sh"
    else
        echo "✅ Configuração parece estar completa"
        echo ""
        echo "🚀 Pronto para testar! Execute:"
        echo "   bash scripts/test-staging.sh"
    fi
fi

echo ""
echo "📚 DOCUMENTAÇÃO:"
echo "- Configuração: server/core/config/staging.env.example"
echo "- Teste: scripts/test-staging.sh"
echo "- Logs: server/core/server.ts" 