import React from 'react';
import { AICodeChat } from '../Chat/AICodeChat';
import { EditorHeader } from '../Header/EditorHeader';
import { usePage } from '../../../contexts/PageProvider';
import { JsonCanvas } from '../Canvas/JsonCanvas';

export const EditorLayout: React.FC = () => {
  const [isChatMinimized, setIsChatMinimized] = React.useState(true);
  
  // Testando o hook usePage
  const { pageJson, isLoading, error, setPageJson } = usePage();

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
      
      {/* Toolbar Area - Elementos */}
      <div className="editor2-toolbar-area">
        <div className="toolbar-elements">
          <button 
            onClick={handleTestContext}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Testar Contexto
          </button>
        </div>
      </div>
      
      {/* Center Area - JSON Canvas */}
      <div className="editor2-center-area">
        <JsonCanvas />
      </div>
    </div>
  );
};