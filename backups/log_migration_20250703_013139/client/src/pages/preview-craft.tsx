import React, { useState, useEffect } from 'react';
import { Editor, Frame, Element } from '@craftjs/core';
import { Container } from '../components/craft/selectors/landing/Container';
import { Text } from '../components/craft/selectors/landing/Text';
import { Button as CraftButton } from '../components/craft/selectors/Button';
import { Video } from '../components/craft/selectors/Video';
import { X, ExternalLink } from 'lucide-react';

interface CraftPreviewPageProps {
  pageId?: string;
}

export const CraftPreviewPage: React.FC<CraftPreviewPageProps> = ({ pageId = 'editor2' }) => {
  const [pageData, setPageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPageData = async () => {
      try {
        console.log('🎥 Preview Craft.js: Loading page data for', pageId);

        // 1. Try localStorage first (most recent data from editor)
        const savedState = localStorage.getItem('editor2_craft_preview') || 
                           localStorage.getItem('editor2_craft_state');
        
        if (savedState) {
          console.log('📂 Preview loaded from localStorage');
          setPageData(savedState);
          return;
        }

        // 2. Fallback to server data
        const response = await fetch(`/api/load-page-json/${pageId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          console.log('📂 Preview loaded from server');
          setPageData(result.data);
        } else {
          console.log('📂 No data found, using empty template');
          // Default empty structure for Craft.js
          const defaultJson = {
            "ROOT": {
              "type": { "resolvedName": "Container" },
              "isCanvas": true,
              "props": {
                "flexDirection": "column",
                "alignItems": "center",
                "justifyContent": "center",
                "fillSpace": "no",
                "padding": ["40", "40", "40", "40"],
                "margin": ["0", "0", "0", "0"],
                "background": { "r": 255, "g": 255, "b": 255, "a": 1 },
                "width": "100%",
                "height": "100vh"
              },
              "displayName": "Container",
              "custom": { "displayName": "Preview Container" },
              "parent": null,
              "hidden": false,
              "nodes": ["empty-text"],
              "linkedNodes": {}
            },
            "empty-text": {
              "type": { "resolvedName": "Text" },
              "isCanvas": false,
              "props": {
                "fontSize": "24",
                "textAlign": "center",
                "fontWeight": "400",
                "color": { "r": 156, "g": 163, "b": 175, "a": 1 },
                "margin": ["0", "0", "0", "0"],
                "text": "Página vazia - Crie conteúdo no editor"
              },
              "displayName": "Text",
              "custom": { "displayName": "Empty Message" },
              "parent": "ROOT",
              "hidden": false,
              "nodes": [],
              "linkedNodes": {}
            }
          };
          setPageData(JSON.stringify(defaultJson));
        }
      } catch (err) {
        console.error('Error loading page for preview:', err);
        setError('Erro ao carregar página para preview');
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
  }, [pageId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Erro no Preview</h1>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.close()}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Página Vazia</h1>
          <p className="text-gray-600">Nenhum conteúdo foi criado no editor</p>
          <button 
            onClick={() => window.close()}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Preview Controls - Fixed Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Preview Craft.js</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Live
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                title="Recarregar Preview"
              >
                <ExternalLink size={14} />
                Reload
              </button>
              <button
                onClick={() => window.close()}
                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                title="Fechar Preview"
              >
                <X size={14} />
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Craft.js Preview Content */}
      <div className="pt-16">
        <Editor
          resolver={{
            Container,
            Text,
            CraftButton,
            Video,
          }}
          enabled={false} // Modo somente visualização
        >
          <Frame data={pageData}>
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
              custom={{ displayName: 'Preview Root' }}
            />
          </Frame>
        </Editor>
      </div>

      {/* Preview Footer */}
      <div className="bg-gray-50 border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="text-center text-sm text-gray-500">
            Preview gerado pelo Editor2 • Craft.js • {new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CraftPreviewPage;