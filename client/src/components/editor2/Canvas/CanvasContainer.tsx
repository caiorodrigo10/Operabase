import React from 'react';
import { Editor, Frame, Element } from '@craftjs/core';

// Import Craft.js components
import { Container } from '../../craft/selectors/Container';
import { Text } from '../../craft/selectors/Text';
import { Button } from '../../craft/selectors/Button';
import { Video } from '../../craft/selectors/Video';

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
                fontSize="24"
                fontWeight="600"
                textAlign="center"
                margin={[0, 0, 20, 0]}
              />
              
              <Element
                is={Text}
                text="Start building your page by adding components from the widgets panel."
                fontSize="16"
                textAlign="center"
                margin={[0, 0, 30, 0]}
              />
              
              <Element
                is={Button}
                text="Get Started"
                buttonStyle="full"
                background={{ r: 59, g: 130, b: 246, a: 1 }}
                color={{ r: 255, g: 255, b: 255, a: 1 }}
                margin={[10, 0, 10, 0]}
              />
            </Element>
          </Frame>
        </div>
      </Editor>
    </div>
  );
};