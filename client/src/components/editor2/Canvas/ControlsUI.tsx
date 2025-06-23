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
      {/* Column Counter - Top Center */}
      {columnCount > 0 && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40">
          <div className="relative">
            {/* Main Column Counter */}
            <div className="flex rounded-full overflow-hidden shadow-lg">
              {/* Left side - Column count */}
              <div className="bg-blue-500 text-white px-4 py-2 text-sm font-medium flex items-center gap-2">
                <div className="w-6 h-6 bg-white text-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
                  {columnCount}
                </div>
                Column{columnCount !== 1 ? 's' : ''}
              </div>
              
              {/* Right side - Add button */}
              <button
                onClick={() => setShowColumnOptions(!showColumnOptions)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 transition-colors duration-200 flex items-center justify-center"
              >
                <span className="text-lg font-bold">+</span>
              </button>
            </div>

            {/* Column Options Dropdown */}
            {showColumnOptions && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80">
                <h3 className="text-gray-700 font-medium mb-3 text-center">Split the content into columns</h3>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleColumnOptionClick(num)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-200 ${
                        num === columnCount 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}
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