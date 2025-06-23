import React, { useState } from 'react';
import { useEditor2Store } from '../../../stores/editor2Store';

export const ControlsUI: React.FC = () => {
  const { currentPage, addBlock, addColumn } = useEditor2Store();
  const [showColumnOptions, setShowColumnOptions] = useState(false);

  // Get the currently selected block to show column count
  const getSelectedBlockInfo = () => {
    const selectedElement = currentPage.selectedElement;
    
    if (selectedElement.type === 'block') {
      const block = currentPage.blocks.find(b => b.id === selectedElement.id);
      return { count: block?.columns.length || 0, blockId: block?.id };
    }
    
    if (selectedElement.type === 'column') {
      const block = currentPage.blocks.find(b => 
        b.columns.some(c => c.id === selectedElement.id)
      );
      return { count: block?.columns.length || 0, blockId: block?.id };
    }
    
    return { count: 0, blockId: null };
  };

  const { count: columnCount, blockId } = getSelectedBlockInfo();

  const handleAddBlock = () => {
    addBlock();
  };

  const handleColumnOptionClick = (targetColumns: number) => {
    if (blockId && targetColumns > columnCount) {
      // Add columns to reach target
      for (let i = columnCount; i < targetColumns; i++) {
        addColumn(blockId);
      }
    }
    setShowColumnOptions(false);
  };

  return (
    <>


      {/* Add Block Button - Bottom Center */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
        <button
          onClick={handleAddBlock}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg transition-colors duration-200 flex items-center gap-2"
        >
          + Add Block
        </button>
      </div>

      {/* Overlay to close dropdown */}
      {showColumnOptions && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowColumnOptions(false)}
        />
      )}
    </>
  );
};