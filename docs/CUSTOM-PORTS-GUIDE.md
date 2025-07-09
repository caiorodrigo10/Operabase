# Guia de Portas Customizadas - Operabase

Este guia explica como executar o frontend e backend da Operabase em portas diferentes das padrões (3000 e 5173).

## 🎯 Visão Geral

Por padrão, a Operabase usa:
- **Frontend (Vite)**: Porta 5173
- **Backend (Express)**: Porta 3000

Com as configurações customizadas, você pode usar qualquer combinação de portas disponíveis.

## 🚀 Métodos de Uso

### 1. Scripts Pré-configurados (Mais Fácil)

```bash
# Frontend 4000, Backend 8000
npm run dev:4000-8000

# Frontend 5000, Backend 9000
npm run dev:5000-9000

# Frontend 6000, Backend 7000
npm run dev:6000-7000
```

### 2. Script Shell (Portas Customizadas)

```bash
# Uso geral
./scripts/dev-custom-ports.sh <frontend_port> <backend_port>

# Exemplos
./scripts/dev-custom-ports.sh 4000 8000
./scripts/dev-custom-ports.sh 5500 7500
./scripts/dev-custom-ports.sh 3333 9999
```

### 3. Variáveis de Ambiente

#### Opção A: Arquivo .env.local
```bash
# Copie o arquivo de exemplo
cp ports.config.example .env.local

# Edite as portas desejadas
FRONTEND_PORT=4000
BACKEND_PORT=8000

# Execute
npm run dev:custom
```

#### Opção B: Comando direto
```bash
FRONTEND_PORT=4000 BACKEND_PORT=8000 npm run dev:custom
```

### 4. Execução Manual (Separada)

```bash
# Terminal 1: Backend na porta 8000
BACKEND_PORT=8000 npm run dev:backend:custom

# Terminal 2: Frontend na porta 4000 (conectando ao backend 8000)
FRONTEND_PORT=4000 VITE_BACKEND_PORT=8000 npm run dev:frontend:custom
```

## 🔧 Scripts Disponíveis

| Script | Descrição | Frontend | Backend |
|--------|-----------|----------|---------|
| `npm run dev` | Padrão original | 5173 | 3000 |
| `npm run dev:railway` | Backend apenas | - | 3000 |
| `npm run dev:4000-8000` | Pré-configurado | 4000 | 8000 |
| `npm run dev:5000-9000` | Pré-configurado | 5000 | 9000 |
| `npm run dev:6000-7000` | Pré-configurado | 6000 | 7000 |
| `npm run dev:custom` | Usa variáveis de ambiente | $FRONTEND_PORT | $BACKEND_PORT |

## 🌐 Como Funciona

### Configuração Automática
1. **Vite Proxy**: Automaticamente configurado para redirecionar `/api` para o backend
2. **CORS**: Backend configurado para aceitar requests do frontend
3. **Logs**: Ambos os serviços mostram as portas sendo utilizadas

### Exemplo de Fluxo
```
Frontend (4000) → /api/contacts → Proxy → Backend (8000) → Supabase
```

## 📋 Verificação de Portas

### Verificar se uma porta está em uso
```bash
# macOS/Linux
lsof -i :4000

# Windows
netstat -ano | findstr :4000
```

### Liberar uma porta ocupada
```bash
# macOS/Linux
lsof -ti:4000 | xargs kill -9

# Windows
taskkill /PID <PID> /F
```

## 🛠️ Troubleshooting

### Problema: Porta já em uso
```bash
❌ Porta 4000 já está em uso
   Para liberar: lsof -ti:4000 | xargs kill -9
```

**Solução**: Execute o comando sugerido ou escolha outra porta.

### Problema: CORS Error
```bash
Access to fetch at 'http://localhost:8000/api/contacts' from origin 'http://localhost:4000' has been blocked by CORS policy
```

**Solução**: Verifique se ambos os serviços estão rodando e se as variáveis de ambiente estão corretas.

### Problema: API 404
```bash
GET http://localhost:4000/api/contacts 404 (Not Found)
```

**Solução**: Verifique se o backend está rodando na porta correta e se o proxy está configurado.

## 🔍 Debug e Logs

### Logs do Frontend
```bash
🎯 Frontend configurado para porta: 4000
🎯 Backend configurado para porta: 8000
```

### Logs do Backend
```bash
🌐 CORS configurado para origens: http://localhost:4000, http://localhost:8000, ...
📍 BACKEND_PORT: 8000
📍 FRONTEND_PORT: 4000
🚀 Servidor iniciado com sucesso!
📡 Rodando na porta: 8000
```

## 📝 Exemplos Práticos

### Desenvolvimento com múltiplos projetos
```bash
# Projeto A: Operabase
npm run dev:4000-8000

# Projeto B: Outro projeto
# Frontend 3000, Backend 5000
```

### Evitar conflitos com outros serviços
```bash
# Se você tem outros serviços nas portas 3000/5173
npm run dev:6000-7000
```

### Teste de diferentes configurações
```bash
# Teste 1
./scripts/dev-custom-ports.sh 4000 8000

# Teste 2  
./scripts/dev-custom-ports.sh 5500 7500
```

## 🎯 Recomendações

### Combinações Recomendadas
- **4000/8000**: Boa separação, fácil de lembrar
- **5000/9000**: Portas altas, menos conflitos
- **6000/7000**: Portas próximas, fácil debug

### Evitar
- **80/443**: Portas do sistema
- **3000/3001**: Muito comuns, podem conflitar
- **8080**: Comum em outros serviços

## 🔗 URLs de Acesso

Com a configuração 4000/8000:
- **Frontend**: http://localhost:4000
- **Backend Health**: http://localhost:8000/health
- **API via Proxy**: http://localhost:4000/api/health
- **API Direta**: http://localhost:8000/api/health

---

## 📞 Suporte

Se você encontrar problemas:

1. Verifique se as portas estão livres
2. Confirme se as variáveis de ambiente estão corretas
3. Verifique os logs de ambos os serviços
4. Teste com uma combinação de portas conhecida (4000/8000)

---

*Guia criado para Operabase Railway v2.0* 