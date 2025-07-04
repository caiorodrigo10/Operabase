# 📋 Plano de Deploy - AWS Elastic Beanstalk

## 🎯 Objetivo
Migrar o backend Express.js da aplicação Operabase para AWS Elastic Beanstalk, mantendo o frontend no Vercel.

## 📊 Análise da Estrutura Atual

### ✅ Funcionalidades Implementadas
- **Backend Express.js** com TypeScript e arquitetura multi-tenant
- **Sistema de cache Redis** com fallback para memória (obrigatório)
- **WebSocket** para comunicação em tempo real
- **Observabilidade completa** com métricas e logs
- **Supabase** como banco de dados (PostgreSQL + Storage)
- **Middleware de performance** e monitoramento
- **Sistema de autenticação** com sessões
- **Upload de arquivos** com Supabase Storage
- **Integração WhatsApp** via Evolution API
- **Integração Google Calendar** com sync bidirecional
- **Sistema de conversas** com AI e WebSocket
- **RAG (Retrieval Augmented Generation)** com LangChain
- **Anamneses** com formulários dinâmicos
- **Pipeline de vendas** com CRM
- **Analytics** e relatórios
- **Calendário** com agendamentos
- **Prontuários médicos**
- **Sistema de tags** para agendamentos
- **Gerenciamento de equipe** e permissões
- **AI Templates** para automação
- **N8N integration** para workflows

### ⚠️ Dependências Externas Críticas
- **Supabase** (PostgreSQL + Storage + Auth)
- **Redis** (cache - **OBRIGATÓRIO** para WebSocket e performance)
- **OpenAI API** (AI features e RAG)
- **Google Calendar API** (integração calendário)
- **Evolution API** (WhatsApp integration)
- **N8N** (automação de workflows)

## 🏗️ Estratégia de Deploy

### **Opção Recomendada: AWS Elastic Beanstalk**
- ✅ **Simplicidade**: Deploy com um comando
- ✅ **Escalabilidade automática**: Auto Scaling Group
- ✅ **Load Balancer**: Application Load Balancer incluído
- ✅ **Health Checks**: Monitoramento automático
- ✅ **SSL/TLS**: Certificado gratuito via ACM
- ✅ **Logs centralizados**: CloudWatch Logs
- ✅ **Rollback automático**: Em caso de falha

## 📋 Checklist de Preparação

### **Fase 1: Preparação do Código**

#### 1.1 Separação Frontend/Backend ✅
- [x] Frontend já configurado para Vercel
- [x] Backend Express independente
- [x] Build separado configurado no package.json

#### 1.2 Configuração de Ambiente
- [ ] Criar arquivo `.env.production`
- [ ] Configurar variáveis de ambiente para produção
- [ ] Remover dependências de desenvolvimento do build

#### 1.3 Otimizações de Build
- [ ] Configurar build do servidor com esbuild
- [ ] Otimizar bundle para produção
- [ ] Configurar start script para produção

### **Fase 2: Configuração AWS & CI/CD**

#### 2.1 Arquivos de Configuração
- [ ] `.ebextensions/` - Configurações do Elastic Beanstalk
- [ ] `Procfile` - Comando de inicialização
- [ ] `.github/workflows/deploy.yml` - GitHub Actions
- [ ] `.platform/` - Hooks de deploy (se necessário)

#### 2.2 Configuração de Variáveis
- [ ] Configurar todas as variáveis de ambiente no EB
- [ ] Configurar secrets no GitHub Actions
- [ ] Configurar secrets no AWS Systems Manager
- [ ] Configurar certificado SSL

#### 2.3 Serviços Auxiliares & CI/CD
- [ ] Configurar ElastiCache Redis (opcional)
- [ ] Configurar CloudWatch Logs
- [ ] Configurar Route 53 para DNS
- [ ] Configurar GitHub Actions secrets
- [ ] Testar pipeline de CI/CD

### **Fase 3: Deploy e Testes**

#### 3.1 Deploy Inicial
- [ ] Deploy em ambiente de staging
- [ ] Testes de funcionalidade
- [ ] Testes de performance

#### 3.2 Configuração de Domínio
- [ ] Configurar domínio customizado
- [ ] Configurar certificado SSL
- [ ] Configurar CORS para frontend

