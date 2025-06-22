import React from 'react';
import { Editor, Frame, Element, useNode } from '@craftjs/core';
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
  const { funilId, pageId } = useParams();
  const [enabled, setEnabled] = React.useState(true);
  
  const currentPage = mockPageData[pageId as keyof typeof mockPageData];
  
  if (!currentPage) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Página não encontrada</h1>
          <Link href={`/funis/${funilId}`}>
            <Button>Voltar ao Funil</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/funis/${funilId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Funil
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Editor: {currentPage.title}
            </h1>
            <p className="text-sm text-gray-500">
              Tipo: {currentPage.type} • Status: {currentPage.status}
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
      <div className="flex-1 relative">
        <Editor
          resolver={{
            Container,
            Text,
            Custom1,
            Custom2,
            Custom2VideoDrop,
            Custom3,
            Custom3BtnDrop,
            OnlyButtons,
            Button: CraftButton,
            Video,
          }}
          enabled={enabled}
          onRender={RenderNode}
        >
          <Viewport>
            <Frame>
              <Element
                canvas
                is={Container}
                width="800px"
                height="auto"
                background={{ r: 255, g: 255, b: 255, a: 1 }}
                padding={['40', '40', '40', '40']}
                custom={{ displayName: 'App' }}
              >
                <Element
                  canvas
                  is={Container}
                  flexDirection="column"
                  width="100%"
                  height="auto"
                  padding={['40', '40', '40', '40']}
                  margin={['0', '0', '40', '0']}
                  custom={{ displayName: 'Header Section' }}
                >
                  <Text
                    fontSize="32"
                    fontWeight="bold"
                    text={`Bem-vindo à ${currentPage.title}`}
                    textAlign="center"
                  />
                  <Text
                    fontSize="16"
                    fontWeight="400"
                    text="Esta é uma página editável do seu funil. Clique nos elementos para personalizá-los."
                    textAlign="center"
                  />
                </Element>

                <Element
                  canvas
                  is={Container}
                  background={{ r: 248, g: 250, b: 252, a: 1 }}
                  flexDirection="row"
                  width="100%"
                  height="auto"
                  padding={['40', '40', '40', '40']}
                  margin={['0', '0', '40', '0']}
                  custom={{ displayName: 'Content Section' }}
                >
                  <Element
                    canvas
                    is={Container}
                    width="50%"
                    height="100%"
                    padding={['0', '20', '0', '0']}
                    custom={{ displayName: 'Left Column' }}
                  >
                    <Text
                      fontSize="20"
                      fontWeight="600"
                      text="Conteúdo Principal"
                    />
                    <Text
                      fontSize="14"
                      fontWeight="400"
                      text="Adicione aqui o conteúdo principal da sua página. Você pode editar este texto, adicionar botões, imagens e outros elementos."
                    />
                  </Element>
                  
                  <Element
                    canvas
                    is={Container}
                    width="50%"
                    height="100%"
                    padding={['0', '0', '0', '20']}
                    custom={{ displayName: 'Right Column' }}
                  >
                    <Custom2
                      background={{
                        r: 59,
                        g: 130,
                        b: 246,
                        a: 1,
                      }}
                      height="200px"
                      width="100%"
                      padding={['20', '20', '20', '20']}
                      margin={['0', '0', '20', '0']}
                      shadow={20}
                      flexDirection="column"
                      alignItems="center"
                    />
                  </Element>
                </Element>

                <Element
                  canvas
                  is={Container}
                  background={{ r: 37, g: 99, b: 235, a: 1 }}
                  flexDirection="column"
                  width="100%"
                  height="auto"
                  padding={['40', '40', '40', '40']}
                  custom={{ displayName: 'CTA Section' }}
                >
                  <Text
                    fontSize="24"
                    fontWeight="bold"
                    text="Pronto para começar?"
                    textAlign="center"
                    color={{ r: 255, g: 255, b: 255, a: 1 }}
                  />
                  <Text
                    fontSize="16"
                    fontWeight="400"
                    text="Entre em contato conosco e agende sua consulta."
                    textAlign="center"
                    color={{ r: 255, g: 255, b: 255, a: 1 }}
                  />
                  <Element
                    canvas
                    is={Container}
                    flexDirection="row"
                    width="100%"
                    height="auto"
                    padding={['20', '0', '0', '0']}
                    custom={{ displayName: 'CTA Buttons' }}
                  >
                    <Custom3
                      background={{
                        r: 255,
                        g: 255,
                        b: 255,
                        a: 1,
                      }}
                      height="auto"
                      width="200px"
                      padding={['15', '30', '15', '30']}
                      margin={['0', '10', '0', '0']}
                      shadow={10}
                      flexDirection="row"
                      alignItems="center"
                      justifyContent="center"
                    />
                  </Element>
                </Element>
              </Element>
            </Frame>
          </Viewport>
        </Editor>
      </div>
    </div>
  );
}