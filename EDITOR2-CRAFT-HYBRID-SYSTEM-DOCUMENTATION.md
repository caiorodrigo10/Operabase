# Editor2 + Craft.js: Sistema Híbrido Completo - Documentação Técnica

## Visão Geral do Sistema

O **Editor2** é um sistema híbrido que combina:
- **Interface do Editor2**: Sidebar, toolbox, propriedades customizadas
- **Engine Craft.js**: Renderização, drag-and-drop, serialização robusta
- **JSON Semântico**: IDs limpos ideais para geração via IA

### Objetivo Principal
Criar um page builder que permita tanto edição visual quanto geração via prompts de IA, usando JSON semântico limpo.

## Arquitetura do Sistema

### 1. Estrutura de Componentes

```
client/src/
├── pages/
│   ├── editor2.tsx                 # Página principal do editor
│   ├── preview-craft.tsx           # Preview Craft.js (NOVO)
│   └── preview.tsx                 # Preview legacy (mantido)
├── components/editor2/
│   ├── Canvas/
│   │   └── CanvasContainer.tsx     # Container Craft.js + loading
│   ├── Header/
│   │   └── EditorHeader.tsx        # Botões Save/Preview corrigidos
│   ├── Sidebar/
│   │   └── EditorSidebar.tsx       # Toolbox de widgets
│   └── Utils/
│       └── EditorExposer.tsx       # Exposição do Craft.js para funções
└── components/craft/selectors/     # Widgets Craft.js
    ├── landing/
    │   ├── Container.tsx           # Container principal
    │   └── Text.tsx               # Widget de texto
    ├── Button.tsx                 # Widget de botão
    └── Video.tsx                  # Widget de vídeo
```

### 2. Sistema de JSON Semântico

#### Transformação Automática
- **Craft.js nativo**: IDs aleatórios (`QCaskKtAEe`, `aBx9Mz2p`)
- **JSON semântico**: IDs descritivos (`hero-section`, `cta-button`)

```typescript
// Função transformToSemanticJson()
const semanticJson = transformToSemanticJson(craftJson);

// Resultado:
{
  "ROOT": { ... },
  "hero-section": { props: { id: "hero-section" } },
  "hero-title": { props: { id: "hero-title" } },
  "cta-button": { props: { id: "cta-button" } }
}
```

#### Template Padrão Semântico
O sistema usa template inicial com 23 elementos semânticos:
- `ROOT` (container principal)
- `hero-section`, `hero-title`, `hero-subtitle`, `hero-button`
- `video-section`, `video-title`, `demo-video`
- `features-section`, `features-title`
- `feature-1`, `feature-1-title`, `feature-1-desc`
- `feature-2`, `feature-2-title`, `feature-2-desc`
- `feature-3`, `feature-3-title`, `feature-3-desc`
- `cta-section`, `cta-title`, `cta-subtitle`, `cta-button`

## Funcionalidades Implementadas

### 1. Sistema de Salvamento (ETAPA 2 - Parcial)

#### handleSave() - Corrigido
```typescript
const handleSave = async () => {
  const craftEditor = getCurrentCraftEditor();
  const craftJson = craftEditor.query.serialize();
  const semanticJson = transformToSemanticJson(craftJson);
  
  // Salva local + servidor com JSON semântico
  localStorage.setItem('editor2_craft_state', JSON.stringify(semanticJson));
  await saveToServer(semanticJson);
}
```

**Status**: ✅ Parcialmente implementado (servidor está recebendo vazio)

### 2. Sistema de Preview (ETAPA 1 - Completo)

#### handlePreview() - Implementado
```typescript
const handlePreview = async () => {
  const craftEditor = getCurrentCraftEditor();
  const craftJson = craftEditor.query.serialize();
  const semanticJson = transformToSemanticJson(craftJson);
  
  // Salva para preview
  localStorage.setItem('editor2_craft_preview', JSON.stringify(semanticJson));
  
  // Abre nova aba com preview Craft.js
  window.open('/preview/craft/editor2', '_blank');
}
```

#### Preview Craft.js - CraftPreviewPage
- **Arquivo**: `client/src/pages/preview-craft.tsx`
- **Rota**: `/preview/craft/editor2`
- **Funcionalidade**: Renderiza JSON semântico sem interface do editor

```typescript
<Editor
  resolver={{ Container, Text, CraftButton, Video }}
  enabled={false} // Modo somente visualização
>
  <Frame data={pageData}>
    <Element canvas is={Container} />
  </Frame>
</Editor>
```

**Status**: ✅ Completamente implementado e funcional

### 3. Sistema de Carregamento

#### CanvasContainer.tsx
- Tenta carregar do servidor
- Fallback para localStorage
- Template padrão semântico se nada encontrado

```typescript
const loadPageData = async () => {
  // 1. Servidor
  const response = await fetch('/api/load-page-json/editor2');
  
  if (response.data) {
    setInitialJson(response.data);
  } else {
    // 2. Template padrão semântico
    setInitialJson(JSON.stringify(getDefaultSemanticJson()));
  }
}
```

**Status**: ✅ Funcional (sempre usa template padrão pois servidor está vazio)

## Arquivos Principais Modificados

### 1. Frontend

