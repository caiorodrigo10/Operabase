import React, { useEffect, useState } from 'react';
import { Editor, Frame, Element, useEditor } from '@craftjs/core';
import { Link } from 'wouter';
import { ArrowLeft, Eye, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import the existing craft components that work
import { Container, Text } from '../components/craft/selectors';
import { Button as CraftButton } from '../components/craft/selectors/Button';
import { Video } from '../components/craft/selectors/Video';
import { Viewport } from '../components/craft/editor/Viewport';
import { RenderNode } from '../components/craft/editor/RenderNode';

// Custom Landing Components with proper types
interface CardProps {
  background?: { r: number; g: number; b: number; a: number };
  padding?: number;
  children?: React.ReactNode;
}

const LandingCard = ({ 
  background = { r: 255, g: 255, b: 255, a: 1 }, 
  padding = 20, 
  children 
}: CardProps) => {
  return (
    <div
      style={{
        background: `rgba(${background.r}, ${background.g}, ${background.b}, ${background.a})`,
        padding: `${padding}px`,
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        margin: '10px 0',
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
    padding: 20,
  },
  rules: {
    canDrag: () => true,
  },
};

interface HeroProps {
  background?: { r: number; g: number; b: number; a: number };
  children?: React.ReactNode;
}

const HeroSection = ({ 
  background = { r: 39, g: 41, b: 41, a: 1 }, 
  children 
}: HeroProps) => {
  return (
    <div
      style={{
        background: `rgba(${background.r}, ${background.g}, ${background.b}, ${background.a})`,
        padding: '60px 40px',
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
      }}
    >
      {children}
    </div>
  );
};

HeroSection.craft = {
  displayName: 'Hero Section',
  props: {
    background: { r: 39, g: 41, b: 41, a: 1 },
  },
  rules: {
    canDrag: () => true,
  },
};

interface VideoProps {
  videoId?: string;
  width?: string;
  height?: string;
}

const VideoComponent = ({ 
  videoId = 'dQw4w9WgXcQ', 
  width = '100%', 
  height = '200px' 
}: VideoProps) => {
  return (
    <div style={{ width, height, background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

VideoComponent.craft = {
  displayName: 'Video',
  props: {
    videoId: 'dQw4w9WgXcQ',
    width: '100%',
    height: '200px',
  },
  rules: {
    canDrag: () => true,
  },
};

// Component para botões de controle dentro do Editor
const EditorControls = () => {
  const { query, actions } = useEditor();
  
  const handleSave = () => {
    const json = query.serialize();
    localStorage.setItem('craft_editor_state', json);
    console.log('💾 Estado salvo no localStorage');
  };
  
  const handleReload = () => {
    console.log('🔄 Recarregando página...');
    window.location.reload();
  };
  
  return (
    <div className="flex items-center space-x-3">
      <Button variant="outline" size="sm" onClick={handleSave}>
        <Save className="w-4 h-4 mr-2" />
        Salvar Estado
      </Button>
      <Button variant="outline" size="sm" onClick={handleReload}>
        <RefreshCw className="w-4 h-4 mr-2" />
        Recarregar
      </Button>
    </div>
  );
};

export default function FunilEditorLanding() {
  console.log('🔧 Abrindo editor Landing Page completo');
  const [savedJson, setSavedJson] = useState<string | null>(null);
  
  // Carregar estado salvo na inicialização
  useEffect(() => {
    const savedState = localStorage.getItem('craft_editor_state');
    if (savedState) {
      console.log('📂 Carregando estado salvo do localStorage');
      setSavedJson(savedState);
    }
  }, []);

  // Force hide Gleap widget on this page
  useEffect(() => {
    const hideGleap = () => {
      // Hide Gleap widget if it exists
      const gleapWidget = document.querySelector('[id^="gleap"]') || 
                         document.querySelector('.gleap-widget') ||
                         document.querySelector('div[data-gleap]');
      
      if (gleapWidget) {
        (gleapWidget as HTMLElement).style.display = 'none';
      }

      // Also try to hide by common Gleap selectors
      const gleapElements = document.querySelectorAll('[class*="gleap"], [id*="gleap"]');
      gleapElements.forEach(element => {
        (element as HTMLElement).style.display = 'none';
      });
    };

    // Hide immediately
    hideGleap();

    // Set up interval to keep checking and hiding
    const interval = setInterval(hideGleap, 500);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center space-x-4">
          <Link href="/funis/1">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">
            Landing Page Editor
          </h1>
        </div>
        
        <div className="text-sm text-gray-500">
          {savedJson ? 'Estado carregado do localStorage' : 'Estado padrão'} - CODE AI Ready
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 h-full">
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
          {/* Controls bar inside Editor context */}
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <EditorControls />
          </div>
          
          <Viewport>
            <Frame data={savedJson || undefined}>
              <Element
                canvas
                is={Container}
                width="800px"
                height="auto"
                background={{ r: 255, g: 255, b: 255, a: 1 }}
                padding={['40', '40', '40', '40']}
                custom={{ displayName: 'App' }}
              >
                {/* Introduction Section */}
                <Element
                  canvas
                  is={Container}
                  flexDirection="row"
                  width="100%"
                  height="auto"
                  padding={['40', '40', '40', '40']}
                  margin={['0', '0', '40', '0']}
                  custom={{ displayName: 'Introduction' }}
                >
                  <Element
                    canvas
                    is={Container}
                    width="40%"
                    height="100%"
                    padding={['0', '20', '0', '20']}
                    custom={{ displayName: 'Heading' }}
                  >
                    <Text
                      fontSize="23"
                      fontWeight="400"
                      text="Craft.js is a React framework for building powerful &amp; feature-rich drag-n-drop page editors."
                    />
                  </Element>
                  <Element
                    canvas
                    is={Container}
                    width="60%"
                    height="100%"
                    padding={['0', '20', '0', '20']}
                    custom={{ displayName: 'Description' }}
                  >
                    <Text
                      fontSize="14"
                      fontWeight="400"
                      text="Everything you see here, including the editor, itself is made of React components. Craft.js comes only with the building blocks for a page editor; it provides a drag-n-drop system and handles the way user components should be rendered, updated and moved, among other things."
                    />
                  </Element>
                </Element>

                {/* Hero Section */}
                <Element
                  canvas
                  is={HeroSection}
                  background={{ r: 39, g: 41, b: 41, a: 1 }}
                  custom={{ displayName: 'Hero Section' }}
                >
                  <Text
                    fontSize="28"
                    fontWeight="700"
                    text="Design complex components"
                    textAlign="center"
                    color={{ r: '255', g: '255', b: '255', a: '1' }}
                  />
                  <Text
                    fontSize="16"
                    fontWeight="400"
                    text="You can define areas within your React component which users can drop other components into."
                    textAlign="center"
                    color={{ r: '255', g: '255', b: '255', a: '1' }}
                    margin={['20', '0', '20', '0']}
                  />
                  <CraftButton
                    text="Get Started"
                    background={{ r: 59, g: 130, b: 246, a: 1 }}
                    color={{ r: '255', g: '255', b: '255', a: '1' }}
                  />
                </Element>

                {/* Content Section */}
                <Element
                  canvas
                  is={Container}
                  flexDirection="row"
                  width="100%"
                  height="auto"
                  padding={['40', '40', '40', '40']}
                  margin={['40', '0', '0', '0']}
                  custom={{ displayName: 'Content Section' }}
                >
                  <Element
                    canvas
                    is={Container}
                    width="45%"
                    height="100%"
                    padding={['0', '20', '0', '0']}
                    custom={{ displayName: 'Left Content' }}
                  >
                    <Text
                      fontSize="20"
                      fontWeight="600"
                      text="Programmatic drag &amp; drop"
                      margin={['0', '0', '15', '0']}
                    />
                    <Text
                      fontSize="14"
                      fontWeight="400"
                      text="Govern what goes in and out of your components"
                      margin={['0', '0', '20', '0']}
                    />
                    <Element
                      canvas
                      is={LandingCard}
                      background={{ r: 76, g: 175, b: 80, a: 1 }}
                      padding={30}
                      custom={{ displayName: 'Green Card' }}
                    >
                      <Text
                        fontSize="16"
                        fontWeight="500"
                        text="I'm a component that only accepts buttons."
                        color={{ r: '255', g: '255', b: '255', a: '1' }}
                      />
                    </Element>
                  </Element>

                  <Element
                    canvas
                    is={Container}
                    width="55%"
                    height="100%"
                    padding={['0', '0', '0', '20']}
                    custom={{ displayName: 'Right Content' }}
                  >
                    <Element
                      canvas
                      is={LandingCard}
                      background={{ r: 108, g: 126, b: 131, a: 1 }}
                      padding={25}
                      custom={{ displayName: 'Gray Card' }}
                    >
                      <Text
                        fontSize="14"
                        fontWeight="400"
                        text="You can only drop one video here."
                        color={{ r: '255', g: '255', b: '255', a: '1' }}
                      />
                    </Element>
                    
                    <Element
                      canvas
                      is={LandingCard}
                      background={{ r: 134, g: 187, b: 201, a: 1 }}
                      padding={25}
                      custom={{ displayName: 'Blue Card' }}
                    >
                      <VideoComponent
                        videoId="dQw4w9WgXcQ"
                        width="100%"
                        height="180px"
                      />
                    </Element>
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