#### 3.3 Monitoramento
- [ ] Configurar alertas CloudWatch
- [ ] Configurar logs de aplicação
- [ ] Configurar métricas customizadas

## 🔧 Arquivos de Configuração

### **1. .ebextensions/01-nodecommand.config**

#### **Para MVP (Todas as Funcionalidades)**
```yaml
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    PORT: 8080
  aws:elasticbeanstalk:environment:proxy:staticfiles:
    /health: dist/health.html
  # Configurações para t3.small com Redis
  aws:autoscaling:launchconfiguration:
    InstanceType: t3.small
    RootVolumeType: gp3
    RootVolumeSize: 15
  aws:autoscaling:asg:
    MinSize: 1
    MaxSize: 1
  aws:elasticbeanstalk:environment:
    EnvironmentType: SingleInstance
```

#### **Para Produção (Configuração Completa)**
```yaml
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    PORT: 8080
  aws:elasticbeanstalk:environment:proxy:staticfiles:
    /health: dist/health.html
  # Configurações para produção
  aws:autoscaling:launchconfiguration:
    InstanceType: t3.small
    RootVolumeType: gp3
    RootVolumeSize: 20
  aws:autoscaling:asg:
    MinSize: 1
    MaxSize: 3
  aws:elasticbeanstalk:environment:
    EnvironmentType: LoadBalanced
```

### **2. .ebextensions/02-environment.config**
```yaml
option_settings:
  aws:elasticbeanstalk:application:environment:
    # Database
    SUPABASE_URL: "https://your-project.supabase.co"
    SUPABASE_ANON_KEY: "your-anon-key"
    SUPABASE_SERVICE_ROLE_KEY: "your-service-role-key"
    SUPABASE_POOLER_URL: "your-pooler-url"
    
    # Cache (opcional)
    REDIS_URL: "redis://your-elasticache-endpoint:6379"
    
    # APIs
    OPENAI_API_KEY: "your-openai-key"
    GOOGLE_CLIENT_ID: "your-google-client-id"
    GOOGLE_CLIENT_SECRET: "your-google-client-secret"
    
    # Security
    SESSION_SECRET: "your-session-secret"
    
    # Features
    ENABLE_PAGINATION: "true"
```

### **3. .ebextensions/03-logs.config**
```yaml
files:
  "/opt/elasticbeanstalk/tasks/taillogs.d/01-app-logs.conf":
    mode: "000644"
    owner: root
    group: root
    content: |
      /var/log/eb-engine.log
      /var/log/eb-hooks.log
      /var/app/current/logs/*.log

option_settings:
  aws:elasticbeanstalk:cloudwatch:logs:
    StreamLogs: true
    DeleteOnTerminate: false
    RetentionInDays: 7
```

### **4. Procfile**
```
web: npm start
```

### **5. package.json - Scripts Atualizados**

#### **Para MVP (Otimizado para t3.micro)**
```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx --env-file=.env server/index.ts",
    "build": "npm run build:server",
    "build:server": "esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --external:@shared/schema --external:../shared/schema.js --external:./shared/schema.js --external:drizzle-orm --external:postgres --external:pg --external:ioredis --external:socket.io --minify",
    "start": "NODE_ENV=production node --max-old-space-size=512 dist/index.js",
    "postinstall": "npm run build"
  },
  "engines": {
    "node": "18.x"
  }
}
```

#### **Para Produção (Performance Completa)**
```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx --env-file=.env server/index.ts",
    "build": "npm run build:server",
    "build:server": "esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --external:@shared/schema --external:../shared/schema.js --external:./shared/schema.js --external:drizzle-orm --external:postgres --external:pg --external:ioredis --external:socket.io",
    "start": "NODE_ENV=production node dist/index.js",
    "postinstall": "npm run build"
  },
  "engines": {
    "node": "18.x"
  }
}
```

## 🚀 CI/CD Automático com GitHub Actions

### **Estratégia de Deploy Automático**
- **Frontend**: Vercel (já configurado) ✅
- **Backend**: AWS Elastic Beanstalk via GitHub Actions ✅
- **Trigger**: Push para branch `main` ou `production`
- **Rollback**: Automático em caso de falha

