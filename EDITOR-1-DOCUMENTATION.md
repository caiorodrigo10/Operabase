# Editor 1 - Documentação Completa do Sistema de Page Builder

## Visão Geral
O Editor 1 é um sistema completo de page builder baseado em Craft.js que permite criar, editar e gerenciar páginas web através de uma interface visual drag-and-drop com funcionalidades avançadas de AI CODE e persistência de dados.

## Localização
- **Rota**: `/editor-landing`
- **Arquivo Principal**: `client/src/pages/funil-editor-landing.tsx`
- **Tipo**: Editor Base para demonstração e desenvolvimento

## Arquitetura Geral

### 1. Tecnologias Utilizadas
- **Craft.js**: Framework principal para page building
- **React + TypeScript**: Interface e lógica
- **Tailwind CSS**: Estilização
- **Supabase**: Autenticação
- **Express API**: Backend para persistência
- **OpenAI GPT-4**: AI CODE functionality

### 2. Estrutura de Componentes

#### Componentes Básicos do Editor
```typescript
// Componentes disponíveis para arrastar e soltar
- Container: Elemento contenedor flexível
- Text: Componente de texto editável
- CraftButton: Botão customizável
- Video: Player de vídeo YouTube
- LandingCard: Card container
- HeroSection: Seção hero
- VideoComponent: Componente de vídeo dedicado
```

#### Configuração do Editor
```typescript
<Editor
  resolver={{
    Container,
    Text,
    CraftButton,
    Video,
    LandingCard,
    HeroSection,
    VideoComponent,
  }}
  enabled={true}
  onRender={RenderNode}
>
```

## Sistema de Persistência

### 1. Arquitetura de Salvamento
O sistema utiliza uma abordagem dupla de persistência:

#### Local Storage (Backup)
```typescript
localStorage.setItem('craft_editor_state', json);
```

#### Servidor (Principal)
```typescript
// Endpoint de salvamento
POST /api/save-page-json
{
  "pageId": "funil-editor-landing",
  "jsonData": "{ estrutura JSON completa }"
}

// Endpoint de carregamento
GET /api/load-page-json/:pageId
```

### 2. Estrutura do JSON
O JSON salvo contém a estrutura completa da página:
```json
{
  "ROOT": {
    "type": { "resolvedName": "Container" },
    "isCanvas": true,
    "props": { ... },
    "nodes": ["id1", "id2", "id3"],
    "linkedNodes": {}
  },
  "id1": {
    "type": { "resolvedName": "Text" },
    "props": { "text": "conteúdo", "fontSize": "16" },
    "parent": "ROOT"
  }
}
```

### 3. Fluxo de Carregamento
1. **Iniciação**: Página carrega com estado de loading
2. **Busca no Servidor**: Tenta carregar JSON salvo via API
3. **Fallback**: Se não encontrar, busca no localStorage
4. **Renderização**: Aplica o JSON ao Frame do Craft.js
5. **Estado Padrão**: Se nenhum salvo, usa conteúdo hardcoded

## Interface de Controles

### 1. Barra de Controles Principais
```typescript
// Botões de ação principais
- Salvar Estado: Persiste no servidor + localStorage
- Carregar Estado: Recarrega do localStorage
- Ver JSON: Abre modal de edição
- Limpar & Resetar: Remove dados salvos
```

### 2. Modal de Edição JSON
Funcionalidades do modal:
- **Visualização**: JSON formatado e legível
- **Edição**: Textarea editável com syntax highlighting
- **Validação**: Parse e validação antes de aplicar
- **Botões de Ação**:
  - Copiar JSON
  - Resetar alterações
  - Salvar JSON (aplica + persiste)
  - Fechar modal

### 3. Interface de Drag & Drop
- **Sidebar**: Lista de componentes disponíveis
- **Viewport**: Área de edição principal
- **Toolbar**: Configurações do elemento selecionado
- **Indicators**: Guias visuais de posicionamento

## Sistema AI CODE

### 1. Integração com OpenAI
```typescript
// Configuração da API
const aiDevConfig = await fetch('/api/ai-dev/config');
// Utiliza GPT-4 para interpretação de comandos
```

### 2. Funcionalidade
- **Análise Semântica**: Interpreta comandos em linguagem natural
- **Modificação Direta**: Edita o JSON da página diretamente
- **Aplicação Instantânea**: Mudanças aparecem em tempo real
- **Preservação de Estado**: Mantém integridade da estrutura

### 3. Exemplos de Comandos
```
"Mude o título principal para 'Minha Landing Page'"
"Torne o botão verde"
"Adicione uma nova seção com texto sobre nossos serviços"
```

## Componentes Técnicos Detalhados

### 1. RenderNode.tsx
**Propósito**: Gerencia a renderização e interação visual dos elementos
**Funcionalidades**:
- Indicadores visuais de seleção
- Controles de movimento e exclusão
- Posicionamento dinâmico
- Tratamento de eventos DOM

