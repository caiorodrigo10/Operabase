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