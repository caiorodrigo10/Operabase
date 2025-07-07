# Operabase - Sistema de Gestão para Clínicas Médicas

## 🏥 Visão Geral

**Operabase** é um sistema completo de gestão para clínicas médicas, construído com **React 18**, **TypeScript**, **Vite**, **TanStack Query**, **Tailwind CSS** e **Railway Unified Server** para desenvolvimento local.

### ✨ Principais Funcionalidades
- 📅 **Gestão de Agendamentos** - Sistema completo de consultas e procedimentos
- 👥 **Gestão de Contatos** - CRM integrado para pacientes e leads
- 🏥 **Gestão de Clínicas** - Configuração e usuários por clínica
- 📊 **Dashboard Intuitivo** - Visão geral dos dados da clínica
- 🔐 **Sistema de Autenticação** - Controle de acesso por roles
- 📱 **Interface Responsiva** - Design moderno e mobile-first

## 🏗️ Arquitetura Railway Unified Server

### Conceito
O projeto utiliza uma **arquitetura unificada** que combina frontend e backend em um único servidor para desenvolvimento local, resolvendo problemas de conectividade e simplificando o fluxo de desenvolvimento.

### Stack Tecnológico
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + TypeScript + Railway Server
- **Database**: Supabase PostgreSQL
- **State Management**: TanStack Query + Zustand
- **UI Components**: Shadcn/UI + Radix UI
- **Development**: Vite Proxy + Hot Reload

### Fluxo de Desenvolvimento
```
Frontend (Vite :5173) → Proxy /api → Railway Server (:3000) → Supabase PostgreSQL
```

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18.x ou superior
- npm ou yarn
- Conta Supabase (para banco de dados)

### 1. Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/operabase.git
cd operabase
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar .env com suas credenciais
nano .env
```

```bash
# .env - Configuração Railway
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
PORT=3000
NODE_ENV=development

# .env.local - Configuração Frontend
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Operabase
VITE_ENVIRONMENT=development
```

### 4. Executar em Desenvolvimento

#### Opção A: Executar Separadamente
```bash
# Terminal 1: Railway Server
npm run dev:railway

# Terminal 2: Frontend Vite
npm run dev
```

#### Opção B: Executar Junto (Recomendado)
```bash
# Executar ambos simultaneamente
npm run dev:full
```

### 5. Acessar a Aplicação
```bash
# Frontend (desenvolvimento)
http://localhost:5173

# Backend API (testes)
http://localhost:3000/health
```

## 📁 Estrutura do Projeto

```
operabase/
├── src/                          # Frontend React
│   ├── components/              # Componentes reutilizáveis
│   │   ├── ui/                 # Componentes base (Shadcn/UI)
│   │   └── features/           # Componentes específicos
│   ├── pages/                  # Páginas da aplicação
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Utilitários e configurações
│   ├── contexts/               # React Contexts
│   ├── stores/                 # Zustand stores
│   ├── types/                  # Definições TypeScript
│   └── utils/                  # Funções utilitárias
├── server/                     # Backend Railway
│   ├── railway-server.ts       # Servidor principal
│   ├── middleware/             # Middlewares Express
│   ├── routes/                 # Rotas da API
│   └── utils/                  # Utilitários do servidor
├── docs/                       # Documentação
│   ├── BACKEND-ARCHITECTURE.md
│   ├── FRONTEND-ARCHITECTURE.md
│   └── RAILWAY-ARCHITECTURE.md
├── public/                     # Arquivos estáticos
├── dist/                       # Build de produção
└── package.json               # Dependências e scripts
```

## 🔌 API Endpoints

### Health Check
```bash
GET /health
```

### Appointments
```bash
GET    /api/appointments?clinic_id=1          # Listar agendamentos
GET    /api/appointments?clinic_id=1&date=2025-01-20  # Por data
GET    /api/appointments?clinic_id=1&contact_id=56     # Por contato
POST   /api/appointments                      # Criar agendamento
```

### Contacts
```bash
GET    /api/contacts?clinic_id=1              # Listar contatos
GET    /api/contacts/:id?clinic_id=1          # Buscar contato
GET    /api/contacts?clinic_id=1&search=nome  # Buscar por nome
POST   /api/contacts                          # Criar contato
```

### Clinic Management
```bash
GET    /api/clinic/:id/users/management       # Usuários da clínica
GET    /api/clinic/:id/config                 # Configuração da clínica
```

### Authentication
```bash
POST   /api/auth/login                        # Login
POST   /api/auth/logout                       # Logout
GET    /api/auth/profile                      # Perfil do usuário
```

## 🧪 Testes e Debug

### Testar APIs
```bash
# Health check
curl http://localhost:3000/health

# Testar agendamentos
curl "http://localhost:3000/api/appointments?clinic_id=1"

# Testar contatos
curl "http://localhost:3000/api/contacts?clinic_id=1"

# Testar contato específico
curl "http://localhost:3000/api/contacts/56?clinic_id=1"

# Testar via proxy Vite
curl "http://localhost:5173/api/health"
```

### Verificar Serviços
```bash
# Verificar se Railway server está rodando
lsof -i :3000