**Principais Métodos**:
```typescript
getPos(): Calcula posição do elemento
scroll(): Atualiza posição durante scroll
```

### 2. Resizer.tsx
**Propósito**: Permite redimensionamento visual dos elementos
**Funcionalidades**:
- Handles de redimensionamento
- Conversão entre unidades (px, %)
- Preservação de proporções
- Feedback visual durante resize

### 3. Sistema de Autenticação
```typescript
// Integração com Supabase
const { data: { session } } = await supabase.auth.getSession();

// Headers de autenticação
headers: {
  'Authorization': `Bearer ${session?.access_token}`,
}
```

## APIs e Endpoints

### 1. Salvamento de Página
```typescript
POST /api/save-page-json
{
  pageId: string,
  jsonData: string
}
Response: { success: boolean, message: string }
```

### 2. Carregamento de Página
```typescript
GET /api/load-page-json/:pageId
Response: { 
  success: boolean, 
  data: string | null 
}
```

### 3. Configuração AI
```typescript
GET /api/ai-dev/config
Response: {
  configured: boolean,
  apiKey: string (masked)
}
```

## Tratamento de Erros

### 1. DOM Access Errors
Proteção contra `getBoundingClientRect` errors:
```typescript
// Verificações de null
if (!dom || !dom.getBoundingClientRect) return;

// Try-catch blocks
try {
  const rect = dom.getBoundingClientRect();
} catch (error) {
  console.warn('Error getting bounding rect:', error);
  return { top: '0px', left: '0px' };
}
```

### 2. JSON Validation
```typescript
try {
  const parsedJson = JSON.parse(editableJson);
  actions.deserialize(jsonString);
} catch (error) {
  alert('Erro: JSON inválido. Verifique a sintaxe.');
}
```

### 3. Network Errors
Fallback para localStorage em caso de falha no servidor:
```typescript
try {
  const response = await fetch('/api/load-page-json/...');
} catch (error) {
  const savedState = localStorage.getItem('craft_editor_state');
}
```

## Fluxo de Desenvolvimento

### 1. Adição de Novos Componentes
1. Criar componente React com `craft` configuration
2. Adicionar ao `resolver` do Editor
3. Implementar `Settings` component se necessário
4. Testar drag & drop functionality

### 2. Modificações na Persistência
1. Atualizar endpoints `/api/save-page-json` e `/api/load-page-json`
2. Modificar lógica de carregamento no componente principal
3. Testar fallbacks e error handling

### 3. Integração AI CODE
1. Configurar OpenAI API key via `/api/ai-dev/config`
2. Implementar prompts específicos para novos componentes
3. Testar interpretação de comandos naturais

## Configurações de Performance

### 1. Debouncing
```typescript
// Salvamento com debounce
setProp((prop: any) => {
  prop[propKey.width] = width;
  prop[propKey.height] = height;
}, 500);
```

### 2. Loading States
```typescript
const [isLoading, setIsLoading] = useState(true);
const [editorReady, setEditorReady] = useState(false);
```

### 3. Error Boundaries
Proteção contra crashes durante operações críticas:
- DOM manipulation
- JSON parsing
- API calls
- Drag operations

## Limitações Conhecidas

### 1. TypeScript Warnings
- Alguns warnings sobre props em React.Fragment
- Tipos não completamente definidos em alguns componentes craft

### 2. Browser Compatibility
- Requer browsers modernos com suporte a getBoundingClientRect
- Dependente de CSS Grid e Flexbox

### 3. Performance
- JSON pode ficar extenso com páginas complexas
- Re-renders durante drag operations podem impactar performance

## Próximos Desenvolvimentos

### 1. Componentes Sugeridos
- Image component com upload
- Form components (input, textarea, select)
- Navigation components
- Advanced layout components

### 2. Funcionalidades
- Undo/Redo system
- Component templates
- Export to static HTML
- Multi-page management

### 3. AI Enhancements
- Natural language style modifications
- Component generation from descriptions
- Auto-optimization suggestions

## Estrutura de Arquivos

```
client/src/pages/funil-editor-landing.tsx     # Componente principal
client/src/components/craft/
├── editor/
│   ├── RenderNode.tsx                        # Renderização de nós
│   ├── Toolbar/                              # Barra de ferramentas
│   └── Viewport/                             # Área de edição
├── selectors/
│   └── Resizer.tsx                           # Sistema de resize
└── user/                                     # Componentes do usuário
server/index.ts                               # Endpoints de API
client/src/utils/numToMeasurement.ts          # Utilitários de medição
```

## Comandos Úteis

### 1. Desenvolvimento
```bash
npm run dev                    # Inicia servidor de desenvolvimento
```

### 2. Debug
```javascript
// No console do browser
localStorage.getItem('craft_editor_state')  # Ver JSON salvo
localStorage.removeItem('craft_editor_state') # Limpar estado
```

---

**Versão**: Editor 1 (Base)
**Data**: Dezembro 2024
**Status**: Funcional e Estável