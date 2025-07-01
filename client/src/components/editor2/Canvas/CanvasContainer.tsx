import React, { useEffect } from 'react';
import { Editor, Frame, Element, useEditor } from '@craftjs/core';

// Import simplified Craft.js components
import { Container, Text, Button, Video } from '../../craft/simple';

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
          Video
        }}
        enabled={true}
      >
        <EditorExposer />
        {/* Canvas Background */}
        <div 
          className="min-h-full bg-gray-50"
          style={{ backgroundColor: '#f8f9fa' }}
        >
          {/* Craft.js Frame - Editable Area */}
          <Frame>
            <Element
              is={Container}
              custom={{ displayName: 'App' }}
              canvas
              style={{
                minHeight: '400px',
                padding: '20px'
              }}
            >
              {/* Initial Content */}
              <Element
                is={Text}
                text="Welcome to the Page Builder"
                fontSize="28px"
                fontWeight="600"
                textAlign="center"
                margin="0px 0px 20px 0px"
                tag="h1"
              />
              
              <Element
                is={Text}
                text="Start building your page by adding components from the widgets panel."
                fontSize="16px"
                textAlign="center"
                margin="0px 0px 30px 0px"
                color="#666666"
              />
              
              <Element
                is={Button}
                text="Get Started"
                backgroundColor="#3b82f6"
                color="#ffffff"
                padding="14px 28px"
                margin="10px auto"
                borderRadius="8px"
                fontSize="16px"
                fontWeight="500"
                width="auto"
              />
            </Element>
          </Frame>
        </div>
      </Editor>
    </div>
  );
};