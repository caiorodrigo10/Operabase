import React, { useEffect, useState } from 'react';
import { Editor, Frame, Element, useEditor } from '@craftjs/core';

// Import ALL Landing components for complete gallery demonstration
import { Container, Text } from '../../craft/selectors/landing';
import { Button as CraftButton } from '../../craft/selectors/landing/Button';
import { Video } from '../../craft/selectors/landing/Video';
import { Custom1, Custom2, Custom3 } from '../../craft/selectors/landing';
import { RenderNode } from '../../craft/editor/RenderNode';

// Custom Landing Components with semantic structure
interface HeroSectionProps {
  background?: { r: number; g: number; b: number; a: number };
  children?: React.ReactNode;
}

const HeroSection = ({ 
  background = { r: 37, g: 99, b: 235, a: 1 }, 
  children 
}: HeroSectionProps) => {
  return (
    <div
      style={{
        background: `rgba(${background.r}, ${background.g}, ${background.b}, ${background.a})`,
        padding: '60px 40px',
        textAlign: 'center',
        color: 'white',
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </div>
  );
};

HeroSection.craft = {
  displayName: 'Hero Section',
  props: {
    background: { r: 37, g: 99, b: 235, a: 1 },
  },
  rules: {
    canDrag: () => true,
  },
};

interface LandingCardProps {
  background?: { r: number; g: number; b: number; a: number };
  padding?: number;
  children?: React.ReactNode;
}

const LandingCard = ({ 
  background = { r: 255, g: 255, b: 255, a: 1 }, 
  padding = 30, 
  children 
}: LandingCardProps) => {
  return (
    <div
      style={{
        background: `rgba(${background.r}, ${background.g}, ${background.b}, ${background.a})`,
        padding: `${padding}px`,
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        margin: '10px',
        width: '300px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {children}
    </div>
  );
};

LandingCard.craft = {
  displayName: 'Card',
  props: {
    background: { r: 255, g: 255, b: 255, a: 1 },
    padding: 30,
  },
  rules: {
    canDrag: () => true,
  },
};

// Spacer Component for spacing control
interface SpacerProps {
  height?: number;
  background?: { r: number; g: number; b: number; a: number };
}

const SpacerComponent = ({ 
  height = 50, 
  background = { r: 0, g: 0, b: 0, a: 0 }
}: SpacerProps) => {
  return (
    <div
      style={{
        height: `${height}px`,
        width: '100%',
        background: `rgba(${background.r}, ${background.g}, ${background.b}, ${background.a})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
        fontSize: '12px',
        borderTop: '1px dashed #ddd',
        borderBottom: '1px dashed #ddd',
      }}
    >
      Espaço ({height}px)
    </div>
  );
};

SpacerComponent.craft = {
  displayName: 'Espaço',
  props: {
    height: 50,
    background: { r: 0, g: 0, b: 0, a: 0 },
  },
  rules: {
    canDrag: () => true,
  },
};

// Global reference to current Craft.js editor
let currentCraftEditor: any = null;

// Component to expose Craft.js editor globally
const EditorExposer: React.FC = () => {
  const editor = useEditor();
  
  useEffect(() => {
    currentCraftEditor = editor;
    console.log('🔧 EditorExposer: Craft.js editor initialized');
    
    // DEBUG: Log current nodes when editor is ready
    if (editor && editor.query) {
      const nodes = editor.query.getNodes();
      console.log('🔧 EditorExposer: Current nodes at init:', Object.keys(nodes));
      
      // Look for elements with our semantic IDs
      Object.entries(nodes).forEach(([nodeId, node]) => {
        if (node.data?.props?.id) {
          console.log(`🏷️ EditorExposer: Found element with custom ID: ${nodeId} -> ${node.data.props.id}`);
        }
      });
    }
    
    return () => {
      currentCraftEditor = null;
    };
  }, [editor]);

  return null;
};

// Function to provide clean semantic JSON structure like Editor Landing  
const getDefaultSemanticJson = () => {
  return {
    "ROOT": {
      "type": { "resolvedName": "Container" },
      "isCanvas": true,
      "props": {
        "flexDirection": "column",
        "alignItems": "center", 
        "justifyContent": "flex-start",
        "fillSpace": "no",
        "padding": ["0", "0", "0", "0"],
        "margin": ["0", "0", "0", "0"],
        "background": { "r": 255, "g": 255, "b": 255, "a": 1 },
        "color": { "r": 0, "g": 0, "b": 0, "a": 1 },
        "shadow": 0,
        "radius": 0,
        "width": "100%",
        "height": "auto"
      },
      "displayName": "Container",
      "custom": { "displayName": "Editor 2 - Galeria de Widgets" },
      "parent": null,
      "hidden": false,
      "nodes": ["hero-section", "features-section", "video-demo", "button-showcase"],
      "linkedNodes": {}
    },
    "hero-section": {
      "type": { "resolvedName": "HeroSection" },
      "isCanvas": true,
      "props": {
        "background": { "r": 37, "g": 99, "b": 235, "a": 1 }
      },
      "displayName": "Hero Section",
      "custom": { "displayName": "Hero Principal" },
      "parent": "ROOT",
      "hidden": false,
      "nodes": ["hero-title", "hero-subtitle", "hero-button"],
      "linkedNodes": {}
    },
    "hero-title": {
      "type": { "resolvedName": "Text" },
      "isCanvas": false,
      "props": {
        "fontSize": "42",
        "textAlign": "center",
        "fontWeight": "700",
        "color": { "r": 255, "g": 255, "b": 255, "a": 1 },
        "margin": ["0", "0", "20", "0"],
        "text": "Editor 2: Demonstração Completa"
      },
      "displayName": "Text",
      "custom": {},
      "parent": "hero-section",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "hero-subtitle": {
      "type": { "resolvedName": "Text" },
      "isCanvas": false,
      "props": {
        "fontSize": "18",
        "textAlign": "center", 
        "fontWeight": "400",
        "color": { "r": 255, "g": 255, "b": 255, "a": 1 },
        "margin": ["0", "0", "30", "0"],
        "text": "Demonstração prática de todos os widgets disponíveis: Container, Text, Button, Video, Cards. Sistema com JSON semântico e IDs limpos para geração via IA."
      },
      "displayName": "Text",
      "custom": {},
      "parent": "hero-section",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "hero-button": {
      "type": { "resolvedName": "Button" },
      "isCanvas": false,
      "props": {
        "background": { "r": 34, "g": 197, "b": 94, "a": 1 },
        "color": { "r": 255, "g": 255, "b": 255, "a": 1 },
        "buttonStyle": "full",
        "text": "Ver JSON Semântico",
        "margin": ["10", "0", "10", "0"]
      },
      "displayName": "Button",
      "custom": {},
      "parent": "hero-section",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "features-section": {
      "type": { "resolvedName": "Container" },
      "isCanvas": true,
      "props": {
        "flexDirection": "row",
        "alignItems": "flex-start",
        "justifyContent": "center",
        "padding": ["60", "40", "60", "40"],
        "margin": ["0", "0", "0", "0"],
        "background": { "r": 248, "g": 250, "b": 252, "a": 1 },
        "width": "100%",
        "height": "auto"
      },
      "displayName": "Container",
      "custom": { "displayName": "Funcionalidades" },
      "parent": "ROOT",
      "hidden": false,
      "nodes": ["feature-1", "feature-2", "feature-3"],
      "linkedNodes": {}
    },
    "feature-1": {
      "type": { "resolvedName": "LandingCard" },
      "isCanvas": true,
      "props": {
        "background": { "r": 255, "g": 255, "b": 255, "a": 1 },
        "padding": 30
      },
      "displayName": "Card",
      "custom": { "displayName": "Feature 1" },
      "parent": "features-section",
      "hidden": false,
      "nodes": ["feature-1-title", "feature-1-text"],
      "linkedNodes": {}
    },
    "feature-1-title": {
      "type": { "resolvedName": "Text" },
      "isCanvas": false,
      "props": {
        "fontSize": "20",
        "textAlign": "center",
        "fontWeight": "600", 
        "color": { "r": 37, "g": 99, "b": 235, "a": 1 },
        "margin": ["0", "0", "15", "0"],
        "text": "📝 Widget Text"
      },
      "displayName": "Text",
      "custom": {},
      "parent": "feature-1",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "feature-1-text": {
      "type": { "resolvedName": "Text" },
      "isCanvas": false,
      "props": {
        "fontSize": "14",
        "textAlign": "center",
        "fontWeight": "400",
        "color": { "r": 75, "g": 85, "b": 99, "a": 1 },
        "margin": ["0", "0", "0", "0"],
        "text": "Componente Text com formatação completa: tamanhos, cores, alinhamento e peso personalizáveis para criar títulos, parágrafos e descrições."
      },
      "displayName": "Text",
      "custom": {},
      "parent": "feature-1", 
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "feature-2": {
      "type": { "resolvedName": "LandingCard" },
      "isCanvas": true,
      "props": {
        "background": { "r": 255, "g": 255, "b": 255, "a": 1 },
        "padding": 30
      },
      "displayName": "Card",
      "custom": { "displayName": "Button Widget" },
      "parent": "features-section",
      "hidden": false,
      "nodes": ["feature-2-title", "feature-2-text", "feature-2-button"],
      "linkedNodes": {}
    },
    "feature-2-title": {
      "type": { "resolvedName": "Text" },
      "isCanvas": false,
      "props": {
        "fontSize": "20",
        "textAlign": "center",
        "fontWeight": "600",
        "color": { "r": 37, "g": 99, "b": 235, "a": 1 },
        "margin": ["0", "0", "15", "0"],
        "text": "🔘 Widget Button"
      },
      "displayName": "Text",
      "custom": {},
      "parent": "feature-2",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "feature-2-text": {
      "type": { "resolvedName": "Text" },
      "isCanvas": false,
      "props": {
        "fontSize": "14",
        "textAlign": "center",
        "fontWeight": "400",
        "color": { "r": 75, "g": 85, "b": 99, "a": 1 },
        "margin": ["0", "0", "15", "0"],
        "text": "Botões interativos com cores personalizáveis, diferentes estilos e textos configuráveis."
      },
      "displayName": "Text",
      "custom": {},
      "parent": "feature-2",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "feature-2-button": {
      "type": { "resolvedName": "CraftButton" },
      "isCanvas": false,
      "props": {
        "background": { "r": 220, "g": 38, "b": 127, "a": 1 },
        "color": { "r": 255, "g": 255, "b": 255, "a": 1 },
        "buttonStyle": "full",
        "text": "Exemplo de Botão",
        "margin": ["0", "0", "0", "0"]
      },
      "displayName": "Button",
      "custom": {},
      "parent": "feature-2",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "feature-3": {
      "type": { "resolvedName": "LandingCard" },
      "isCanvas": true,
      "props": {
        "background": { "r": 255, "g": 255, "b": 255, "a": 1 },
        "padding": 30
      },
      "displayName": "Card",
      "custom": { "displayName": "Container Widget" },
      "parent": "features-section",
      "hidden": false,
      "nodes": ["feature-3-title", "feature-3-text", "feature-3-container"],
      "linkedNodes": {}
    },
    "feature-3-title": {
      "type": { "resolvedName": "Text" },
      "isCanvas": false,
      "props": {
        "fontSize": "20",
        "textAlign": "center",
        "fontWeight": "600",
        "color": { "r": 37, "g": 99, "b": 235, "a": 1 },
        "margin": ["0", "0", "15", "0"],
        "text": "📦 Widget Container"
      },
      "displayName": "Text",
      "custom": {},
      "parent": "feature-3",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "feature-3-text": {
      "type": { "resolvedName": "Text" },
      "isCanvas": false,
      "props": {
        "fontSize": "14",
        "textAlign": "center",
        "fontWeight": "400",
        "color": { "r": 75, "g": 85, "b": 99, "a": 1 },
        "margin": ["0", "0", "15", "0"],
        "text": "Containers flexíveis com layouts personalizáveis, backgrounds e spacing configurável."
      },
      "displayName": "Text",
      "custom": {},
      "parent": "feature-3",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "feature-3-container": {
      "type": { "resolvedName": "Container" },
      "isCanvas": true,
      "props": {
        "flexDirection": "column",
        "alignItems": "center",
        "justifyContent": "center",
        "fillSpace": "no",
        "padding": ["20", "20", "20", "20"],
        "margin": ["0", "0", "0", "0"],
        "background": { "r": 239, "g": 246, "b": 255, "a": 1 },
        "color": { "r": 0, "g": 0, "b": 0, "a": 1 },
        "shadow": 0,
        "radius": 8,
        "width": "100%",
        "height": "auto"
      },
      "displayName": "Container",
      "custom": { "displayName": "Exemplo Container" },
      "parent": "feature-3",
      "hidden": false,
      "nodes": ["nested-text"],
      "linkedNodes": {}
    },
    "nested-text": {
      "type": { "resolvedName": "Text" },
      "isCanvas": false,
      "props": {
        "fontSize": "12",
        "textAlign": "center",
        "fontWeight": "400",
        "color": { "r": 75, "g": 85, "b": 99, "a": 1 },
        "margin": ["0", "0", "0", "0"],
        "text": "Container aninhado com background azul"
      },
      "displayName": "Text",
      "custom": {},
      "parent": "feature-3-container",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "video-demo": {
      "type": { "resolvedName": "Container" },
      "isCanvas": true,
      "props": {
        "flexDirection": "column",
        "alignItems": "center",
        "justifyContent": "center",
        "fillSpace": "no",
        "padding": ["60", "40", "60", "40"],
        "margin": ["0", "0", "0", "0"],
        "background": { "r": 255, "g": 255, "b": 255, "a": 1 },
        "color": { "r": 0, "g": 0, "b": 0, "a": 1 },
        "shadow": 0,
        "radius": 0,
        "width": "100%",
        "height": "auto"
      },
      "displayName": "Container",
      "custom": { "displayName": "Seção de Vídeo" },
      "parent": "ROOT",
      "hidden": false,
      "nodes": ["video-title", "video-widget"],
      "linkedNodes": {}
    },
    "video-title": {
      "type": { "resolvedName": "Text" },
      "isCanvas": false,
      "props": {
        "fontSize": "28",
        "textAlign": "center",
        "fontWeight": "600",
        "color": { "r": 37, "g": 99, "b": 235, "a": 1 },
        "margin": ["0", "0", "30", "0"],
        "text": "🎥 Widget Video (YouTube)"
      },
      "displayName": "Text",
      "custom": {},
      "parent": "video-demo",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "video-widget": {
      "type": { "resolvedName": "Video" },
      "isCanvas": false,
      "props": {
        "videoId": "dQw4w9WgXcQ",
        "width": 560,
        "height": 315
      },
      "displayName": "Video",
      "custom": { "displayName": "Exemplo de Vídeo" },
      "parent": "video-demo",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "button-showcase": {
      "type": { "resolvedName": "Container" },
      "isCanvas": true,
      "props": {
        "flexDirection": "column",
        "alignItems": "center",
        "justifyContent": "center",
        "fillSpace": "no",
        "padding": ["60", "40", "60", "40"],
        "margin": ["0", "0", "0", "0"],
        "background": { "r": 248, "g": 250, "b": 252, "a": 1 },
        "color": { "r": 0, "g": 0, "b": 0, "a": 1 },
        "shadow": 0,
        "radius": 0,
        "width": "100%",
        "height": "auto"
      },
      "displayName": "Container",
      "custom": { "displayName": "Showcase de Botões" },
      "parent": "ROOT",
      "hidden": false,
      "nodes": ["showcase-title", "showcase-text", "primary-button", "secondary-button"],
      "linkedNodes": {}
    },
    "showcase-title": {
      "type": { "resolvedName": "Text" },
      "isCanvas": false,
      "props": {
        "fontSize": "28",
        "textAlign": "center",
        "fontWeight": "600",
        "color": { "r": 17, "g": 24, "b": 39, "a": 1 },
        "margin": ["0", "0", "15", "0"],
        "text": "Botões com Diferentes Estilos"
      },
      "displayName": "Text",
      "custom": {},
      "parent": "button-showcase",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "showcase-text": {
      "type": { "resolvedName": "Text" },
      "isCanvas": false,
      "props": {
        "fontSize": "16",
        "textAlign": "center",
        "fontWeight": "400",
        "color": { "r": 75, "g": 85, "b": 99, "a": 1 },
        "margin": ["0", "0", "30", "0"],
        "text": "Demonstração de botões com cores e estilos diferentes para CTAs e ações secundárias."
      },
      "displayName": "Text",
      "custom": {},
      "parent": "button-showcase",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "primary-button": {
      "type": { "resolvedName": "CraftButton" },
      "isCanvas": false,
      "props": {
        "background": { "r": 34, "g": 197, "b": 94, "a": 1 },
        "color": { "r": 255, "g": 255, "b": 255, "a": 1 },
        "buttonStyle": "full",
        "text": "Botão Primário",
        "margin": ["10", "10", "10", "10"]
      },
      "displayName": "Button",
      "custom": {},
      "parent": "button-showcase",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "secondary-button": {
      "type": { "resolvedName": "CraftButton" },
      "isCanvas": false,
      "props": {
        "background": { "r": 107, "g": 114, "b": 128, "a": 1 },
        "color": { "r": 255, "g": 255, "b": 255, "a": 1 },
        "buttonStyle": "full",
        "text": "Botão Secundário",
        "margin": ["10", "10", "10", "10"]
      },
      "displayName": "Button",
      "custom": {},
      "parent": "button-showcase",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    }
  };
};

// Export function to get current editor
export const getCurrentCraftEditor = () => currentCraftEditor;

export const CanvasContainer: React.FC = () => {
  const [initialJson, setInitialJson] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved state from server BEFORE Frame renders (same pattern as Editor Landing)
  useEffect(() => {
    const loadPageData = async () => {
      try {
        // First try to load from server
        const response = await fetch('/api/load-page-json/editor2');
        const result = await response.json();
        
        console.log('📂 Editor2 loading response:', result);
        
        if (result.success && result.data) {
          console.log('📂 Editor2 loading from server');
          setInitialJson(result.data);
        } else {
          // Fallback to localStorage if not on server
          const savedState = localStorage.getItem('editor2_craft_state');
          if (savedState) {
            console.log('📂 Editor2 loading from localStorage (fallback)');
            setInitialJson(savedState);
          } else {
            console.log('📂 Editor2 using default semantic structure');
          }
        }
      } catch (error) {
        console.error('Error loading page data:', error);
        // Fallback to localStorage on error
        const savedState = localStorage.getItem('editor2_craft_state');
        if (savedState) {
          console.log('📂 Editor2 loading from localStorage (error)');
          setInitialJson(savedState);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPageData();
  }, []);

  if (isLoading) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-gray-500">Carregando editor...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-auto">
      {/* Craft.js Editor Context */}
      <Editor
        resolver={{
          Container,
          Text,
          CraftButton,
          Video,
          Custom1,
          Custom2,
          Custom3,
          HeroSection,
          LandingCard,
          SpacerComponent
        }}
        enabled={true}
        onRender={RenderNode}
      >
        <EditorExposer />
        {/* Canvas Background */}
        <div 
          className="min-h-full bg-gray-50 page-container"
          style={{ backgroundColor: '#f8f9fa' }}
        >
          {/* Craft.js Frame - CLEAN PATTERN with FORCED Semantic IDs */}
          <Frame data={initialJson || undefined}>
            <Element
              canvas
              is={Container}
              width="100%"
              height="auto"
              background={{ r: 255, g: 255, b: 255, a: 1 }}
              padding={['0', '0', '0', '0']}
              margin={['0', '0', '0', '0']}
              flexDirection="column"
              alignItems="center"
              justifyContent="flex-start"
              custom={{ displayName: 'Landing Page' }}
            >
              {/* Hero Section with Semantic ID */}
              <Element
                canvas
                is={Container}
                id="hero-section"
                background={{ r: 37, g: 99, b: 235, a: 1 }}
                padding={['60', '40', '60', '40']}
                margin={['0', '0', '0', '0']}
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                custom={{ displayName: 'Hero Principal' }}
              >
                <Element
                  is={Text}
                  id="hero-title"
                  fontSize="42"
                  textAlign="center"
                  fontWeight="700"
                  color={{ r: 255, g: 255, b: 255, a: 1 }}
                  margin={['0', '0', '20', '0']}
                  text="Transforme Sua Clínica Digital"
                  custom={{ displayName: 'Hero Title', semanticId: 'hero-title' }}
                />
                
                <Element
                  is={Text}
                  id="hero-description"
                  fontSize="18"
                  textAlign="center"
                  fontWeight="400"
                  color={{ r: 255, g: 255, b: 255, a: 1 }}
                  margin={['0', '0', '30', '0']}
                  text="Crie sites profissionais para sua clínica médica em minutos, sem conhecimento técnico."
                />

                <Element
                  is={CraftButton}
                  id="cta-button"
                  background={{ r: 34, g: 197, b: 94, a: 1 }}
                  color={{ r: 255, g: 255, b: 255, a: 1 }}
                  buttonStyle="full"
                  text="Criar Meu Site Grátis"
                  margin={['10', '0', '10', '0']}
                />
              </Element>

              {/* Features Section with Semantic ID */}
              <Element
                canvas
                is={Container}
                id="features-section"
                flexDirection="row"
                alignItems="flex-start"
                justifyContent="center"
                padding={['60', '40', '60', '40']}
                margin={['0', '0', '0', '0']}
                background={{ r: 248, g: 250, b: 252, a: 1 }}
                width="100%"
                height="auto"
                custom={{ displayName: 'Funcionalidades' }}
              >
                <Element
                  canvas
                  is={LandingCard}
                  background={{ r: 255, g: 255, b: 255, a: 1 }}
                  padding={30}
                  custom={{ displayName: 'Feature 1' }}
                >
                  <Text
                    fontSize="20"
                    textAlign="center"
                    fontWeight="600"
                    color={{ r: 37, g: 99, b: 235, a: 1 }}
                    margin={['0', '0', '15', '0']}
                    text="🚀 Criação Rápida"
                  />
                  
                  <Text
                    fontSize="14"
                    textAlign="center"
                    fontWeight="400"
                    color={{ r: 75, g: 85, b: 99, a: 1 }}
                    margin={['0', '0', '0', '0']}
                    text="Sites prontos em menos de 5 minutos com IA"
                  />
                </Element>

                <Element
                  canvas
                  is={LandingCard}
                  background={{ r: 255, g: 255, b: 255, a: 1 }}
                  padding={30}
                  custom={{ displayName: 'Feature 2' }}
                >
                  <Text
                    fontSize="20"
                    textAlign="center"
                    fontWeight="600"
                    color={{ r: 37, g: 99, b: 235, a: 1 }}
                    margin={['0', '0', '15', '0']}
                    text="📱 WhatsApp Integrado"
                  />
                  
                  <Text
                    fontSize="14"
                    textAlign="center"
                    fontWeight="400"
                    color={{ r: 75, g: 85, b: 99, a: 1 }}
                    margin={['0', '0', '0', '0']}
                    text="Agendamentos direto pelo WhatsApp automaticamente"
                  />
                </Element>

                <Element
                  canvas
                  is={LandingCard}
                  background={{ r: 255, g: 255, b: 255, a: 1 }}
                  padding={30}
                  custom={{ displayName: 'Feature 3' }}
                >
                  <Text
                    fontSize="20"
                    textAlign="center"
                    fontWeight="600"
                    color={{ r: 37, g: 99, b: 235, a: 1 }}
                    margin={['0', '0', '15', '0']}
                    text="🏥 Feito para Médicos"
                  />
                  
                  <Text
                    fontSize="14"
                    textAlign="center"
                    fontWeight="400"
                    color={{ r: 75, g: 85, b: 99, a: 1 }}
                    margin={['0', '0', '0', '0']}
                    text="Templates específicos para cada especialidade médica"
                  />
                </Element>
              </Element>

              {/* CTA Section with Semantic ID */}
              <Element
                canvas
                is={Container}
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                padding={['80', '40', '80', '40']}
                margin={['0', '0', '0', '0']}
                background={{ r: 17, g: 24, b: 39, a: 1 }}
                width="100%"
                height="auto"
                custom={{ displayName: 'Call to Action' }}
              >
                <Text
                  fontSize="32"
                  textAlign="center"
                  fontWeight="700"
                  color={{ r: 255, g: 255, b: 255, a: 1 }}
                  margin={['0', '0', '15', '0']}
                  text="Pronto para começar?"
                />
                
                <Text
                  fontSize="16"
                  textAlign="center"
                  fontWeight="400"
                  color={{ r: 203, g: 213, b: 225, a: 1 }}
                  margin={['0', '0', '30', '0']}
                  text="Junte-se a centenas de médicos que já transformaram sua presença digital"
                />

                <CraftButton
                  background={{ r: 34, g: 197, b: 94, a: 1 }}
                  color={{ r: 255, g: 255, b: 255, a: 1 }}
                  buttonStyle="full"
                  text="Começar Agora - É Grátis"
                  margin={['10', '0', '10', '0']}
                />
              </Element>
            </Element>
          </Frame>
        </div>
      </Editor>
    </div>
  );
};