import React from 'react';
import { CanvasArea } from '../Canvas/CanvasArea';
import { ToolsSidebar } from '../Sidebar/ToolsSidebar';

export const EditorLayout: React.FC = () => {
  return (
    <div className="editor2-layout">
      {/* Left Area - Reserved for AI Chat (future implementation) */}
      <div className="editor2-left-area">
        <div className="p-6 h-full flex items-center justify-center text-gray-500">
          <div className="text-center">
            <h3 className="font-medium mb-2">AI Assistant</h3>
            <p className="text-sm">Coming soon</p>
          </div>
        </div>
      </div>
      
      {/* Center Area - Canvas */}
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