### **6. .github/workflows/deploy.yml**
```yaml
name: Deploy to AWS Elastic Beanstalk

on:
  push:
    branches: [ main, production ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test --if-present
    
    - name: Build application
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/production'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Generate deployment package
      run: |
        zip -r deploy.zip . -x "*.git*" "node_modules/*" "src/*" "*.md" "docs/*" "examples/*"
    
    - name: Deploy to EB
      uses: einaregilsson/beanstalk-deploy@v21
      with:
        aws_access_key: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws_secret_key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        application_name: operabase-backend
        environment_name: ${{ github.ref == 'refs/heads/main' && 'operabase-backend-mvp' || 'operabase-backend-prod' }}
        version_label: ${{ github.sha }}
        region: us-east-1
        deployment_package: deploy.zip
        wait_for_environment_recovery: 300
```

### **7. Configuração de Secrets no GitHub**
No seu repositório GitHub, vá em **Settings → Secrets and variables → Actions** e adicione:

```
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
EB_APPLICATION_NAME=operabase-backend
EB_ENVIRONMENT_NAME=operabase-backend-prod
```

## 🔄 Processo de Deploy Automático

### **Fluxo Completo**
1. **Push no GitHub** → Trigger automático
2. **GitHub Actions** → Build e testes
3. **Vercel** → Deploy automático do frontend
4. **AWS EB** → Deploy automático do backend
5. **Notificações** → Status via GitHub/Slack

### **Processo Manual (Setup Inicial)**

#### **Passo 1: Preparação Local**
```bash
# 1. Instalar EB CLI
pip install awsebcli

# 2. Configurar AWS credentials
aws configure

# 3. Testar build local
npm run build
npm start
```

#### **Passo 2: Inicialização EB (Uma vez)**

##### **Para MVP (Todas as Funcionalidades)**
```bash
# 1. Inicializar aplicação EB
eb init operabase-backend --platform "Node.js 18" --region us-east-1

# 2. Criar ambiente MVP com Redis
eb create operabase-backend-mvp \
  --instance-type t3.small \
  --min-instances 1 \
  --max-instances 1 \
  --single-instance

# 3. Configurar ElastiCache Redis
aws elasticache create-cache-cluster \
  --cache-cluster-id operabase-mvp-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1

# 4. Configurar todas as variáveis de ambiente
eb setenv \
  NODE_ENV=production \
  SUPABASE_URL=https://your-project.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=your-service-key \
  REDIS_URL=redis://operabase-mvp-redis.cache.amazonaws.com:6379 \
  OPENAI_API_KEY=your-openai-key \
  GOOGLE_CLIENT_ID=your-google-id \
  EVOLUTION_API_KEY=your-evolution-key
```

##### **Para Produção (Recomendado)**
```bash
# 1. Inicializar aplicação EB
eb init operabase-backend --platform "Node.js 18" --region us-east-1

# 2. Criar ambiente produção
eb create operabase-backend-prod \
  --instance-type t3.small \
  --min-instances 1 \
  --max-instances 3

# 3. Configurar variáveis de ambiente
eb setenv NODE_ENV=production SUPABASE_URL=https://your-project.supabase.co [...]
```

#### **Passo 3: Deploy Manual (Emergência)**
```bash
# 1. Deploy manual (se necessário)
eb deploy

# 2. Verificar saúde
eb health

# 3. Ver logs
eb logs

# 4. Abrir aplicação
eb open
```

## 📊 Configuração de Variáveis de Ambiente

### **🔑 Obrigatórias (MVP)**
```env
NODE_ENV=production
PORT=8080

# Database - Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_POOLER_URL=your-pooler-url
SUPABASE_CONNECTION_STRING=postgresql://user:pass@host:port/db

# Cache - Redis (obrigatório para WebSocket)
REDIS_URL=redis://your-elasticache-endpoint:6379

# Security
SESSION_SECRET=your-strong-session-secret-min-32-chars
```