# Verificar se Vite dev server está rodando
lsof -i :5173

# Verificar conectividade
curl -v http://localhost:3000/health
curl -v http://localhost:5173/api/health
```

### Debug Logs
O Railway server fornece logs detalhados:
```
[2025-01-20T15:30:00.000Z] GET /api/appointments
🔍 Buscando agendamentos para clinic_id: 1
✅ Agendamentos encontrados: 83
```

## 📊 Scripts Disponíveis

### Desenvolvimento
```bash
npm run dev              # Inicia Vite dev server
npm run dev:railway      # Inicia Railway server
npm run dev:full         # Inicia ambos (recomendado)
```

### Build e Produção
```bash
npm run build            # Build do frontend
npm run build:railway    # Build do Railway server
npm run start:railway    # Inicia Railway server em produção
npm run preview          # Preview da build
```

### Qualidade de Código
```bash
npm run lint             # Executar ESLint
npm run lint:fix         # Corrigir problemas do ESLint
npm run type-check       # Verificar tipos TypeScript
```

## 🔧 Troubleshooting

### Problemas Comuns

#### Port 3000 ocupado
```bash
lsof -ti:3000 | xargs kill -9
```

#### Port 5173 ocupado
```bash
lsof -ti:5173 | xargs kill -9
```

#### Proxy não funciona
- Verificar se Railway server está rodando na porta 3000
- Verificar configuração do proxy no `vite.config.ts`

#### Erro de conexão com banco
- Verificar `SUPABASE_SERVICE_ROLE_KEY` no `.env`
- Verificar se o projeto Supabase está ativo

#### CORS Error
- Verificar origem no middleware CORS do Railway server
- Verificar se ambos os serviços estão rodando

### Logs de Debug
- **Railway Server**: Logs aparecem no terminal onde rodou `npm run dev:railway`
- **Vite Dev Server**: Logs aparecem no terminal onde rodou `npm run dev`
- **Browser Network**: Verificar requisições `/api` no DevTools

## 🎯 Funcionalidades Implementadas

### ✅ Concluído
- ✅ **Railway Unified Server** - Servidor unificado funcionando
- ✅ **Vite Proxy** - Proxy configurado para desenvolvimento
- ✅ **TanStack Query** - Gerenciamento de estado otimizado
- ✅ **API Endpoints** - Appointments, Contacts, Clinic Management
- ✅ **Contact Detail Page** - Página de visão geral funcionando
- ✅ **Error Handling** - Estados de erro específicos
- ✅ **Loading States** - Skeletons otimizados
- ✅ **Connection Monitor** - Monitor de conectividade
- ✅ **Debug Panel** - Painel de debug para desenvolvimento

### 🚧 Em Desenvolvimento
- ⏳ **Authentication** - Sistema de login/logout real
- ⏳ **CRUD Completo** - Endpoints PUT/DELETE
- ⏳ **Validation** - Middleware de validação
- ⏳ **Real-time Updates** - WebSockets ou polling
- ⏳ **Offline Support** - Funcionamento offline

### 🔮 Roadmap
- 🔮 **PWA** - Progressive Web App
- 🔮 **Push Notifications** - Notificações em tempo real
- 🔮 **Dark Mode** - Tema escuro
- 🔮 **Internationalization** - Suporte a idiomas
- 🔮 **Analytics** - Tracking de uso

## 📚 Documentação

### Arquitetura
- [Backend Architecture](docs/BACKEND-ARCHITECTURE.md) - Documentação do backend
- [Frontend Architecture](docs/FRONTEND-ARCHITECTURE.md) - Documentação do frontend
- [Railway Architecture](docs/RAILWAY-ARCHITECTURE.md) - Documentação da arquitetura Railway

### Recursos
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard
- **React Docs**: https://react.dev/
- **Vite Docs**: https://vitejs.dev/
- **TanStack Query**: https://tanstack.com/query/latest

## 🤝 Contribuindo

### Fluxo de Contribuição
1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adicionar nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

### Padrões de Código
- **ESLint**: Seguir configuração do projeto
- **TypeScript**: Usar tipagem estrita
- **Commits**: Usar conventional commits
- **Componentes**: Seguir padrão Railway otimizado

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Equipe

### Desenvolvedores
- **Caio Rodrigo** - Desenvolvedor Principal
- **Equipe Operabase** - Desenvolvimento e Manutenção

### Suporte
- **Email**: cr@caiorodrigo.com.br
- **GitHub**: [@caiorodrigo](https://github.com/caiorodrigo)

---

## 🚀 Status do Projeto

**Versão**: v2.0.0-railway  
**Status**: ✅ Desenvolvimento Local Ativo  
**Última Atualização**: Janeiro 2025  

### Estatísticas
- 🏥 **Clínicas**: 1 ativa
- 👥 **Usuários**: 3 cadastrados
- 📅 **Agendamentos**: 83 registros
- 📞 **Contatos**: 38 registros

### Ambiente de Desenvolvimento
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **Database**: Supabase PostgreSQL
- **Proxy**: Vite → Railway Server

---

*Sistema desenvolvido com ❤️ para modernizar a gestão de clínicas médicas*