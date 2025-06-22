import React from 'react';
import { Editor, Frame, Element, useNode, useEditor } from '@craftjs/core';
import { useParams, Link } from 'wouter';
import { ArrowLeft, Eye, Save, Move, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Simple user components for the editor
const Text = ({ text = "Clique para editar", fontSize = 16, textAlign = 'left', color = '#000000' }: any) => {
  const { connectors: { connect, drag } } = useNode();
  return (
    <div ref={(ref: HTMLDivElement | null) => ref && connect(drag(ref))}>
      <p style={{ fontSize: `${fontSize}px`, textAlign, color, margin: 0, padding: '8px 0' }}>
        {text}
      </p>
    </div>
  );
};

const Container = ({ background = '#ffffff', padding = 20, children }: any) => {
  const { connectors: { connect, drag } } = useNode();
  return (
    <div 
      ref={(ref: HTMLDivElement | null) => ref && connect(drag(ref))}
      style={{
        margin: "5px 0", 
        background, 
        padding: `${padding}px`,
        border: "1px solid #e2e8f0",
        borderRadius: "6px",
        minHeight: "40px"
      }}
    >
      {children}
    </div>
  );
};

const CraftButton = ({ children = "Clique aqui", size = 'default', variant = 'default' }: any) => {
  const { connectors: { connect, drag } } = useNode();
  return (
    <div ref={(ref: HTMLDivElement | null) => ref && connect(drag(ref))} className="inline-block">
      <Button size={size} variant={variant}>
        {children}
      </Button>
    </div>
  );
};

// Add craft configuration to components
(Text as any).craft = {
  props: { text: "Clique para editar", fontSize: 16, textAlign: 'left', color: '#000000' },
  related: { settings: TextSettings }
};

(Container as any).craft = {
  props: { background: '#ffffff', padding: 20 },
  related: { settings: ContainerSettings }
};

(CraftButton as any).craft = {
  props: { children: "Clique aqui", size: 'default', variant: 'default' },
  related: { settings: ButtonSettings }
};

// Settings components
function TextSettings() {
  const { actions, props } = useNode((node) => ({
    props: node.data.props
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label>Texto</Label>
        <Input
          value={props.text}
          onChange={(e) => actions.setProp((props: any) => props.text = e.target.value)}
        />
      </div>
      <div>
        <Label>Tamanho: {props.fontSize}px</Label>
        <Slider
          value={[props.fontSize]}
          onValueChange={(value) => actions.setProp((props: any) => props.fontSize = value[0])}
          max={48}
          min={12}
          step={1}
        />
      </div>
      <div>
        <Label>Cor</Label>
        <Input
          type="color"
          value={props.color}
          onChange={(e) => actions.setProp((props: any) => props.color = e.target.value)}
        />
      </div>
    </div>
  );
}

function ContainerSettings() {
  const { actions, props } = useNode((node) => ({
    props: node.data.props
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label>Cor de Fundo</Label>
        <Input
          type="color"
          value={props.background}
          onChange={(e) => actions.setProp((props: any) => props.background = e.target.value)}
        />
      </div>
      <div>
        <Label>Espaçamento: {props.padding}px</Label>
        <Slider
          value={[props.padding]}
          onValueChange={(value) => actions.setProp((props: any) => props.padding = value[0])}
          max={100}
          min={0}
          step={5}
        />
      </div>
    </div>
  );
}

function ButtonSettings() {
  const { actions, props } = useNode((node) => ({
    props: node.data.props
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label>Texto do Botão</Label>
        <Input
          value={props.children}
          onChange={(e) => actions.setProp((props: any) => props.children = e.target.value)}
        />
      </div>
      <div>
        <Label>Tamanho</Label>
        <Select
          value={props.size}
          onValueChange={(value) => actions.setProp((props: any) => props.size = value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Pequeno</SelectItem>
            <SelectItem value="default">Médio</SelectItem>
            <SelectItem value="lg">Grande</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// Toolbox component for dragging elements
function Toolbox() {
  const { connectors } = useEditor();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm">Elementos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          ref={(ref: HTMLButtonElement | null) => 
            ref && connectors.create(ref, <Text text="Novo texto" />)
          }
          variant="outline"
          size="sm"
          className="w-full justify-start"
        >
          📝 Texto
        </Button>
        
        <Button
          ref={(ref: HTMLButtonElement | null) => 
            ref && connectors.create(ref, <CraftButton>Novo botão</CraftButton>)
          }
          variant="outline"
          size="sm"
          className="w-full justify-start"
        >
          🔘 Botão
        </Button>
        
        <Button
          ref={(ref: HTMLButtonElement | null) => 
            ref && connectors.create(ref, 
              <Element is={Container} canvas>
                <Text text="Arraste elementos aqui" />
              </Element>
            )
          }
          variant="outline"
          size="sm"
          className="w-full justify-start"
        >
          📦 Container
        </Button>
      </CardContent>
    </Card>
  );
}

// Settings panel component
function SettingsPanel() {
  const { actions, query, selected } = useEditor((state, query) => {
    const currentNodeId = query.getEvent('selected').last();
    let selected;

    if (currentNodeId) {
      selected = {
        id: currentNodeId,
        name: state.nodes[currentNodeId].data.name,
        settings: state.nodes[currentNodeId].related && state.nodes[currentNodeId].related.settings,
        isDeletable: query.node(currentNodeId).isDeletable()
      };
    }

    return { selected };
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm">Propriedades</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selected ? (
          <>
            {selected.settings && React.createElement(selected.settings)}
            
            {selected.isDeletable && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-red-600 hover:text-red-700"
                onClick={() => actions.delete(selected.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
          </>
        ) : (
          <div className="text-center text-sm text-gray-500 py-8">
            Selecione um elemento para editar
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Mock data for the page being edited
const mockPageData = {
  "page-1": {
    id: "page-1",
    title: "Landing Page",
    status: "published",
    type: "landing"
  },
  "page-2": {
    id: "page-2", 
    title: "Sobre Nossos Serviços",
    status: "published",
    type: "content"
  },
  "page-3": {
    id: "page-3",
    title: "Agendar Consulta",
    status: "draft",
    type: "form"
  },
  "page-4": {
    id: "page-4",
    title: "Página de Obrigado",
    status: "published",
    type: "thank-you"
  }
};

export default function FunilPageEditor() {
  const [enabled, setEnabled] = React.useState(true);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/funis">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Funis
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Editor de Página
            </h1>
            <p className="text-sm text-gray-500">
              Editor visual com Craft.js
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEnabled(!enabled)}
          >
            {enabled ? 'Desabilitar Editor' : 'Habilitar Editor'}
          </Button>
          
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
          
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Craft.js Editor */}
      <div className="flex-1 flex">
        <Editor
          resolver={{
            Container,
            Text,
            CraftButton,
          }}
          enabled={enabled}
        >
          {/* Main Editor Area */}
          <div className="flex-1 relative">
            <div className="h-full bg-gray-100 p-6">
              <Frame>
                <Element
                  is={Container}
                  canvas
                  background="#ffffff"
                  padding={40}
                  style={{
                    width: '100%',
                    minHeight: '600px',
                    maxWidth: '800px',
                    margin: '0 auto',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                  }}
                >
                  <Text 
                    text="Bem-vindo ao Editor de Páginas" 
                    fontSize={32} 
                    textAlign="center"
                    color="#1f2937"
                  />
                  <Text 
                    text="Esta é uma página editável do seu funil. Clique nos elementos para personalizá-los."
                    fontSize={16}
                    textAlign="center"
                    color="#6b7280"
                  />
                  
                  <Element
                    is={Container}
                    canvas
                    background="#f8fafc"
                    padding={30}
                    style={{ marginTop: '20px' }}
                  >
                    <Text 
                      text="Conteúdo Principal"
                      fontSize={24}
                      color="#1f2937"
                    />
                    <Text 
                      text="Adicione aqui o conteúdo principal da sua página. Você pode editar este texto, adicionar botões e outros elementos."
                      fontSize={14}
                      color="#4b5563"
                    />
                    <CraftButton size="lg">
                      Agendar Consulta
                    </CraftButton>
                  </Element>
                </Element>
              </Frame>
            </div>
          </div>

          {/* Sidebar with Toolbox and Settings */}
          <div className="w-80 bg-white border-l border-gray-200 p-4 space-y-4 overflow-y-auto">
            <Toolbox />
            <SettingsPanel />
          </div>
        </Editor>
      </div>
    </div>
  );
}