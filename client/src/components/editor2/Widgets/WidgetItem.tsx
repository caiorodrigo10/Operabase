import React from 'react';

interface WidgetItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

export const WidgetItem: React.FC<WidgetItemProps> = ({ icon, label, onClick }) => {
  return (
    <div className="widget-item" onClick={onClick}>
      <div className="widget-item-content">
        <div className="widget-icon">
          {icon}
        </div>
        <div className="widget-label">
          {label}
        </div>
        <div className="coming-soon-badge">
          Em Breve
        </div>
      </div>
    </div>
  );
};