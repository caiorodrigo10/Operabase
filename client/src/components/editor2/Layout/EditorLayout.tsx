import React from 'react';
import { CanvasArea } from '../Canvas/CanvasArea';
import { ToolsSidebar } from '../Sidebar/ToolsSidebar';

export const EditorLayout: React.FC = () => {
  return (
    <div className="editor2-layout">
      {/* Left Area - Reserved for future AI Chat */}
      <div className="editor2-left-area">
        {/* Reserved for AI Chat */}
      </div>

      {/* Center Area - Canvas Preview */}
      <div className="editor2-center-area">
        <CanvasArea />
      </div>

      {/* Right Area - Tools Sidebar */}
      <div className="editor2-right-area">
        <ToolsSidebar />
      </div>
    </div>
  );
};