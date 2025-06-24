import React from 'react';

interface WidgetItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

export const WidgetItem: React.FC<WidgetItemProps> = ({ 
  icon, 
  label, 
  onClick, 
  isAvailable = false,
  draggable = false,
  onDragStart,
  onDragEnd
}) => {
  return (
    <div 
      className={`widget-item ${isAvailable ? 'available' : 'coming-soon'} ${draggable ? 'draggable' : ''}`}
      onClick={onClick}
      draggable={draggable && isAvailable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="widget-item-content">
        <div className="widget-icon">
          {icon}
        </div>
        <div className="widget-label">
          {label}
        </div>
        {!isAvailable && (
          <div className="coming-soon-badge">
            Em Breve
          </div>
        )}
      </div>
    </div>
  );
};