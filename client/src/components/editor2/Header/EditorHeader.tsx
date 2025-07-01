import React, { useState } from 'react';
import { ArrowLeft, Monitor, Tablet, Smartphone, ChevronLeft, ChevronRight, Settings, Save, Code, Eye, ExternalLink } from 'lucide-react';
import { useLocation } from 'wouter';
import { useEditor2Store } from '../../../stores/editor2Store';
import { getCurrentCraftEditor } from '../Canvas/CanvasContainer';

// Function to transform Craft.js JSON to use semantic IDs as keys (SIMPLIFIED)
const transformToSemanticJson = (craftJson: any) => {
  // Check if input is already a proper object
  if (typeof craftJson === 'string') {
    try {
      craftJson = JSON.parse(craftJson);
    } catch (e) {
      console.error('❌ Failed to parse craftJson string:', e);
      return craftJson;
    }
  }
  
  // Check if craftJson is a valid object with node structure
  if (!craftJson || typeof craftJson !== 'object' || Array.isArray(craftJson)) {
    console.error('❌ Invalid craftJson format:', typeof craftJson);
    return craftJson;
  }
  
  const transformed: any = {};
  const idMapping: { [key: string]: string } = {};
  
  // First pass: create mapping of random IDs to semantic IDs
  Object.entries(craftJson).forEach(([randomId, node]: [string, any]) => {
    if (node?.props?.id) {
      // Use semantic ID from props
      idMapping[randomId] = node.props.id;
    } else if (randomId === 'ROOT') {
      // Keep ROOT as ROOT
      idMapping[randomId] = 'ROOT';
    } else {
      // Keep random ID if no semantic ID
      idMapping[randomId] = randomId;
    }
  });
  
  console.log('🔄 ID Mapping:', idMapping);
  
  // Second pass: transform the JSON structure
  Object.entries(craftJson).forEach(([randomId, node]: [string, any]) => {
    const semanticId = idMapping[randomId];
    const transformedNode = { ...node };
    
    // Transform node references in 'nodes' array
    if (transformedNode.nodes && Array.isArray(transformedNode.nodes)) {
      transformedNode.nodes = transformedNode.nodes.map((childId: string) => 
        idMapping[childId] || childId
      );
    }
    
    // Transform parent reference
    if (transformedNode.parent && idMapping[transformedNode.parent]) {
      transformedNode.parent = idMapping[transformedNode.parent];
    }
    
    // Transform linkedNodes references
    if (transformedNode.linkedNodes && typeof transformedNode.linkedNodes === 'object') {
      const newLinkedNodes: any = {};
      Object.entries(transformedNode.linkedNodes).forEach(([key, value]: [string, any]) => {
        if (typeof value === 'string' && idMapping[value]) {
          newLinkedNodes[key] = idMapping[value];
        } else {
          newLinkedNodes[key] = value;
        }
      });
      transformedNode.linkedNodes = newLinkedNodes;
    }
    
    transformed[semanticId] = transformedNode;
  });
  
  console.log('🎯 Transformed keys:', Object.keys(transformed));
  return transformed;
};

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
    try {
      // Get current Craft.js editor
      const craftEditor = getCurrentCraftEditor();
      
      if (craftEditor && craftEditor.query && craftEditor.query.serialize) {
        // Use Craft.js serialization (same as Editor Landing)
        const craftJson = craftEditor.query.serialize();
        
        // Transform to semantic JSON for storage
        const semanticJson = transformToSemanticJson(craftJson);
        
        // Save semantic JSON to localStorage
        localStorage.setItem('editor2_craft_state', JSON.stringify(semanticJson));
        console.log('💾 Editor2 semantic state saved with keys:', Object.keys(semanticJson));
        
        // Save to server (same pattern as Editor Landing)
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            import.meta.env.VITE_SUPABASE_URL!,
            import.meta.env.VITE_SUPABASE_ANON_KEY!
          );
          const { data: { session } } = await supabase.auth.getSession();
          
          const response = await fetch('/api/save-page-json', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              pageId: 'editor2',
              jsonData: JSON.stringify(semanticJson)
            })
          });
          
          if (response.ok) {
            console.log('✅ Editor2 JSON saved to server');
            
            // Visual feedback
            const button = document.querySelector('[data-save-button]') as HTMLElement;
            if (button) {
              const originalText = button.textContent;
              button.textContent = 'Salvo!';
              setTimeout(() => {
                button.textContent = originalText;
              }, 1500);
            }
          } else {
            console.error('❌ Error saving to server');
            alert('Estado salvo localmente (erro no servidor)');
          }
        } catch (error) {
          console.error('❌ Server save error:', error);
          alert('Estado salvo localmente (erro no servidor)');
        }
      } else {
        // Fallback to legacy system
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
      }
    } catch (error) {
      console.error('❌ Error saving Editor2 state:', error);
      // Fallback to legacy save
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
    }
  };

  const handlePreview = async () => {
    try {
      // Salva no localStorage primeiro (garantindo dados para preview)
      const pageJson = serializeToJSON();
      const jsonString = JSON.stringify(pageJson, null, 2);
      localStorage.setItem('editor2_page_state', jsonString);
      
      // Tenta salvar no servidor (mas não bloqueia se falhar)
      try {
        await savePageToServer();
      } catch (error) {
        console.warn('Could not save to server, using localStorage for preview:', error);
      }
      
      // Abre a página de preview em nova aba
      const previewUrl = `/preview/editor2`;
      window.open(previewUrl, '_blank');
    } catch (error) {
      console.error('Error opening preview:', error);
    }
  };

  const handleViewJson = () => {
    try {
      // Get current Craft.js editor
      const craftEditor = getCurrentCraftEditor();
      
      if (craftEditor && craftEditor.query && craftEditor.query.serialize) {
        // Use Craft.js serialization
        const craftJson = craftEditor.query.serialize();
        
        // Transform to semantic JSON
        const semanticJson = transformToSemanticJson(craftJson);
        const formattedJson = JSON.stringify(semanticJson, null, 2);
        setJsonContent(formattedJson);
        
        console.log('📄 Original Craft.js JSON keys:', Object.keys(craftJson));
        console.log('🎯 Transformed semantic JSON keys:', Object.keys(semanticJson));
      } else {
        // Fallback to legacy system
        const pageJson = serializeToJSON();
        const formattedJson = JSON.stringify(pageJson, null, 2);
        setJsonContent(formattedJson);
        console.log('📄 Legacy JSON exported (Craft.js not available)');
      }
    } catch (error) {
      console.error('❌ Failed to serialize:', error);
      // Fallback to legacy system
      const pageJson = serializeToJSON();
      const formattedJson = JSON.stringify(pageJson, null, 2);
      setJsonContent(formattedJson);
    }
    setIsEditing(false);
    setShowJsonModal(true);
  };

  const handleSaveJson = () => {
    try {
      const parsedJson = JSON.parse(jsonContent);
      
      // Get current Craft.js editor
      const craftEditor = getCurrentCraftEditor();
      
      if (craftEditor && craftEditor.actions && craftEditor.actions.deserialize) {
        // Use Craft.js deserialization
        craftEditor.actions.deserialize(parsedJson);
        console.log('✅ JSON applied to Craft.js Canvas');
      } else {
        // Fallback to legacy system
        deserializeFromJSON(parsedJson);
        console.log('✅ JSON applied to Editor2 (Craft.js not available)');
      }
      
      setShowJsonModal(false);
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
          className="header-button reset-button"
          onClick={() => {
            // Clear all possible localStorage keys
            localStorage.removeItem('editor2_craft_state');
            localStorage.removeItem('editor2_page_state');
            localStorage.removeItem('craft-state');
            
            // Force template reload with URL parameter
            window.location.href = '/editor2?force=true';
          }}
          title="Reset Template - Carregar Template Padrão"
          style={{ 
            backgroundColor: '#f59e0b', 
            color: 'white',
            marginRight: '8px' 
          }}
        >
          <Settings size={16} />
          <span>Reset</span>
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