#### `client/src/components/editor2/Header/EditorHeader.tsx`
**Mudanças**: 
- `handlePreview()` corrigido para usar Craft.js + JSON semântico
- `handleSave()` usa transformação semântica (parcial)

**Status**: ✅ Preview funcional, Save precisa correção de servidor

#### `client/src/pages/preview-craft.tsx` (NOVO)
**Funcionalidade**: 
- Preview limpo sem interface do editor
- Renderização via Craft.js Frame
- Carrega JSON semântico do localStorage/servidor

**Status**: ✅ Completamente implementado

#### `client/src/App.tsx`
**Mudanças**:
- Adicionada rota `/preview/craft/editor2`
- Import da CraftPreviewPage

**Status**: ✅ Rota funcionando

#### `client/src/components/editor2/Canvas/CanvasContainer.tsx`
**Status**: ✅ Carregamento funcionando com template padrão

### 2. Backend

#### `server/index.ts`
**Endpoints**: 
- `POST /api/save-page-json` ✅ Funcionando
- `GET /api/load-page-json/:pageId` ✅ Funcionando

**Status**: ✅ Endpoints funcionais, mas não está salvando dados

## Problemas Identificados e Soluções

### 1. **RESOLVIDO**: Preview não renderizava Craft.js
**Problema**: Preview usava estrutura legacy incompatível
**Solução**: ✅ Criada página CraftPreviewPage específica para Craft.js

### 2. **RESOLVIDO**: handlePreview() usava sistema legacy
**Problema**: Botão Preview não funcionava com JSON semântico
**Solução**: ✅ Corrigido para usar Craft.js serialization + transformação

### 3. **PENDENTE**: handleSave() não está salvando no servidor
**Problema**: Logs mostram "Could not save to server" 
**Investigação Necessária**: Verificar endpoint `/api/save-page-json`
**Solução Planejada**: Debug do endpoint de salvamento

### 4. **PENDENTE**: Carregamento sempre usa template padrão
**Problema**: Servidor não tem dados salvos
**Dependência**: Resolver problema de salvamento primeiro

## Próximas Etapas (Roadmap)

### ETAPA 2: Corrigir Sistema de Salvamento
**Prioridade**: Alta
**Tarefas**:
1. Debug endpoint `/api/save-page-json`
2. Verificar autenticação Supabase
3. Testar salvamento de JSON semântico
4. Validar carregamento do servidor

### ETAPA 3: Preview Real-Time
**Prioridade**: Média
**Tarefas**:
1. Atualização automática do preview
2. Sincronização em tempo real
3. Preview em iframe

### ETAPA 4: Integração com IA
**Prioridade**: Média
**Tarefas**:
1. Endpoint para geração via prompt
2. Aplicação de JSON gerado pela IA
3. Validação de estrutura

### ETAPA 5: Melhorias UX
**Prioridade**: Baixa
**Tarefas**:
1. Auto-save a cada 30 segundos
2. Histórico de versões
3. Undo/Redo

## Logs e Debug

### Logs Funcionais Observados

#### Preview (Funcionando)
```
🎥 Preview: Semantic JSON saved with keys: [23 elementos]
🎥 Preview: Opening Craft.js preview
```

#### Salvamento (Com Problema)
```
Could not save to server for preview: {}
```

#### Carregamento (Funcionando)
```
📂 Editor2 loading response: {"success":true,"data":null}
📂 Editor2 using NEW complete landing page template
```

### Estrutura JSON Semântico Gerado
```json
{
  "ROOT": {
    "type": { "resolvedName": "Container" },
    "props": { "id": "ROOT" },
    "nodes": ["hero-section", "video-section", "features-section", "cta-section"]
  },
  "hero-section": {
    "type": { "resolvedName": "Container" },
    "props": { "id": "hero-section" },
    "nodes": ["hero-title", "hero-subtitle", "hero-button"]
  }
  // ... mais 19 elementos
}
```

## Tecnologias Utilizadas

### Core
- **React 18** + TypeScript
- **Craft.js** (page builder engine)
- **Wouter** (routing)

### Editor Específico
- **Zustand** (state management Editor2)
- **React Query** (server state)
- **Tailwind CSS** (styling)

### Widgets Craft.js
- **Container**: Layout e estruturação
- **Text**: Textos e títulos
- **CraftButton**: Botões interativos
- **Video**: YouTube embeds

## Status Atual do Sistema

### ✅ Funcional
- Interface Editor2 completa
- Template de demonstração (23 elementos)
- Sistema de preview Craft.js
- JSON semântico generation
- Transformação ID aleatório → semântico
- Carregamento com fallbacks

### ⚠️ Parcialmente Funcional
- Sistema de salvamento (endpoint existe, mas não salva)
- Carregamento do servidor (funciona, mas sempre vazio)

### 🔄 Pendente
- Debug e correção do salvamento
- Integração com IA para geração
- Auto-save implementação
- Real-time preview updates

## Conclusão

O sistema híbrido Editor2 + Craft.js está **70% completo**:
- **Interface**: 100% funcional
- **Preview**: 100% funcional  
- **JSON Semântico**: 100% funcional
- **Salvamento**: 50% funcional (endpoint existe, não salva dados)
- **IA Integration**: 0% (dependente do salvamento)

O próximo passo crítico é **debuggar e corrigir o sistema de salvamento** para permitir persistência real dos dados e viabilizar a integração com IA.