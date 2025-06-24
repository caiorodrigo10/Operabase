import React, { useState } from 'react';
import { ArrowLeft, Monitor, Tablet, Smartphone, ChevronLeft, ChevronRight, Settings, Save, Code, Eye } from 'lucide-react';
import { useLocation } from 'wouter';
import { useEditor2Store } from '../../../stores/editor2Store';

export const EditorHeader: React.FC = () => {
  const [activeDevice, setActiveDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [, setLocation] = useLocation();
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonContent, setJsonContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { serializeToJSON, deserializeFromJSON, savePageToServer } = useEditor2Store();

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

  const handleSave = async () => {
    const success = await savePageToServer();
    if (success) {
      // Visual feedback
      const button = document.querySelector('[data-save-button]') as HTMLElement;
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Salvo!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 1500);
      }
    }
  };

  const handleViewJson = () => {
    const pageJson = serializeToJSON();
    const formattedJson = JSON.stringify(pageJson, null, 2);
    setJsonContent(formattedJson);
    setIsEditing(false);
    setShowJsonModal(true);
  };

  const handleSaveJson = () => {
    try {
      const parsedJson = JSON.parse(jsonContent);
      deserializeFromJSON(parsedJson);
      setShowJsonModal(false);
      console.log('✅ JSON applied to Editor2');
    } catch (error) {
      console.error('❌ Invalid JSON:', error);
      alert('Erro: JSON inválido. Verifique a sintaxe.');
    }
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
          className="header-button save-button"
          onClick={handleSave}
          title="Salvar Página"
          data-save-button
        >
          <Save size={16} />
          <span>Salvar</span>
        </button>
        
        <button 
          className="header-button preview-button"
          onClick={handlePreview}
          title="Visualizar Página Externa"
        >
          <ExternalLink size={16} />
          <span>Preview</span>
        </button>
        
        <button 
          className="header-button json-button"
          onClick={handleViewJson}
          title="Ver JSON"
        >
          <Code size={16} />
        </button>
        
        <button 
          className="header-button settings-button"
          onClick={handleSettingsClick}
          title="Configurações"
        >
          <Settings size={18} />
        </button>
      </div>
      
      {/* JSON Modal */}
      {showJsonModal && (
        <div className="json-modal-overlay">
          <div className="json-modal">
            <div className="json-modal-header">
              <h3>JSON da Página Editor2</h3>
              <button 
                className="json-modal-close"
                onClick={() => setShowJsonModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="json-modal-content">
              <textarea
                className="json-textarea"
                value={jsonContent}
                onChange={(e) => setJsonContent(e.target.value)}
                readOnly={!isEditing}
                placeholder="JSON da página será exibido aqui..."
              />
            </div>
            <div className="json-modal-footer">
              <div className="json-modal-actions-left">
                <button 
                  className="json-button secondary"
                  onClick={() => navigator.clipboard.writeText(jsonContent)}
                >
                  Copiar JSON
                </button>
                <button 
                  className="json-button secondary"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Apenas Visualizar' : 'Editar JSON'}
                </button>
              </div>
              <div className="json-modal-actions-right">
                {isEditing && (
                  <button 
                    className="json-button primary"
                    onClick={handleSaveJson}
                  >
                    Aplicar JSON
                  </button>
                )}
                <button 
                  className="json-button secondary"
                  onClick={() => setShowJsonModal(false)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};