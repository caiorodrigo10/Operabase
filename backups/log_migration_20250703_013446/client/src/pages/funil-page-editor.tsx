import React from 'react';
import { Editor, Frame, Element } from '@craftjs/core';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Save } from 'lucide-react';
import { Link } from 'wouter';

// Simple Text Component
const Text = ({ text, fontSize = 16, fontWeight = 400, textAlign = 'left', color = '#000000' }: any) => {
  return (
    <div
      style={{
        fontSize: `${fontSize}px`,
        fontWeight,
        textAlign: textAlign as any,
        color,
        padding: '8px',
        minHeight: '20px',
        cursor: 'text'
      }}
      contentEditable
      suppressContentEditableWarning={true}
    >
      {text}
    </div>
  );
};

Text.craft = {
  displayName: 'Text',
  props: {
    text: 'Edit this text',
    fontSize: 16,
    fontWeight: 400,
    textAlign: 'left',
    color: '#000000'
  },
  related: {
    toolbar: () => (
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Font Size</label>
          <input
            type="range"
            min="12"
            max="48"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Text Align</label>
          <select className="w-full p-2 border rounded">
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>
    )
  }
};

// Simple Container Component
const Container = ({ children, backgroundColor = '#ffffff', padding = 20, margin = 0 }: any) => {
  return (
    <div
      style={{
        backgroundColor,
        padding: `${padding}px`,
        margin: `${margin}px`,
        minHeight: '50px',
        border: '1px dashed #ccc'
      }}
    >
      {children}
    </div>
  );
};

Container.craft = {
  displayName: 'Container',
  props: {
    backgroundColor: '#ffffff',
    padding: 20,
    margin: 0
  },
  rules: {
    canDrag: () => true,
  },
  related: {
    toolbar: () => (
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Background Color</label>
          <input
            type="color"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Padding</label>
          <input
            type="range"
            min="0"
            max="50"
            className="w-full"
          />
        </div>
      </div>
    )
  }
};

// Simple Button Component
const CraftButton = ({ text = 'Click me', backgroundColor = '#3b82f6', textColor = '#ffffff' }) => {
  return (
    <button
      style={{
        backgroundColor,
        color: textColor,
        padding: '12px 24px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '500'
      }}
    >
      {text}
    </button>
  );
};

CraftButton.craft = {
  displayName: 'Button',
  props: {
    text: 'Click me',
    backgroundColor: '#3b82f6',
    textColor: '#ffffff'
  },
  related: {
    toolbar: () => (
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Button Text</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="Button text"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Background Color</label>
          <input
            type="color"
            className="w-full"
          />
        </div>
      </div>
    )
  }
};

// Toolbox Component (inside Editor context)
const Toolbox = () => {
  return (
    <div className="w-80 bg-white border-r border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-4">Elementos</h3>
      <div className="space-y-2">
        <div
          className="p-3 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', 'Text');
          }}
        >
          <div className="font-medium">Texto</div>
          <div className="text-sm text-gray-500">Adicionar texto editável</div>
        </div>
        
        <div
          className="p-3 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', 'Container');
          }}
        >
          <div className="font-medium">Container</div>
          <div className="text-sm text-gray-500">Adicionar container</div>
        </div>
        
        <div
          className="p-3 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', 'CraftButton');
          }}
        >
          <div className="font-medium">Botão</div>
          <div className="text-sm text-gray-500">Adicionar botão clicável</div>
        </div>
      </div>
    </div>
  );
};

// Settings Panel Component (inside Editor context)
const SettingsPanel = () => {
  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-4">Propriedades</h3>
      <div className="text-sm text-gray-500">
        Selecione um elemento para editar suas propriedades
      </div>
    </div>
  );
};

// Main Editor Component
export default function FunilPageEditor() {
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
            <h1 className="text-xl font-semibold">Editor de Página</h1>
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
            Text,
            Container,
            CraftButton
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
                  is={Container}
                  backgroundColor="#ffffff"
                  padding={40}
                >
                  <Text text="Bem-vindo ao Editor de Funis" fontSize={32} fontWeight={700} textAlign="center" />
                  <Text text="Clique em qualquer texto para editá-lo. Arraste elementos da barra lateral para adicionar novos componentes." fontSize={16} textAlign="center" />
                  
                  <Element
                    canvas
                    is={Container}
                    backgroundColor="#f8fafc"
                    padding={30}
                    margin={20}
                  >
                    <Text text="Container Aninhado" fontSize={24} fontWeight={600} />
                    <Text text="Este é um exemplo de container dentro de outro container." fontSize={14} />
                    <CraftButton text="Botão de Exemplo" />
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