import React, { useState } from 'react';
import { ArrowLeft, Monitor, Tablet, Smartphone, ChevronLeft, ChevronRight, Settings, Code } from 'lucide-react';
import { useLocation } from 'wouter';
import { JsonEditorModal } from '../Modal/JsonEditorModal';

export const EditorHeader: React.FC = () => {
  const [activeDevice, setActiveDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [, setLocation] = useLocation();

  const handleBackClick = () => {
    console.log('Navigating to funnels page');
    setLocation('/funis/1');
  };

  const handleDeviceChange = (device: 'desktop' | 'tablet' | 'mobile') => {
    setActiveDevice(device);
    console.log(`Switching to ${device} mode`);
  };

  const handleStepNavigation = (direction: 'prev' | 'next') => {
    console.log(`${direction === 'prev' ? 'Previous' : 'Next'} page`);
  };

  const handleSettingsClick = () => {
    console.log('Opening settings menu');
  };

  const handleCodeClick = () => {
    console.log('Opening JSON editor');
    setIsJsonModalOpen(true);
  };

  const handleJsonSave = (json: any) => {
    console.log('📄 JSON saved from modal:', json);
    // Here we would typically trigger a page re-render or update context
    // For now, we'll just log the successful save
  };

  return (
    <div className="editor-header">
      {/* Left Section */}
      <div className="header-left">
        <button 
          className="header-button back-button"
          onClick={handleBackClick}
          title="Voltar para funis"
        >
          <ArrowLeft size={18} />
        </button>
        
        <div className="device-toggle-group">
          <button
            className={`device-button ${activeDevice === 'desktop' ? 'active' : ''}`}
            onClick={() => handleDeviceChange('desktop')}
            title="Preview Desktop"
          >
            <Monitor size={16} />
          </button>
          <button
            className={`device-button ${activeDevice === 'tablet' ? 'active' : ''}`}
            onClick={() => handleDeviceChange('tablet')}
            title="Preview Tablet"
          >
            <Tablet size={16} />
          </button>
          <button
            className={`device-button ${activeDevice === 'mobile' ? 'active' : ''}`}
            onClick={() => handleDeviceChange('mobile')}
            title="Preview Mobile"
          >
            <Smartphone size={16} />
          </button>
        </div>
      </div>

      {/* Center Section */}
      <div className="header-center">
        <div className="step-navigation">
          <button 
            className="step-arrow"
            onClick={() => handleStepNavigation('prev')}
            title="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="step-text">Página: Homepage</span>
          <button 
            className="step-arrow"
            onClick={() => handleStepNavigation('next')}
            title="Próxima página"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Right Section */}
      <div className="header-right">
        <button 
          className="header-button code-button"
          onClick={handleCodeClick}
          title="Editor JSON"
        >
          <Code size={18} />
        </button>
        <button 
          className="header-button settings-button"
          onClick={handleSettingsClick}
          title="Configurações"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* JSON Editor Modal */}
      <JsonEditorModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        onSave={handleJsonSave}
      />
    </div>
  );
};