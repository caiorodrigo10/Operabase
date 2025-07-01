# Editor2 - Plano de Desenvolvimento Fase 1
## Sistema de Landing Pages com IA e JSON Semântico

---

## 📋 Visão Geral do Projeto

### Objetivo Principal
Transformar o Editor2 atual em um sistema capaz de gerar landing pages automaticamente a partir de comandos de IA, focando na construção baseada em estruturas JSON semânticas renderizadas em preview.

### Fluxo Principal Desejado
1. **Usuário envia comando via chat**: "Crie uma landing com título, texto e botão verde"
2. **IA interpreta o prompt**: Gera JSON com blocos e componentes da página
3. **JSON enviado para estado central**: PageProvider gerencia o estado da aplicação
4. **Preview renderiza em tempo real**: Canvas lê JSON e mostra página visual

### Estado Atual do Sistema
- ✅ Interface Editor2 com layout em grid (header, sidebar, toolbar, canvas)
- ✅ Sistema Craft.js híbrido implementado
- ✅ Preview funcional com JSON semântico
- ✅ Componentes base existentes (Container, Text, Button, Video, etc.)
- ❌ **Falta**: Sistema de renderização por JSON puro (sem Craft.js)
- ❌ **Falta**: PageProvider com Context API
- ❌ **Falta**: RenderBlock recursivo
- ❌ **Falta**: componentMap para mapeamento

---

## 🏗️ Arquitetura Técnica - Fase 1

### Componentes-Chave a Implementar

#### 1. **PageProvider** (Context API)
- **Função**: Armazenar JSON da página e permitir atualizações
- **Exposição**: `pageJson` (estado) e `setPageJson` (função de update)
- **Localização**: `client/src/contexts/PageProvider.tsx`

```tsx
interface PageContextType {
  pageJson: PageJSON | null;
  setPageJson: (json: PageJSON) => void;
}

const PageContext = createContext<PageContextType>();

export function PageProvider({ children }) {
  const [pageJson, setPageJson] = useState<PageJSON | null>(null);
  
  return (
    <PageContext.Provider value={{ pageJson, setPageJson }}>
      {children}
    </PageContext.Provider>
  );
}

export function usePage() {
  return useContext(PageContext);
}
```

#### 2. **RenderBlock** (Renderização Recursiva)
- **Função**: Renderizar blocos definidos no JSON recursivamente
- **Base**: Mapear nomes como "HeroSection" para componentes React via `componentMap`
- **Localização**: `client/src/components/editor2/Canvas/RenderBlock.tsx`

```tsx
interface RenderBlockProps {
  block: Block;
}

function RenderBlock({ block }: RenderBlockProps) {
  const { component, children } = block;
  const Component = componentMap[component.name] || DefaultComponent;
  
  return (
    <Component {...component.options}>
      {children?.map(child => (
        <RenderBlock key={child.id} block={child} />
      ))}
    </Component>
  );
}
```

#### 3. **componentMap** (Mapeamento)
- **Função**: Conectar nomes do JSON aos componentes React reais
- **Localização**: `client/src/components/editor2/Canvas/componentMap.ts`

```tsx
import { HeroSection } from '../Components/HeroSection';
import { Text } from '../Components/Text';
import { Button } from '../Components/Button';

export const componentMap = {
  HeroSection,
  Text,
  Button,
  // Outros componentes...
};
```

#### 4. **Canvas Atualizado**
- **Função**: Área de preview que lê `pageJson` e renderiza via `RenderBlock`
- **Modificação**: `client/src/components/editor2/Canvas/CanvasArea.tsx`

```tsx
function Canvas() {
  const { pageJson } = usePage();
  
  if (!pageJson) {
    return <div className="canvas-empty">Canvas vazio - aguardando JSON</div>;
  }
  
  return (
    <div className="canvas-container">
      <RenderBlock block={pageJson} />
    </div>
  );
}
```

---

## 📊 Estrutura JSON Semântica

### Schema Base
```json
{
  "id": "root",
  "component": {
    "name": "HeroSection",
    "options": {
      "title": "Transforme sua clínica digital",
      "buttonText": "Comece agora"
    }
  },
  "children": [
    {
      "id": "text1",
      "component": {
        "name": "Text",
        "options": {
          "text": "Com tecnologia e IA, crie sua landing em minutos"
        }
      }
    },
    {
      "id": "button1",
      "component": {
        "name": "Button",
        "options": {
          "text": "Quero começar"
        }
      }
    }
  ]
}
```

### Regras Técnicas
1. **Campos obrigatórios**: `id`, `component.name`, `component.options`
2. **Campos opcionais**: `children`, `styles`, `responsiveStyles`
3. **IDs únicos**: Cada bloco deve ter ID único para React keys
4. **Renderização segura**: `children?.map()` para evitar erros

---

## 🚀 Plano de Implementação - Fase 1

### **ETAPA 1: Criação do PageProvider**
**Tempo estimado**: 1-2 horas
**Arquivos a criar/modificar**:
- ✨ `client/src/contexts/PageProvider.tsx` (NOVO)
- 🔧 `client/src/pages/editor2.tsx` (modificar - adicionar Provider)

