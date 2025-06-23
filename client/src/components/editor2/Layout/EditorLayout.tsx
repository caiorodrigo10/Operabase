import React from 'react';
import { CanvasProps } from '../../../types/editor2';

const CanvasArea: React.FC<CanvasProps> = ({ content }) => {
  return (
    <div className="editor2-canvas">
      <div className="editor2-canvas-content">
        <div className="editor2-canvas-placeholder">
          <h2>Canvas Area</h2>
          <p>Drag and drop elements to start building your page</p>
        </div>
      </div>
    </div>
  );
};

interface ToolIconProps {
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const ToolIcon: React.FC<ToolIconProps> = ({ 
  icon, 
  label, 
  isActive, 
  onClick 
}) => {
  return (
    <div 
      className={`editor2-tool-icon ${isActive ? 'active' : ''}`}
      onClick={onClick}
      title={label}
    >
      <span className="editor2-tool-icon-symbol">{icon}</span>
    </div>
  );
};

const ToolsSidebar: React.FC = () => {
  const tools = [
    { id: 'widgets', icon: '🧩', label: 'Widgets' },
    { id: 'design', icon: '🎨', label: 'Design' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
    { id: 'pages', icon: '📄', label: 'Pages' },
  ];

  return (
    <div className="editor2-sidebar">
      <div className="editor2-sidebar-tools">
        {tools.map((tool) => (
          <ToolIcon 
            key={tool.id}
            icon={tool.icon}
            label={tool.label}
            isActive={false}
            onClick={() => {
              // Future functionality
            }}
          />
        ))}
      </div>
    </div>
  );
};

export const EditorLayout: React.FC = () => {
  return (
    <div className="editor2-layout">
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