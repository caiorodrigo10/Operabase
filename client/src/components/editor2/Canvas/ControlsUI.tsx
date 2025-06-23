import React from 'react';
import { useEditor2Store } from '../../../stores/editor2Store';

export const ControlsUI: React.FC = () => {
  const { currentPage, addBlock } = useEditor2Store();

  // Get the currently selected block to show column count
  const getSelectedBlockColumnCount = () => {
    const selectedElement = currentPage.selectedElement;
    
    if (selectedElement.type === 'block') {
      const block = currentPage.blocks.find(b => b.id === selectedElement.id);
      return block?.columns.length || 0;
    }
    
    if (selectedElement.type === 'column') {
      const block = currentPage.blocks.find(b => 
        b.columns.some(c => c.id === selectedElement.id)
      );
      return block?.columns.length || 0;
    }
    
    return 0;
  };

  const columnCount = getSelectedBlockColumnCount();

  const handleAddBlock = () => {
    addBlock();
  };

  return (
    <>
      {/* Column Counter - Top Right */}
      {columnCount > 0 && (
        <div className="fixed top-20 right-6 z-40">
          <div className="bg-gray-800 text-white px-3 py-1 rounded text-sm font-medium">
            {columnCount} Column{columnCount !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Add Block Button - Bottom Center */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
        <button
          onClick={handleAddBlock}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg transition-colors duration-200 flex items-center gap-2"
        >
          + Add Block
        </button>
      </div>
    </>
  );
};