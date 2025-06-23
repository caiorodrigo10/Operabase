import React, { useEffect } from 'react';
import { useEditor2Store } from '../../../stores/editor2Store';
import { BlockContainer } from './BlockContainer';
import { ControlsUI } from './ControlsUI';

export const CanvasContainer: React.FC = () => {
  const { currentPage, initializeDefaultPage, deselectAll } = useEditor2Store();

  // Initialize default page on mount if empty
  useEffect(() => {
    initializeDefaultPage();
  }, [initializeDefaultPage]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only deselect if clicking on the canvas itself, not on child elements
    if (e.target === e.currentTarget) {
      deselectAll();
    }
  };

  return (
    <div className="relative w-full h-full overflow-auto">
      {/* Canvas Background */}
      <div 
        className="min-h-full bg-gray-50 p-6"
        onClick={handleCanvasClick}
        style={{ backgroundColor: '#f8f9fa' }}
      >
        {/* Blocks Container */}
        <div className="max-w-full mx-auto">
          {currentPage.blocks.map((block) => (
            <BlockContainer key={block.id} block={block} />
          ))}
          
          {/* Empty State */}
          {currentPage.blocks.length === 0 && (
            <div className="flex items-center justify-center min-h-[400px] text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-lg font-medium mb-2">Start Building Your Page</h3>
                <p className="text-sm">Click "Add Block" to begin creating your layout</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed UI Controls */}
      <ControlsUI />
    </div>
  );
};