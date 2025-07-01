import React, { useEffect, useState } from 'react';
import { Editor, Frame, Element, useEditor } from '@craftjs/core';

// Import CLEAN Landing components (not simple ones)
import { Container } from '../../craft/selectors/landing';
import { Text } from '../../craft/selectors/Text';
import { Button as CraftButton } from '../../craft/selectors/Button';
import { Video } from '../../craft/selectors/Video';
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

// Global reference to current Craft.js editor
let currentCraftEditor: any = null;

// Component to expose Craft.js editor globally
const EditorExposer: React.FC = () => {
  const editor = useEditor();
  
  useEffect(() => {
    currentCraftEditor = editor;
    return () => {
      currentCraftEditor = null;
    };
  }, [editor]);

  return null;
};

// Export function to get current editor
export const getCurrentCraftEditor = () => currentCraftEditor;

export const CanvasContainer: React.FC = () => {
  const [initialJson, setInitialJson] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved state from server (same pattern as Editor Landing)
  useEffect(() => {
    const loadPageData = async () => {
      try {
        const response = await fetch('/api/load-page-json/editor2');
        const result = await response.json();
        
        console.log('📂 Editor2 loading response:', result);
        
        if (result.success && result.data) {
          console.log('📂 Editor2 page loaded from server');
          setInitialJson(result.data);
        } else {
          const savedState = localStorage.getItem('editor2_state');
          if (savedState) {
            console.log('📂 Editor2 page loaded from localStorage');
            setInitialJson(savedState);
          }
        }
      } catch (error) {
        console.error('Editor2 load error:', error);
        const savedState = localStorage.getItem('editor2_state');
        if (savedState) {
          console.log('📂 Editor2 page loaded from localStorage (fallback)');
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
          HeroSection,
          LandingCard
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
          {/* Craft.js Frame - CLEAN PATTERN (like Editor Landing) */}
          <Frame data={initialJson || undefined}>
            <Element
              is={Container}
              canvas
              background="#ffffff"
              padding="0px"
              margin="0px"
              borderRadius="0px"
              flexDirection="column"
              alignItems="center"
              justifyContent="flex-start"
              width="100%"
              height="auto"
            >
              {/* Hero Section */}
              <Element
                is={Container}
                canvas
                background="#2563eb"
                padding="60px 40px"
                margin="0px"
                minHeight="300px"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                width="100%"
              >
                {/* Hero Title */}
                <Element
                  is={Text}
                  text="Transforme Sua Clínica Digital"
                  fontSize="42px"
                  fontWeight="700"
                  color="#ffffff"
                  textAlign="center"
                  margin="0px 0px 20px 0px"
                  tag="h1"
                />
                
                <Element
                  is={Text}
                  text="Crie sites profissionais para sua clínica médica em minutos, sem conhecimento técnico."
                  fontSize="18px"
                  fontWeight="400"
                  color="#ffffff"
                  textAlign="center"
                  margin="0px 0px 30px 0px"
                  tag="p"
                />
                
                <Element
                  is={Button}
                  text="Criar Meu Site Grátis"
                  backgroundColor="#22c55e"
                  color="#ffffff"
                  padding="14px 28px"
                  margin="10px auto"
                  borderRadius="8px"
                  fontSize="16px"
                  fontWeight="500"
                  width="auto"
                />
              </Element>
              
              {/* Features Section */}
              <Element
                is={Container}
                canvas
                background="#f8fafc"
                padding="40px 20px"
                margin="0px"
                flexDirection="row"
                alignItems="flex-start"
                justifyContent="center"
                width="100%"
              >
                <Element
                  is={Container}
                  canvas
                  background="#ffffff"
                  padding="30px"
                  margin="10px"
                  borderRadius="8px"
                  width="300px"
                >
                  <Element
                    is={Text}
                    text="🚀 Criação Rápida"
                    fontSize="20px"
                    fontWeight="600"
                    color="#2563eb"
                    textAlign="center"
                    margin="0px 0px 15px 0px"
                    tag="h3"
                  />
                  
                  <Element
                    is={Text}
                    text="Sites prontos em menos de 5 minutos com IA"
                    fontSize="14px"
                    fontWeight="400"
                    color="#64748b"
                    textAlign="center"
                    margin="0px"
                    tag="p"
                  />
                </Element>
              </Element>
            </Element>
          </Frame>
        </div>
      </Editor>
    </div>
  );
};