**Tarefas**:
1. Criar Context API com TypeScript
2. Implementar hook `usePage()`
3. Definir interface `PageJSON` em `shared/types.ts`
4. Envolver Editor2 com PageProvider
5. Testar contexto básico

### **ETAPA 2: Componentes Base Simplificados**
**Tempo estimado**: 2-3 horas
**Arquivos a criar**:
- ✨ `client/src/components/editor2/Components/HeroSection.tsx`
- ✨ `client/src/components/editor2/Components/Text.tsx`
- ✨ `client/src/components/editor2/Components/Button.tsx`
- ✨ `client/src/components/editor2/Canvas/componentMap.ts`

**Tarefas**:
1. Criar HeroSection com props `title`, `buttonText`, `children`
2. Criar Text com prop `text`
3. Criar Button com prop `text`
4. Implementar componentMap básico
5. Adicionar componente DefaultComponent para casos não mapeados

### **ETAPA 3: Sistema RenderBlock**
**Tempo estimado**: 2-3 horas
**Arquivos a criar**:
- ✨ `client/src/components/editor2/Canvas/RenderBlock.tsx`

**Tarefas**:
1. Implementar lógica recursiva de renderização
2. Integrar com componentMap
3. Adicionar tratamento de erro para componentes não encontrados
4. Implementar renderização de children com keys corretas
5. Testar renderização aninhada

### **ETAPA 4: Atualização do Canvas**
**Tempo estimado**: 1-2 horas
**Arquivos a modificar**:
- 🔧 `client/src/components/editor2/Canvas/CanvasArea.tsx`

**Tarefas**:
1. Remover dependência atual do Craft.js temporariamente
2. Integrar com usePage() hook
3. Renderizar RenderBlock quando pageJson disponível
4. Implementar estado vazio elegante
5. Adicionar loading states

### **ETAPA 5: JSON Mock e Testes**
**Tempo estimado**: 1-2 horas
**Arquivos a criar**:
- ✨ `client/src/data/mockPageJson.ts`
- ✨ `client/src/components/editor2/Debug/JSONTester.tsx`

**Tarefas**:
1. Criar JSON de exemplo baseado no schema definido
2. Implementar botão de teste para carregar JSON mock
3. Implementar função `setPageJson()` no debug
4. Testar renderização completa
5. Validar children recursivos

### **ETAPA 6: Limpeza e Documentação**
**Tempo estimado**: 1 hora
**Arquivos a criar/modificar**:
- ✨ `EDITOR2-FASE1-RESULTADOS.md`
- 🔧 Atualizar `replit.md`

**Tarefas**:
1. Documentar funcionalidades implementadas
2. Criar guia de uso do sistema JSON
3. Documentar próximos passos (Fase 2)
4. Atualizar documentação do projeto
5. Preparar exemplos de uso

---

## 🎯 Critérios de Sucesso - Fase 1

### Funcionalidades Mínimas
- ✅ PageProvider funcional com Context API
- ✅ RenderBlock renderizando componentes básicos
- ✅ componentMap mapeando corretamente
- ✅ Canvas exibindo JSON mockado
- ✅ Sistema reativo (mudança de JSON atualiza Canvas)

### Componentes Funcionais
- ✅ HeroSection com título e botão
- ✅ Text renderizando texto simples
- ✅ Button básico funcional
- ✅ Children recursivos funcionando

### Comportamento Esperado
1. **Carregar Editor2**: Canvas mostra estado vazio
2. **Aplicar JSON mock**: Canvas renderiza componentes definidos
3. **Atualizar JSON**: Preview reage automaticamente
4. **Componentes renderizam**: HeroSection + Text + Button visíveis
5. **Sem drag-and-drop**: Apenas renderização por JSON

---

## 🔄 Próximas Fases (Planejamento Futuro)

### **Fase 2**: Integração com IA
- Chat funcional conectado a API
- Geração de JSON via prompts
- Sistema de comandos naturais

### **Fase 3**: Componentes Avançados
- Image, Video, Form components
- Sistema de estilos avançados
- Responsive design

### **Fase 4**: Persistência e Templates
- Salvamento no backend
- Sistema de templates
- Histórico de versões

### **Fase 5**: Editor Visual
- Drag-and-drop opcional
- Edição inline
- Integração híbrida JSON + Visual

---

## ⚠️ Considerações Técnicas

### Compatibilidade
- Manter sistema Craft.js atual em paralelo
- Não quebrar preview existente
- Transição gradual para novo sistema

### Performance
- React.memo nos componentes base
- Lazy loading para componentes complexos
- Debounce em atualizações de JSON

### Arquitetura
- Separação clara entre renderização JSON e Craft.js
- Interfaces TypeScript bem definidas
- Sistema de fallback robusto

---

## 📝 Conclusão da Fase 1

Ao final desta fase, teremos um sistema funcional de renderização de landing pages baseado puramente em JSON, preparado para integração com IA. O sistema será independente, testável e escalável para as próximas fases de desenvolvimento.

**Resultado esperado**: Canvas renderizando páginas completas a partir de estruturas JSON, com sistema reativo e componentes base funcionais, preparado para comandos de IA na Fase 2.