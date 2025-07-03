import React, { useState } from 'react';
import { Editor, Frame, Element, useEditor } from '@craftjs/core';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Save, Type, Square, MousePointer } from 'lucide-react';
import { Link } from 'wouter';

// Simple Text Component
const TextComponent = ({ text = 'Edit this text', fontSize = 16, fontWeight = 400, textAlign = 'left', color = '#000000' }: any) => {
  const [editMode, setEditMode] = useState(false);
  const [currentText, setCurrentText] = useState(text);

  return (
    <div
      style={{
        fontSize: `${fontSize}px`,
        fontWeight,
        textAlign: textAlign as any,
        color,
        padding: '12px',
        minHeight: '40px',
        border: '2px dashed transparent',
        cursor: 'pointer'
      }}
      onClick={() => setEditMode(true)}
      onBlur={() => setEditMode(false)}
    >
      {editMode ? (
        <input
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          style={{
            fontSize: `${fontSize}px`,
            fontWeight,
            textAlign: textAlign as any,
            color,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            width: '100%'
          }}
          autoFocus
        />
      ) : (
        currentText
      )}
    </div>
  );
};

TextComponent.craft = {
  displayName: 'Text',
  props: {
    text: 'Edit this text',
    fontSize: 16,
    fontWeight: 400,
    textAlign: 'left',
    color: '#000000'
  }
};

// Simple Container Component
const ContainerComponent = ({ children, backgroundColor = '#ffffff', padding = 20, margin = 0 }: any) => {
  return (
    <div
      style={{
        backgroundColor,
        padding: `${padding}px`,
        margin: `${margin}px`,
        minHeight: '100px',
        border: '2px dashed #e2e8f0'
      }}
    >
      {children}
    </div>
  );
};

ContainerComponent.craft = {
  displayName: 'Container',
  props: {
    backgroundColor: '#ffffff',
    padding: 20,
    margin: 0
  }
};

// Simple Button Component
const ButtonComponent = ({ text = 'Click me', backgroundColor = '#3b82f6', textColor = '#ffffff', padding = 12 }: any) => {
  return (
    <button
      style={{
        backgroundColor,
        color: textColor,
        padding: `${padding}px 24px`,
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 500
      }}
    >
      {text}
    </button>
  );
};

ButtonComponent.craft = {
  displayName: 'Button',
  props: {
    text: 'Click me',
    backgroundColor: '#3b82f6',
    textColor: '#ffffff',
    padding: 12
  }
};

// Toolbox Component - Only renders inside Editor context
const Toolbox = () => {
  const { connectors } = useEditor();

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-4">Elementos</h3>
      <div className="space-y-2">
        <div
          ref={(ref) => connectors.create(ref!, <Element is={TextComponent} text="Novo texto" />)}
          className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 flex items-center space-x-2"
        >
          <Type className="w-4 h-4 text-gray-600" />
          <span>Texto</span>
        </div>
        
        <div
          ref={(ref) => connectors.create(ref!, <Element is={ButtonComponent} text="Novo botão" />)}
          className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 flex items-center space-x-2"
        >
          <MousePointer className="w-4 h-4 text-gray-600" />
          <span>Botão</span>
        </div>
        
        <div
          ref={(ref) => connectors.create(ref!, <Element canvas is={ContainerComponent} />)}
          className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 flex items-center space-x-2"
        >
          <Square className="w-4 h-4 text-gray-600" />
          <span>Container</span>
        </div>
      </div>
    </div>
  );
};

// Settings Panel Component - Only renders inside Editor context
const SettingsPanel = () => {
  const { selected } = useEditor((state) => {
    const selectedNodeIds = state.events.selected;
    let selected = null;
    
    if (selectedNodeIds && selectedNodeIds.size > 0) {
      const currentNodeId = Array.from(selectedNodeIds)[0];
      if (state.nodes[currentNodeId]) {
        selected = {
          id: currentNodeId,
          name: state.nodes[currentNodeId].data.displayName || 'Element',
          settings: state.nodes[currentNodeId].related?.settings,
          isDeletable: state.nodes[currentNodeId].data.parent !== 'ROOT'
        };
      }
    }
    
    return {
      selected
    };
  });

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-4">Propriedades</h3>
      {selected ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Elemento: {selected.name}
            </label>
            <p className="text-sm text-gray-500">
              ID: {selected.id}
            </p>
          </div>
          
          {selected.settings && React.createElement(selected.settings)}
          
          {selected.isDeletable && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => {
                // Delete functionality would go here
                console.log('Delete element:', selected.id);
              }}
            >
              Excluir Elemento
            </Button>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          Selecione um elemento para editar suas propriedades
        </div>
      )}
    </div>
  );
};

// Main Editor Component
export default function FunilEditorClean() {
  const handleSave = () => {
    console.log('Salvando página...');
  };

  const handlePreview = () => {
    console.log('Visualizando página...');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/funis">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar aos Funis
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Editor de Funil</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </header>

      {/* Editor Layout */}
      <div className="flex h-[calc(100vh-73px)]">
        <Editor
          resolver={{
            TextComponent,
            ContainerComponent,
            ButtonComponent
          }}
        >
          {/* Toolbox */}
          <Toolbox />
          
          {/* Canvas */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="bg-white rounded-lg shadow-sm min-h-full">
              <Frame>
                <Element
                  canvas
                  is={ContainerComponent}
                  backgroundColor="#ffffff"
                  padding={40}
                >
                  <TextComponent 
                    text="Bem-vindo ao Editor de Funis" 
                    fontSize={32} 
                    fontWeight={700} 
                    textAlign="center" 
                  />
                  <TextComponent 
                    text="Clique em qualquer texto para editá-lo. Arraste elementos da barra lateral para adicionar novos componentes." 
                    fontSize={16} 
                    textAlign="center" 
                  />
                  
                  <Element
                    canvas
                    is={ContainerComponent}
                    backgroundColor="#f8fafc"
                    padding={30}
                    margin={20}
                  >
                    <TextComponent text="Container Aninhado" fontSize={24} fontWeight={600} />
                    <TextComponent text="Este é um exemplo de container dentro de outro container." fontSize={14} />
                    <ButtonComponent text="Botão de Exemplo" />
                  </Element>
                </Element>
              </Frame>
            </div>
          </div>
          
          {/* Settings Panel */}
          <SettingsPanel />
        </Editor>
      </div>
    </div>
  );
}