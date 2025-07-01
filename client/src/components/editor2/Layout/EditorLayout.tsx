import React from 'react';
import { AICodeChat } from '../Chat/AICodeChat';
import { EditorHeader } from '../Header/EditorHeader';
import { usePage } from '../../../contexts/PageProvider';
import { useEditor } from '../../../contexts/EditorContext';
import { JsonCanvas } from '../Canvas/JsonCanvas';

export const EditorLayout: React.FC = () => {
  const [isChatMinimized, setIsChatMinimized] = React.useState(true);
  
  // Hooks do editor
  const { pageJson, isLoading, error, setPageJson } = usePage();
  const { mode, showGrid, selectedBlockId, setMode, toggleGrid, selectBlock } = useEditor();

  // Função para testar o contexto
  const handleTestContext = () => {
    const testPageJson = {
      blocks: [
        {
          id: 'root-container',
          component: {
            name: 'Container',
            options: {}
          },
          responsiveStyles: {
            large: {
              maxWidth: '1200px',
              margin: '0 auto',
              paddingLeft: '40px',
              paddingRight: '40px'
            },
            medium: {
              maxWidth: '100%',
              paddingLeft: '24px',
              paddingRight: '24px'
            },
            small: {
              maxWidth: '100%',
              paddingLeft: '16px',
              paddingRight: '16px'
            }
          },
          children: [
            {
              id: 'test-text-1',
              component: {
                name: 'Text',
                options: {
                  text: 'Bem-vindo ao Editor2!'
                }
              },
              styles: {
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '16px'
              }
            },
            {
              id: 'test-text-2',
              component: {
                name: 'Text',
                options: {
                  text: 'Sistema de renderização JSON funcionando com Container ROOT.'
                }
              },
              styles: {
                marginBottom: '24px'
              }
            },
            {
              id: 'test-button-1',
              component: {
                name: 'Button',
                options: {
                  text: 'Botão de Teste',
                  variant: 'primary'
                }
              }
            }
          ]
        }
      ],
      meta: {
        title: 'Editor2 - Sistema de Renderização JSON',
        description: 'Testando layout base com Container ROOT'
      }
    };
    setPageJson(testPageJson);
  };

  return (
    <div className={`editor2-layout ${isChatMinimized ? 'chat-minimized' : ''}`}>
      {/* Header Area */}
      <div className="editor2-header-area">
        <EditorHeader />
      </div>
      
      {/* Left Area - AI Code Chat */}
      <div className="editor2-left-area">
        <AICodeChat onMinimizedChange={setIsChatMinimized} />
      </div>
      
      {/* Toolbar Area - Controles */}
      <div className="editor2-toolbar-area">
        <div className="toolbar-elements flex gap-3 items-center">
          {/* Teste de contexto */}
          <button 
            onClick={handleTestContext}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Testar Contexto
          </button>
          
          {/* Separador */}
          <div className="w-px h-6 bg-gray-300"></div>
          
          {/* Toggle Mode */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Modo:</span>
            <button
              onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                mode === 'edit' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {mode === 'edit' ? 'Edição' : 'Preview'}
            </button>
          </div>
          
          {/* Grid Toggle (apenas em modo edição) */}
          {mode === 'edit' && (
            <div className="flex items-center gap-2">
              <button
                onClick={toggleGrid}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  showGrid 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Grid {showGrid ? 'ON' : 'OFF'}
              </button>
            </div>
          )}
          
          {/* Info do bloco selecionado */}
          {selectedBlockId && mode === 'edit' && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Selecionado:</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">
                {selectedBlockId.slice(0, 8)}...
              </span>
              <button
                onClick={() => selectBlock(null)}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Center Area - JSON Canvas */}
      <div className="editor2-center-area">
        <JsonCanvas />
      </div>
    </div>
  );
};