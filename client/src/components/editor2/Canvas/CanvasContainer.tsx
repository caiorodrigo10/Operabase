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
    if (enabled && query) {
      console.log('🔧 EditorExposer: Craft.js editor initialized');
      
      // Store reference globally for header access
      currentCraftEditor = { actions, query };
      
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
  }, [enabled, query, actions]);

  return null;
};

// Store reference to current editor
let currentCraftEditor: any = null;

// Get default semantic JSON structure - Complete landing page template
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
      "custom": { "displayName": "Editor 2 - Landing Page Completa" },
      "parent": null,
      "hidden": false,
      "nodes": ["hero-section", "video-section", "features-section", "cta-section"],
      "linkedNodes": {}
    },
    "hero-section": {
      "type": { "resolvedName": "Container" },
      "isCanvas": true,
      "props": {
        "flexDirection": "column",
        "alignItems": "center",
        "justifyContent": "center",
        "padding": ["60", "40", "60", "40"],
        "margin": ["0", "0", "0", "0"],
        "background": { "r": 37, "g": 99, "b": 235, "a": 1 },
        "width": "100%",
        "height": "auto"
      },
      "displayName": "Container",
      "custom": { "displayName": "Hero Section" },
      "parent": "ROOT",
      "hidden": false,
      "nodes": ["hero-title", "hero-subtitle", "hero-button"],
      "linkedNodes": {}
    },
    "hero-title": {
      "type": { "resolvedName": "Text" },
      "isCanvas": false,
      "props": {
        "fontSize": "48",
        "textAlign": "center",
        "fontWeight": "700",
        "color": { "r": 255, "g": 255, "b": 255, "a": 1 },
        "margin": ["0", "20", "20", "20"],
        "text": "🚀 Operabase - Plataforma Completa"
      },
      "displayName": "Text",
      "custom": { "displayName": "Título Hero" },
      "parent": "hero-section",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "hero-subtitle": {
      "type": { "resolvedName": "Text" },
      "isCanvas": false,
      "props": {
        "fontSize": "20",
        "textAlign": "center",
        "fontWeight": "400",
        "color": { "r": 255, "g": 255, "b": 255, "a": 1 },
        "margin": ["0", "20", "30", "20"],
        "text": "Transforme sua clínica com IA, WhatsApp e gestão inteligente de pacientes"
      },
      "displayName": "Text",
      "custom": { "displayName": "Subtítulo Hero" },
      "parent": "hero-section",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "hero-button": {
      "type": { "resolvedName": "CraftButton" },
      "isCanvas": false,
      "props": {
        "background": { "r": 34, "g": 197, "b": 94, "a": 1 },
        "color": { "r": 255, "g": 255, "b": 255, "a": 1 },
        "buttonStyle": "full",
        "text": "Começar Agora - Grátis",
        "margin": ["10", "0", "10", "0"]
      },
      "displayName": "Button",
      "custom": { "displayName": "Botão Hero" },
      "parent": "hero-section",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "video-section": {
      "type": { "resolvedName": "Container" },
      "isCanvas": true,
      "props": {
        "flexDirection": "column",
        "alignItems": "center",
        "justifyContent": "center",
        "padding": ["80", "40", "80", "40"],
        "margin": ["0", "0", "0", "0"],
        "background": { "r": 248, "g": 250, "b": 252, "a": 1 },
        "width": "100%",
        "height": "auto"
      },
      "displayName": "Container",
      "custom": { "displayName": "Seção Vídeo" },
      "parent": "ROOT",
      "hidden": false,
      "nodes": ["video-title", "demo-video"],
      "linkedNodes": {}
    },
    "video-title": {
      "type": { "resolvedName": "Text" },
      "isCanvas": false,
      "props": {
        "fontSize": "36",
        "textAlign": "center",
        "fontWeight": "700",
        "color": { "r": 37, "g": 99, "b": 235, "a": 1 },
        "margin": ["0", "20", "40", "20"],
        "text": "📹 Veja Como Funciona"
      },
      "displayName": "Text",
      "custom": { "displayName": "Título Vídeo" },
      "parent": "video-section",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "demo-video": {
      "type": { "resolvedName": "Video" },
      "isCanvas": false,
      "props": {
        "videoId": "u7KQ4ityQeI",
        "width": 800,
        "height": 450
      },
      "displayName": "Video",
      "custom": { "displayName": "Vídeo Demo" },
      "parent": "video-section",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "features-section": {
      "type": { "resolvedName": "Container" },
      "isCanvas": true,
      "props": {
        "flexDirection": "column",
        "alignItems": "center",
        "justifyContent": "center",
        "padding": ["80", "40", "80", "40"],
        "margin": ["0", "0", "0", "0"],
        "background": { "r": 255, "g": 255, "b": 255, "a": 1 },
        "width": "100%",
        "height": "auto"
      },
      "displayName": "Container",
      "custom": { "displayName": "Seção Features" },
      "parent": "ROOT",
      "hidden": false,
      "nodes": ["features-title", "feature-1", "feature-2", "feature-3"],
      "linkedNodes": {}
    },
    "features-title": {
      "type": { "resolvedName": "Text" },
      "isCanvas": false,
      "props": {
        "fontSize": "36",
        "textAlign": "center",
        "fontWeight": "700",
        "color": { "r": 37, "g": 99, "b": 235, "a": 1 },
        "margin": ["0", "20", "50", "20"],
        "text": "✨ Recursos Principais"
      },
      "displayName": "Text",
      "custom": { "displayName": "Título Features" },
      "parent": "features-section",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "feature-1": {
      "type": { "resolvedName": "Container" },
      "isCanvas": true,
      "props": {
        "flexDirection": "column",
        "alignItems": "center",
        "justifyContent": "center",
        "padding": ["40", "30", "40", "30"],
        "margin": ["0", "20", "30", "20"],
        "background": { "r": 229, "g": 231, "b": 235, "a": 1 },
        "width": "100%",
        "height": "auto",
        "radius": 12
      },
      "displayName": "Container",
      "custom": { "displayName": "Feature 1" },
      "parent": "features-section",
      "hidden": false,
      "nodes": ["feature-1-title", "feature-1-desc"],
      "linkedNodes": {}
    },
    "feature-1-title": {
      "type": { "resolvedName": "Text" },
      "isCanvas": false,
      "props": {
        "fontSize": "24",
        "textAlign": "center",
        "fontWeight": "600",
        "color": { "r": 37, "g": 99, "b": 235, "a": 1 },
        "margin": ["0", "0", "15", "0"],
        "text": "🤖 Assistente IA Mara"
      },
      "displayName": "Text",
      "custom": { "displayName": "Feature 1 Título" },
      "parent": "feature-1",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "feature-1-desc": {
      "type": { "resolvedName": "Text" },
      "isCanvas": false,
      "props": {
        "fontSize": "16",
        "textAlign": "center",
        "fontWeight": "400",
        "color": { "r": 75, "g": 85, "b": 99, "a": 1 },
        "margin": ["0", "0", "0", "0"],
        "text": "IA conversacional com RAG para atendimento inteligente e contextualizado"
      },
      "displayName": "Text",
      "custom": { "displayName": "Feature 1 Descrição" },
      "parent": "feature-1",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "feature-2": {
      "type": { "resolvedName": "Container" },
      "isCanvas": true,
      "props": {
        "flexDirection": "column",
        "alignItems": "center",
        "justifyContent": "center",
        "padding": ["40", "30", "40", "30"],
        "margin": ["0", "20", "30", "20"],
        "background": { "r": 220, "g": 252, "b": 231, "a": 1 },
        "width": "100%",
        "height": "auto",
        "radius": 12
      },
      "displayName": "Container",
      "custom": { "displayName": "Feature 2" },
      "parent": "features-section",
      "hidden": false,
      "nodes": ["feature-2-title", "feature-2-desc"],
      "linkedNodes": {}
    },
    "feature-2-title": {
      "type": { "resolvedName": "Text" },
      "isCanvas": false,
      "props": {
        "fontSize": "24",
        "textAlign": "center",
        "fontWeight": "600",
        "color": { "r": 34, "g": 197, "b": 94, "a": 1 },
        "margin": ["0", "0", "15", "0"],
        "text": "📱 WhatsApp Evolution API"
      },
      "displayName": "Text",
      "custom": { "displayName": "Feature 2 Título" },
      "parent": "feature-2",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "feature-2-desc": {
      "type": { "resolvedName": "Text" },
      "isCanvas": false,
      "props": {
        "fontSize": "16",
        "textAlign": "center",
        "fontWeight": "400",
        "color": { "r": 75, "g": 85, "b": 99, "a": 1 },
        "margin": ["0", "0", "0", "0"],
        "text": "Integração completa com WhatsApp para comunicação automatizada e eficiente"
      },
      "displayName": "Text",
      "custom": { "displayName": "Feature 2 Descrição" },
      "parent": "feature-2",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "feature-3": {
      "type": { "resolvedName": "Container" },
      "isCanvas": true,
      "props": {
        "flexDirection": "column",
        "alignItems": "center",
        "justifyContent": "center",
        "padding": ["40", "30", "40", "30"],
        "margin": ["0", "20", "0", "20"],
        "background": { "r": 254, "g": 240, "b": 138, "a": 1 },
        "width": "100%",
        "height": "auto",
        "radius": 12
      },
      "displayName": "Container",
      "custom": { "displayName": "Feature 3" },
      "parent": "features-section",
      "hidden": false,
      "nodes": ["feature-3-title", "feature-3-desc"],
      "linkedNodes": {}
    },
    "feature-3-title": {
      "type": { "resolvedName": "Text" },
      "isCanvas": false,
      "props": {
        "fontSize": "24",
        "textAlign": "center",
        "fontWeight": "600",
        "color": { "r": 180, "g": 83, "b": 9, "a": 1 },
        "margin": ["0", "0", "15", "0"],
        "text": "📊 Multi-Tenant & Performance"
      },
      "displayName": "Text",
      "custom": { "displayName": "Feature 3 Título" },
      "parent": "feature-3",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "feature-3-desc": {
      "type": { "resolvedName": "Text" },
      "isCanvas": false,
      "props": {
        "fontSize": "16",
        "textAlign": "center",
        "fontWeight": "400",
        "color": { "r": 75, "g": 85, "b": 99, "a": 1 },
        "margin": ["0", "0", "0", "0"],
        "text": "Arquitetura multi-tenant com cache Redis e performance sub-200ms"
      },
      "displayName": "Text",
      "custom": { "displayName": "Feature 3 Descrição" },
      "parent": "feature-3",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "cta-section": {
      "type": { "resolvedName": "Container" },
      "isCanvas": true,
      "props": {
        "flexDirection": "column",
        "alignItems": "center",
        "justifyContent": "center",
        "padding": ["80", "40", "80", "40"],
        "margin": ["0", "0", "0", "0"],
        "background": { "r": 17, "g": 24, "b": 39, "a": 1 },
        "width": "100%",
        "height": "auto"
      },
      "displayName": "Container",
      "custom": { "displayName": "Call to Action" },
      "parent": "ROOT",
      "hidden": false,
      "nodes": ["cta-title", "cta-subtitle", "cta-button"],
      "linkedNodes": {}
    },
    "cta-title": {
      "type": { "resolvedName": "Text" },
      "isCanvas": false,
      "props": {
        "fontSize": "40",
        "textAlign": "center",
        "fontWeight": "700",
        "color": { "r": 255, "g": 255, "b": 255, "a": 1 },
        "margin": ["0", "20", "20", "20"],
        "text": "🎯 Pronto para Revolucionar sua Clínica?"
      },
      "displayName": "Text",
      "custom": { "displayName": "CTA Título" },
      "parent": "cta-section",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "cta-subtitle": {
      "type": { "resolvedName": "Text" },
      "isCanvas": false,
      "props": {
        "fontSize": "18",
        "textAlign": "center",
        "fontWeight": "400",
        "color": { "r": 229, "g": 231, "b": 235, "a": 1 },
        "margin": ["0", "20", "40", "20"],
        "text": "Junte-se a centenas de clínicas que já transformaram seu atendimento com nossa plataforma"
      },
      "displayName": "Text",
      "custom": { "displayName": "CTA Subtítulo" },
      "parent": "cta-section",
      "hidden": false,
      "nodes": [],
      "linkedNodes": {}
    },
    "cta-button": {
      "type": { "resolvedName": "CraftButton" },
      "isCanvas": false,
      "props": {
        "background": { "r": 34, "g": 197, "b": 94, "a": 1 },
        "color": { "r": 255, "g": 255, "b": 255, "a": 1 },
        "buttonStyle": "full",
        "text": "Iniciar Teste Gratuito",
        "margin": ["10", "0", "10", "0"]
      },
      "displayName": "Button",
      "custom": { "displayName": "Botão CTA" },
      "parent": "cta-section",
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
          // Always use the new complete template when no server data
          console.log('📂 Editor2 using NEW complete landing page template');
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
          {/* Craft.js Frame - Carrega JSON completo com landing page */}
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
              custom={{ displayName: 'Landing Page Completa' }}
            />
          </Frame>
        </div>
      </Editor>
    </div>
  );
};