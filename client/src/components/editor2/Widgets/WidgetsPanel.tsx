import React from 'react';
import { X, Type, AlignLeft, Square, Container, Minus, Image, Play } from 'lucide-react';
import { WidgetItem } from './WidgetItem';

interface WidgetsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WidgetsPanel: React.FC<WidgetsPanelProps> = ({ isOpen, onClose }) => {
  const widgets = [
    { icon: <Type size={32} />, label: 'TÍTULO' },
    { icon: <AlignLeft size={32} />, label: 'TEXTO' },
    { icon: <Square size={32} />, label: 'BOTÃO' },
    { icon: <Container size={32} />, label: 'CONTAINER' },
    { icon: <Minus size={32} />, label: 'ESPAÇO' },
    { icon: <Image size={32} />, label: 'IMAGEM' },
    { icon: <Play size={32} />, label: 'VÍDEO' }
  ];

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleWidgetClick = (label: string) => {
    console.log(`Widget ${label} clicked - Em Breve`);
  };

  React.useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay */}
      <div 
        className={`widgets-panel-overlay ${isOpen ? 'open' : ''}`}
        onClick={handleOverlayClick}
      />
      
      {/* Panel */}
      <div className={`widgets-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="widgets-panel-header">
          <h2 className="widgets-panel-title">Add Widget</h2>
          <button 
            className="widgets-panel-close"
            onClick={onClose}
            aria-label="Fechar painel"
          >
            <X size={20} />
          </button>
        </div>

        {/* Widgets Grid */}
        <div className="widgets-grid">
          {widgets.map((widget, index) => (
            <WidgetItem
              key={index}
              icon={widget.icon}
              label={widget.label}
              onClick={() => handleWidgetClick(widget.label)}
            />
          ))}
        </div>
      </div>
    </>
  );
};