import React, { useEffect } from 'react';
import { Editor, Frame, Element, useEditor } from '@craftjs/core';

// Import simplified Craft.js components
import { Container, Text, Button, Video, HeroSection, LandingCard } from '../../craft/simple';
import { RenderNode } from '../../craft/editor/RenderNode';

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
  return (
    <div className="relative w-full h-full overflow-auto">
      {/* Craft.js Editor Context */}
      <Editor
        resolver={{
          Container,
          Text,
          Button,
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
          {/* Craft.js Frame - Editable Area */}
          <Frame>
            <Element
              id="ROOT"
              is={Container}
              custom={{ displayName: 'Landing Page' }}
              canvas
              background={{ r: 255, g: 255, b: 255, a: 1 }}
              padding={['0', '0', '0', '0']}
              margin={['0', '0', '0', '0']}
              borderRadius={0}
              flexDirection="column"
              alignItems="center"
              justifyContent="flex-start"
              width="100%"
              height="auto"
            >
              {/* Hero Section */}
              <Element
                id="hero-section"
                is={HeroSection}
                custom={{ displayName: 'Hero Principal' }}
                canvas
                background={{ r: 37, g: 99, b: 235, a: 1 }}
                padding={['60', '40', '60', '40']}
                margin={['0', '0', '0', '0']}
                minHeight="300px"
              >
                {/* Hero Title */}
                <Element
                  id="hero-title"
                  is={Text}
                  text="Transforme Sua Clínica Digital"
                  fontSize="42"
                  fontWeight="700"
                  color={{ r: 255, g: 255, b: 255, a: 1 }}
                  textAlign="center"
                  margin={['0', '0', '20', '0']}
                  shadow={0}
                  tag="h1"
                />
                
                <Element
                  id="hero-subtitle"
                  is={Text}
                  text="Crie sites profissionais para sua clínica médica em minutos, sem conhecimento técnico."
                  fontSize="18"
                  fontWeight="400"
                  color={{ r: 255, g: 255, b: 255, a: 1 }}
                  textAlign="center"
                  margin={['0', '0', '30', '0']}
                  shadow={0}
                  tag="p"
                />
              </Element>
              
              {/* Features Section */}
              <Element
                id="features-section"
                is={Container}
                custom={{ displayName: 'Funcionalidades' }}
                canvas
                background={{ r: 248, g: 250, b: 252, a: 1 }}
                padding={['40', '20', '40', '20']}
                margin={['0', '0', '0', '0']}
                flexDirection="row"
                alignItems="flex-start"
                justifyContent="center"
                width="100%"
              >
                <Element
                  id="feature-1"
                  is={LandingCard}
                  custom={{ displayName: 'Feature 1' }}
                  canvas
                  background={{ r: 255, g: 255, b: 255, a: 1 }}
                  padding={30}
                  margin={['10', '10', '10', '10']}
                  borderRadius={8}
                  shadow={2}
                >
                  <Element
                    id="feature-1-title"
                    is={Text}
                    text="🚀 Criação Rápida"
                    fontSize="20"
                    fontWeight="600"
                    color={{ r: 37, g: 99, b: 235, a: 1 }}
                    textAlign="center"
                    margin={['0', '0', '15', '0']}
                    tag="h3"
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