### **🚀 Funcionalidades Específicas**
```env
# AI Features
OPENAI_API_KEY=sk-your-openai-key-here

# Google Calendar Integration
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/calendar/callback/google

# WhatsApp Integration
EVOLUTION_API_KEY=your-evolution-api-key
EVOLUTION_API_URL=https://your-evolution-instance.com
EVOLUTION_URL=https://your-evolution-instance.com

# N8N Integration
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook

# Feature Flags
ENABLE_PAGINATION=true
ENABLE_REDIS_CACHE=true
```

### **🔧 Opcionais (com fallbacks)**
```env
# Development/Debug
REPLIT_DOMAINS=your-replit-domain.replit.app
WEBHOOK_BASE_URL=https://your-domain.com

# Google Webhook
GOOGLE_WEBHOOK_TOKEN=your-webhook-verification-token

# Database Alternatives
DATABASE_URL=postgresql://fallback-connection
SUPABASE_DATABASE_URL=postgresql://alternative-connection
```

## 🔍 Monitoramento e Logs

### **CloudWatch Logs**
- `/aws/elasticbeanstalk/operabase-backend-prod/var/log/eb-engine.log`
- `/aws/elasticbeanstalk/operabase-backend-prod/var/log/nodejs/nodejs.log`

### **Métricas Customizadas**
- Response time
- Error rate
- Cache hit rate
- Database connections
- WebSocket connections

### **Health Checks**
- **Endpoint**: `/api/health`
- **Timeout**: 30 segundos
- **Interval**: 15 segundos
- **Threshold**: 3 falhas consecutivas

## 💰 Estimativa de Custos (Mensal)

### **🚀 Configuração MVP (Completa)**
- **EC2 t3.small** (1 instância): ~$15/mês
- **ElastiCache t3.micro** (Redis): ~$15/mês
- **Application Load Balancer**: ~$20/mês
- **CloudWatch Logs básico**: ~$5/mês
- **Data Transfer**: ~$10/mês
- **Total MVP**: ~$65/mês

#### **✅ Funcionalidades Incluídas no MVP**
- ✅ **Todas as funcionalidades** da aplicação atual
- ✅ **Redis cache** para performance e WebSocket
- ✅ **WebSocket** para tempo real
- ✅ **WhatsApp integration** via Evolution API
- ✅ **Google Calendar sync** bidirecional
- ✅ **AI features** com OpenAI
- ✅ **RAG system** com LangChain
- ✅ **Upload de arquivos** com Supabase Storage
- ✅ **Sistema completo** de conversas e CRM
- ✅ **Anamneses** e formulários dinâmicos
- ✅ **Pipeline de vendas** e analytics
- ✅ **Prontuários médicos** e agendamentos

#### **⚠️ Limitações do MVP**
- ⚠️ **Disponibilidade**: Instância única (sem redundância)
- ⚠️ **Escalabilidade**: Limitada para até 50 usuários simultâneos
- ⚠️ **CPU**: 1 vCPU (pode ser lento em picos de AI)
- ✅ **Ideal para**: Validação, até 50 usuários, todas as funcionalidades

#### **🔄 Quando Migrar para Produção**
- 👥 **Mais de 50 usuários simultâneos**
- 🚀 **Necessidade de alta disponibilidade**
- 🔄 **Necessidade de redundância**
- 📊 **Uso intensivo de AI/WebSocket**

### **📈 Configuração Básica**
- **EC2 t3.small** (1 instância): ~$15/mês
- **Application Load Balancer**: ~$20/mês
- **ElastiCache t3.micro** (opcional): ~$15/mês
- **CloudWatch Logs**: ~$5/mês
- **Data Transfer**: ~$10/mês
- **Total Básica**: ~$65/mês

### **🏢 Configuração Escalável**
- **EC2 t3.large (2 instâncias)**: ~$120/mês
- **Application Load Balancer**: ~$20/mês
- **ElastiCache t3.small**: ~$30/mês
- **CloudWatch**: ~$15/mês
- **Total Escalável**: ~$185/mês

## 📊 Comparativo de Configurações

