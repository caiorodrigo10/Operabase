# Netlify Deployment Guide

## 📋 Índice

- [Configuração Inicial](#configuração-inicial)
- [Dependências Críticas](#dependências-críticas)
- [Configuração do Build](#configuração-do-build)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Troubleshooting](#troubleshooting)
- [Lições Aprendidas](#lições-aprendidas)

## 🚀 Configuração Inicial

### 1. Conectar Repositório GitHub

1. Acesse [Netlify Dashboard](https://app.netlify.com)
2. Clique em "New site from Git"
3. Conecte com GitHub e selecione o repositório `Operabase`
4. Configure as opções de build (ver seção abaixo)

### 2. Configurações de Build

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist/public"
  node_version = "18"

[build.environment]
  NODE_ENV = "production"
  CI = "true"
  NPM_FLAGS = "--legacy-peer-deps"
```

**Explicação:**
- `command`: Comando para build do frontend
- `publish`: Diretório onde está o build final
- `node_version`: Versão do Node.js (compatível com o projeto)
- `NPM_FLAGS`: Flags necessárias para resolver conflitos de dependências

## 🔧 Dependências Críticas

### ⚠️ Problema Comum: Build Dependencies

**ERRO TÍPICO:**
```
Cannot find package '@vitejs/plugin-react' imported from vite.config.ts
```

### ✅ Solução: Mover para `dependencies`

As seguintes dependências **DEVEM** estar em `dependencies` (não `devDependencies`):

```json
{
  "dependencies": {
    "@vitejs/plugin-react": "^4.3.2",
    "tailwindcss": "^3.4.17",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "@tailwindcss/typography": "^0.5.15",
    "typescript": "5.6.3",
    "vite": "^5.4.14"
  }
}
```

### 📝 Regra Geral

**Em `dependencies`:**
- Dependências necessárias para o build de produção
- Plugins do Vite
- Processadores CSS (Tailwind, PostCSS, Autoprefixer)
- Compiladores (TypeScript)
- Runtime dependencies

**Em `devDependencies`:**
- Tipos TypeScript (`@types/*`)
- Ferramentas de desenvolvimento (`tsx`, `esbuild`)
- Utilitários de desenvolvimento (`glob`, `drizzle-kit`)

## 🔧 Configuração do Build

### Estrutura de Arquivos

```
Operabase/
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   ├── index.html
│   └── ...
├── server/                 # Backend (Express + Node.js)
├── dist/
│   └── public/            # Build final (Netlify serve daqui)
├── netlify.toml           # Configuração Netlify
├── vite.config.ts         # Configuração Vite
└── package.json
```

### Scripts de Build

```json
{
  "scripts": {
    "build": "vite build",                    # Build apenas frontend
    "build:frontend": "vite build",           # Alias para frontend
    "build:full": "vite build && esbuild...", # Build completo (local)
    "start": "NODE_ENV=production node dist/index.js"
  }
}
```

**Importante:** Netlify usa apenas `npm run build` (frontend only).

## 🔐 Variáveis de Ambiente

### Configuração no Netlify

1. **Site settings** → **Environment variables**
2. Adicionar todas as variáveis do `.env`:

```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_POOLER_URL=your_pooler_url

# APIs externas
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Google Calendar
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Evolution API
EVOLUTION_API_BASE_URL=your_evolution_url
EVOLUTION_API_KEY=your_evolution_key

# Outros
NODE_ENV=production
```

### ⚠️ Segurança

- **NUNCA** commitar o arquivo `.env`
- Usar apenas variáveis necessárias para o frontend
- Backend variables não são necessárias (backend não roda no Netlify)

## 🔄 Redirects e SPA

### Configuração para Single Page Application

```toml
# netlify.toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Por que:** Permite que o React Router funcione corretamente com URLs diretas.

## 🛡️ Headers de Segurança

```toml
# netlify.toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

## 🐛 Troubleshooting

### 1. Erro: "Cannot find package"

**Problema:** Dependência em `devDependencies` mas necessária para build.

**Solução:** Mover para `dependencies`:
```bash
npm install --save package-name
npm uninstall --save-dev package-name
```

### 2. Erro: "Build script returned non-zero exit code"

**Causas Comuns:**
- Dependências faltando
- Erros TypeScript
- Problemas de importação
- Configuração Vite incorreta

**Debug:**
1. Testar build local: `npm run build`
2. Verificar logs do Netlify
3. Validar `vite.config.ts`

### 3. Erro: "Module not found"

**Problema:** Caminhos de importação incorretos ou componentes faltando.

**Solução:**
1. Verificar imports relativos vs absolutos
2. Confirmar que todos os arquivos existem
3. Validar aliases no `vite.config.ts`

### 4. CSS não carrega

**Problema:** TailwindCSS ou PostCSS não processando.

**Verificar:**
- `tailwindcss` em `dependencies`
- `postcss.config.js` correto
- `tailwind.config.ts` válido

## 📚 Lições Aprendidas

### 1. Dependências de Build vs Desenvolvimento

**❌ Erro Comum:**
```json
{
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.2",  // ❌ Build falha
    "tailwindcss": "^3.4.17"           // ❌ CSS não processa
  }
}
```

**✅ Correto:**
```json
{
  "dependencies": {
    "@vitejs/plugin-react": "^4.3.2",  // ✅ Build funciona
    "tailwindcss": "^3.4.17"           // ✅ CSS processa
  }
}
```

### 2. Teste Local vs Produção

**Local:** `npm install` instala tudo (`dependencies` + `devDependencies`)
**Netlify:** Instala apenas `dependencies` por padrão

**Dica:** Testar com `npm install --production` para simular Netlify.

### 3. Build Commands

**Frontend Only (Netlify):**
```bash
npm run build  # Só compila React/Vite → dist/public/
```

**Full Stack (Local):**
```bash
npm run build:full  # Compila frontend + backend
```

### 4. Estrutura de Projeto

- **Frontend:** `client/` → Deploy no Netlify
- **Backend:** `server/` → Deploy separado (Railway, Heroku, etc.)
- **Shared:** `shared/` → Código compartilhado

## 🎯 Checklist de Deploy

### Antes do Deploy

- [ ] Todas as build dependencies em `dependencies`
- [ ] `netlify.toml` configurado
- [ ] Build local funcionando (`npm run build`)
- [ ] Variáveis de ambiente listadas
- [ ] `.env` no `.gitignore`

### Configuração Netlify

- [ ] Repositório conectado
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist/public`
- [ ] Node version: 18
- [ ] Variáveis de ambiente configuradas

### Pós-Deploy

- [ ] Site carregando corretamente
- [ ] Rotas funcionando (SPA redirect)
- [ ] Assets carregando (CSS, JS, imagens)
- [ ] Console sem erros críticos

## 🔗 Links Úteis

- [Netlify Documentation](https://docs.netlify.com/)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)
- [Node.js Dependencies Guide](https://docs.npmjs.com/specifying-dependencies-and-devdependencies-in-a-package-json-file)

## 📝 Notas de Versão

- **v1.0** (Jul 2025): Configuração inicial com correção de dependências
- Build dependencies movidas para `dependencies`
- Headers de segurança configurados
- SPA redirects implementados

---

**Última atualização:** Julho 2025  
**Status:** ✅ Deploy funcionando no Netlify 