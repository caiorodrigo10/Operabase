import React, { useState, useEffect } from 'react';
import { Editor, Frame, Element, useEditor } from '@craftjs/core';
import { Container, Text } from '../../craft/selectors';
import { Button as CraftButton } from '../../craft/selectors/Button';
import { Video } from '../../craft/selectors/Video';
import { RenderNode } from '../../craft/editor/RenderNode';

// EditorExposer component for accessing editor state
const EditorExposer: React.FC = () => {
  const { actions, query, enabled } = useEditor((state) => ({
    enabled: state.options.enabled
  }));

  useEffect(() => {
    if (enabled) {
      console.log('🔧 EditorExposer: Craft.js editor initialized');
      
      const nodes = query.getNodes();
      const nodeIds = Object.keys(nodes);
      console.log('🔧 EditorExposer: Current nodes at init:', nodeIds);
      
      // Map random IDs to semantic IDs
      const idMapping: Record<string, string> = { ROOT: 'ROOT' };
      
      nodeIds.forEach(nodeId => {
        const node = nodes[nodeId];
        if (node?.data?.props?.id) {
          idMapping[nodeId] = node.data.props.id;
          console.log(`🏷️ EditorExposer: Found element with custom ID: ${nodeId} -> ${node.data.props.id}`);
        }
      });
    }
  }, [enabled, query]);

  return null;
};

// Store reference to current editor
let currentCraftEditor: any = null;

// Get default semantic JSON structure
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
      "nodes": ["simple-title", "simple-video"],
      "linkedNodes": {}
    },
    "simple-title": {
      "type": { "resolvedName": "Text" },
      "isCanvas": false,
      "props": {
        "fontSize": "32",
        "textAlign": "center",
        "fontWeight": "700",
        "color": { "r": 37, "g": 99, "b": 235, "a": 1 },
        "margin": ["40", "20", "40", "20"],
        "shadow": 0,
        "text": "🎬 Editor 2 - Template com Vídeo YouTube"
      },
      "displayName": "Text",
      "custom": { "displayName": "Título Principal" },
      "parent": "ROOT",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "simple-video": {
      "type": { "resolvedName": "Video" },
      "isCanvas": false,
      "props": {
        "videoId": "u7KQ4ityQeI",
        "width": 560,
        "height": 315
      },
      "displayName": "Video",
      "custom": { "displayName": "Vídeo YouTube" },
      "parent": "ROOT",
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
  const [forceTemplate, setForceTemplate] = useState(false);

  // Check if force template is requested via URL or local flag
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('force') === 'true' || window.location.hash === '#force') {
      setForceTemplate(true);
    }
  }, []);

  // Load saved state from server BEFORE Frame renders (same pattern as Editor Landing)
  useEffect(() => {
    const loadPageData = async () => {
      try {
        // If force template is requested, skip server load completely
        if (forceTemplate) {
          console.log('📂 Editor2 FORCE MODE: Using new template with video');
          setInitialJson(JSON.stringify(getDefaultSemanticJson()));
          setIsLoading(false);
          return;
        }

        // First try to load from server
        const response = await fetch('/api/load-page-json/editor2');
        const result = await response.json();
        
        console.log('📂 Editor2 loading response:', result);
        
        if (result.success && result.data) {
          console.log('📂 Editor2 loading from server');
          setInitialJson(result.data);
        } else {
          // Always use the new template with video when no server data
          console.log('📂 Editor2 using NEW default semantic structure with video');
          setInitialJson(JSON.stringify(getDefaultSemanticJson()));
        }
      } catch (error) {
        console.error('Error loading page data:', error);
        // Force new template on error
        console.log('📂 Editor2 using NEW default template (error fallback)');
        setInitialJson(JSON.stringify(getDefaultSemanticJson()));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPageData();
  }, [forceTemplate]);

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
          Video
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
          <Frame data={initialJson || JSON.stringify(getDefaultSemanticJson())}>
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
              {/* Simple Title */}
              <Element
                is={Text}
                fontSize="32"
                textAlign="center"
                fontWeight="700"
                color={{ r: 37, g: 99, b: 235, a: 1 }}
                margin={['40', '20', '40', '20']}
                text="🎬 Editor 2 - Template com Vídeo YouTube"
              />
              
              {/* YouTube Video */}
              <Element
                is={Video}
                videoId="u7KQ4ityQeI"
                width={560}
                height={315}
              />
            </Element>
          </Frame>
        </div>
      </Editor>
    </div>
  );
};