| Recurso | MVP | Básica | Escalável |
|---------|-----|--------|-----------|
| **💰 Custo/mês** | ~$65 | ~$65 | ~$185 |
| **🖥️ Instância** | t3.small | t3.small | t3.large x2 |
| **💾 RAM** | 2GB | 2GB | 8GB |
| **⚡ vCPU** | 1 | 1 | 4 |
| **👥 Usuários** | 50 | 50-100 | 500+ |
| **🔄 Auto Scaling** | ❌ | ✅ | ✅ |
| **🏥 Load Balancer** | ❌ | ✅ | ✅ |
| **📊 Redis Cache** | ✅ | ✅ | ✅ |
| **🔍 Monitoramento** | Básico | Completo | Avançado |
| **⏱️ Downtime** | Possível | Mínimo | Zero |
| **🎯 Ideal para** | Testes/Validação | Startup | Empresa |

## 🔒 Segurança

### **Configurações Recomendadas**
- **HTTPS only**: Força SSL/TLS
- **Security Groups**: Portas 80/443 apenas
- **IAM Roles**: Permissões mínimas
- **Secrets Manager**: Para chaves sensíveis
- **VPC**: Isolamento de rede

## 🚨 Troubleshooting

### **Problemas Comuns**
1. **Build failure**: Verificar dependencies e scripts
2. **Environment variables**: Verificar todas as variáveis obrigatórias
3. **Database connection**: Verificar Supabase URLs e keys
4. **Memory issues**: Aumentar instance type
5. **WebSocket issues**: Verificar sticky sessions

### **Comandos Úteis**
```bash
# Ver logs em tempo real
eb logs --all

# SSH na instância
eb ssh

# Ver configuração atual
eb config

# Rollback para versão anterior
eb deploy --version=previous
```

## ✅ Checklist Final

### **Antes do Deploy**
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Build funciona localmente
- [ ] Testes passando
- [ ] Backup do banco de dados
- [ ] DNS preparado

### **Após Deploy**
- [ ] Health check passando
- [ ] Logs sem erros críticos
- [ ] Frontend conectando ao backend
- [ ] WebSocket funcionando
- [ ] Cache funcionando (se configurado)
- [ ] Métricas sendo coletadas

### **Configuração de Domínio**
- [ ] Certificado SSL configurado
- [ ] CORS configurado para frontend
- [ ] Route 53 apontando para EB
- [ ] Redirecionamento HTTP → HTTPS

## 🔄 Migração MVP → Produção

### **Quando Migrar**
- 👥 **Usuários**: Mais de 20 usuários simultâneos
- 📊 **Métricas**: CPU > 80% ou Memória > 90%
- 🚀 **Performance**: Response time > 2 segundos
- 💼 **Negócio**: Receita validada

### **Processo de Migração**
```bash
# 1. Criar novo ambiente produção
eb create operabase-backend-prod \
  --instance-type t3.small \
  --min-instances 1 \
  --max-instances 3

# 2. Configurar variáveis de ambiente
eb setenv NODE_ENV=production [todas-as-vars]

# 3. Deploy no novo ambiente
eb deploy operabase-backend-prod

# 4. Testar novo ambiente
eb open operabase-backend-prod

# 5. Atualizar DNS (Route 53)
# 6. Terminar ambiente MVP
eb terminate operabase-backend-mvp
```

### **Custo da Migração**
- **Durante migração**: ~$100/mês (2 ambientes)
- **Após migração**: ~$65/mês (só produção)
- **Economia anual**: Migração planejada vs emergencial

## 🔄 Workflow de Desenvolvimento

### **Fluxo de Trabalho Diário**
```bash
# 1. Desenvolvimento local
git checkout -b feature/nova-funcionalidade
# ... fazer alterações ...
git add .
git commit -m "feat: nova funcionalidade"
git push origin feature/nova-funcionalidade

# 2. Pull Request
# Criar PR no GitHub → Testes automáticos

# 3. Merge para main
# Merge PR → Deploy automático para produção
```

### **Branches e Ambientes**
- **`main`** → Deploy automático para **produção**
- **`develop`** → Deploy automático para **staging** (opcional)
- **`feature/*`** → Apenas testes, sem deploy

## 📊 Monitoramento do CI/CD

### **GitHub Actions Dashboard**
- Status de builds em tempo real
- Logs detalhados de cada deploy
- Notificações de falhas
- Histórico de deployments

### **AWS CloudWatch**
- Métricas de aplicação
- Logs de deploy
- Alertas automáticos
- Health checks

## 📞 Próximos Passos

