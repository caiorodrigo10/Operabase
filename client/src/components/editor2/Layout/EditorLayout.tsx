import React from 'react';
import { AICodeChat } from '../Chat/AICodeChat';
import { VerticalToolbar } from '../Toolbar/VerticalToolbar';
import { EditorHeader } from '../Header/EditorHeader';
import { CanvasContainer } from '../Canvas/CanvasContainer';



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
      
      {/* Toolbar Area - Vertical Tools */}
      <div className="editor2-toolbar-area">
        <VerticalToolbar />
      </div>
      
      {/* Center Area - Canvas */}
      <div className="editor2-center-area">
        <CanvasContainer />
      </div>
    </div>
  );
};