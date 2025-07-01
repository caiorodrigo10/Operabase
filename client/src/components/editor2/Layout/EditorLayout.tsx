import React from 'react';
import { AICodeChat } from '../Chat/AICodeChat';
import { EditorHeader } from '../Header/EditorHeader';
import { usePage } from '../../../contexts/PageProvider';

export const EditorLayout: React.FC = () => {
  const [isChatMinimized, setIsChatMinimized] = React.useState(true);
  
  // Testando o hook usePage
  const { pageJson, isLoading, error, setPageJson } = usePage();

  // Função para testar o contexto
  const handleTestContext = () => {
    const testPageJson = {
      blocks: [
        {
          id: 'test-block-1',
          component: {
            name: 'Text',
            options: {
              text: 'Teste do contexto funcionando!'
            }
          }
        }
      ],
      meta: {
        title: 'Página de Teste',
        description: 'Testando o PageProvider'
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
      
      {/* Center Area - Canvas com teste do contexto */}
      <div className="editor2-center-area">
        <div className="editor2-blank-canvas p-4">
          <h3 className="text-lg font-bold mb-4">Status do PageProvider:</h3>
          
          {/* Estados */}
          <div className="mb-4">
            <p><strong>Loading:</strong> {isLoading ? 'Sim' : 'Não'}</p>
            <p><strong>Erro:</strong> {error || 'Nenhum'}</p>
            <p><strong>Dados:</strong> {pageJson ? 'Carregados' : 'Vazio'}</p>
          </div>
          
          {/* Dados do JSON */}
          {pageJson && (
            <div className="bg-gray-100 p-4 rounded">
              <h4 className="font-semibold mb-2">PageJSON:</h4>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(pageJson, null, 2)}
              </pre>
            </div>
          )}
          
          {!pageJson && (
            <div className="bg-yellow-100 p-4 rounded">
              <p>Nenhum dados carregados. Clique em "Testar Contexto" para carregar dados de teste.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};