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
      
      {/* Center Area - JSON Canvas */}
      <div className="editor2-center-area">
        <JsonCanvas />
      </div>
    </div>
  );
};