1. **Revisar e aprovar este plano**
2. **Preparar arquivos de configuração**
3. **Configurar ambiente AWS**
4. **Configurar GitHub Actions**
5. **Executar deploy em staging**
6. **Testar pipeline completo**
7. **Deploy em produção**
8. **Monitoramento pós-deploy**

---

## ⏱️ Cronograma de Implementação

### **🚀 MVP (Completo)**
- **Tempo**: 4-6 horas
- **Custo**: ~$65/mês
- **Ideal para**: Todas as funcionalidades, até 50 usuários

### **📈 Produção Básica**
- **Tempo**: 1-2 dias
- **Custo**: ~$65/mês
- **Ideal para**: Lançamento oficial

### **🏢 Produção Escalável**
- **Tempo**: 2-3 dias
- **Custo**: ~$185/mês
- **Ideal para**: Crescimento sustentado

---

**Recomendação**: Começar com **MVP** para validação e migrar conforme crescimento
**Risco**: Baixo (com rollback automático)
**Benefícios**: 
- ✅ **Deploy automático** frontend + backend
- ✅ **Escalabilidade** progressiva
- ✅ **Monitoramento** integrado
- ✅ **Rollback** automático em falhas
- ✅ **Testes** automáticos antes do deploy
- ✅ **Custo otimizado** por fase

---

## 📋 RESUMO EXECUTIVO - MVP CONFIRMADO

### **✅ MVP Atualizado - TODAS as Funcionalidades Incluídas**

Após análise completa da aplicação, **o MVP foi ajustado para incluir TODAS as funcionalidades atuais:**

#### **🔧 Infraestrutura Técnica**
- ✅ **Express.js backend** com TypeScript completo
- ✅ **Redis ElastiCache** (t3.micro) - **OBRIGATÓRIO** para WebSocket
- ✅ **WebSocket Server** para comunicação em tempo real
- ✅ **Supabase PostgreSQL** + Storage para arquivos
- ✅ **Sistema de autenticação** com sessões seguras
- ✅ **Observabilidade completa** com logs e métricas

#### **🤖 Funcionalidades AI**
- ✅ **OpenAI integration** para features de IA
- ✅ **RAG system** com LangChain e embeddings
- ✅ **AI Templates** para automação
- ✅ **N8N workflows** para automação avançada

#### **📱 Integrações Externas**
- ✅ **WhatsApp Business** via Evolution API
- ✅ **Google Calendar** sync bidirecional com webhooks
- ✅ **Google OAuth** para autenticação
- ✅ **Upload de arquivos** com Supabase Storage

#### **💼 Sistema Completo de Negócio**
- ✅ **Sistema de conversas** com IA em tempo real
- ✅ **CRM e pipeline** de vendas completo
- ✅ **Anamneses** com formulários dinâmicos
- ✅ **Calendário e agendamentos** integrados
- ✅ **Prontuários médicos** digitais
- ✅ **Analytics e relatórios** em tempo real
- ✅ **Gerenciamento de equipe** e permissões
- ✅ **Sistema multi-tenant** com isolamento

### **💰 Custo Ajustado: $65/mês (vs $35 inicial)**

**Justificativa do Aumento:**
- **Redis obrigatório**: +$15/mês (necessário para WebSocket)
- **t3.small necessário**: +$7/mês (Redis + WebSocket + AI)
- **Funcionalidades completas**: Todas incluídas no MVP

### **🎯 Capacidade do MVP**
- **👥 Usuários**: Até 50 simultâneos
- **🔄 Funcionalidades**: 100% da aplicação atual
- **⚡ Performance**: Adequada para validação e crescimento inicial
- **🚀 Escalabilidade**: Migração simples quando necessário

### **📅 Próximos Passos Imediatos**
1. ✅ **Aprovar plano atualizado** ($65/mês MVP completo)
2. 🔧 **Configurar secrets** GitHub Actions
3. 🚀 **Deploy MVP** com todas as funcionalidades
4. 🧪 **Testes completos** em produção
5. 📈 **Migrar para escalável** quando atingir 50+ usuários

**⏱️ Tempo de implementação**: 4-6 horas para MVP completo
**🎯 Resultado**: Sistema 100% funcional na AWS com CI/CD automático 