import React from 'react';
import { AICodeChat } from '../Chat/AICodeChat';
import { EditorHeader } from '../Header/EditorHeader';

export const EditorLayout: React.FC = () => {
  const [isChatMinimized, setIsChatMinimized] = React.useState(true);

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
          {/* Placeholder para elementos futuros */}
        </div>
      </div>
      
      {/* Center Area - Blank Canvas */}
      <div className="editor2-center-area">
        <div className="editor2-blank-canvas">
          {/* Canvas em branco para futuras implementações */}
        </div>
      </div>
    </div>
  );
};