#!/bin/bash

# Script para desenvolvimento com portas customizadas
# Operabase Railway - Custom Ports Development

echo "🚀 Operabase - Desenvolvimento com Portas Customizadas"
echo "=================================================="

# Verificar se argumentos foram fornecidos
if [ $# -eq 0 ]; then
    echo "📋 Uso:"
    echo "  $0 <frontend_port> <backend_port>"
    echo ""
    echo "📋 Exemplos:"
    echo "  $0 4000 8000  # Frontend na 4000, Backend na 8000"
    echo "  $0 5000 9000  # Frontend na 5000, Backend na 9000"
    echo "  $0 6000 7000  # Frontend na 6000, Backend na 7000"
    echo ""
    echo "📋 Scripts pré-configurados disponíveis:"
    echo "  npm run dev:4000-8000"
    echo "  npm run dev:5000-9000"
    echo "  npm run dev:6000-7000"
    echo ""
    exit 1
fi

FRONTEND_PORT=$1
BACKEND_PORT=$2

# Validar se as portas são números
if ! [[ "$FRONTEND_PORT" =~ ^[0-9]+$ ]] || ! [[ "$BACKEND_PORT" =~ ^[0-9]+$ ]]; then
    echo "❌ Erro: As portas devem ser números"
    exit 1
fi

# Verificar se as portas estão disponíveis
echo "🔍 Verificando disponibilidade das portas..."

if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Porta $FRONTEND_PORT já está em uso"
    echo "   Para liberar: lsof -ti:$FRONTEND_PORT | xargs kill -9"
    exit 1
fi

if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Porta $BACKEND_PORT já está em uso"
    echo "   Para liberar: lsof -ti:$BACKEND_PORT | xargs kill -9"
    exit 1
fi

echo "✅ Portas $FRONTEND_PORT e $BACKEND_PORT estão disponíveis"

# Verificar se as dependências estão instaladas
if ! command -v concurrently &> /dev/null; then
    echo "📦 Instalando dependências necessárias..."
    npm install concurrently cross-env
fi

echo ""
echo "🎯 Configuração:"
echo "   Frontend (Vite): http://localhost:$FRONTEND_PORT"
echo "   Backend (Express): http://localhost:$BACKEND_PORT"
echo "   Proxy API: http://localhost:$FRONTEND_PORT/api -> http://localhost:$BACKEND_PORT"
echo ""

# Exportar variáveis de ambiente e executar
export FRONTEND_PORT=$FRONTEND_PORT
export BACKEND_PORT=$BACKEND_PORT
export VITE_PORT=$FRONTEND_PORT
export VITE_BACKEND_PORT=$BACKEND_PORT

echo "🚀 Iniciando servidores..."
echo "   Pressione Ctrl+C para parar"
echo ""

# Executar com concurrently
npx concurrently \
  --names "BACKEND,FRONTEND" \
  --prefix-colors "blue,green" \
  "npm run dev:backend:custom" \
  "npm run dev:frontend:custom" 