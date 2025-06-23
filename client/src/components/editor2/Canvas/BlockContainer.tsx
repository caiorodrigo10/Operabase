import React from 'react';
import { useEditor2Store, Block } from '../../../stores/editor2Store';
import { ColumnContainer } from './ColumnContainer';

interface BlockContainerProps {
  block: Block;
}

export const BlockContainer: React.FC<BlockContainerProps> = ({ block }) => {
  const { 
    currentPage, 
    hoveredElement,
    selectElement,
    setHoveredElement,
    addColumn
  } = useEditor2Store();

  const isSelected = currentPage.selectedElement.type === 'block' && 
                    currentPage.selectedElement.id === block.id;
  const isHovered = hoveredElement.type === 'block' && hoveredElement.id === block.id;

  // Check if any child column is selected or hovered
  const hasSelectedColumn = block.columns.some(col => 
    currentPage.selectedElement.type === 'column' && currentPage.selectedElement.id === col.id
  );
  const hasHoveredColumn = block.columns.some(col => 
    hoveredElement.type === 'column' && hoveredElement.id === col.id
  );

  const shouldShowUI = isSelected || isHovered || hasSelectedColumn || hasHoveredColumn;

  const handleClick = (e: React.MouseEvent) => {
    // Only select block if clicking on the block itself, not on columns
    if (e.target === e.currentTarget) {
      selectElement('block', block.id);
    }
  };

  const handleMouseEnter = () => {
    setHoveredElement('block', block.id);
  };

  const handleMouseLeave = () => {
    setHoveredElement(null, null);
  };

  const handleAddColumn = (e: React.MouseEvent) => {
    e.stopPropagation();
    addColumn(block.id);
  };

  return (
    <div
      className={`relative bg-white transition-all duration-200 ${
        shouldShowUI 
          ? 'shadow-lg border border-gray-200' 
          : ''
      }`}
      style={{
        padding: block.style.padding,
        margin: '0', // Remove side margins for full width
        backgroundColor: block.style.backgroundColor,
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Block Badge */}
      {shouldShowUI && (
        <div className="absolute top-2 left-2 bg-gray-800 text-white text-sm px-3 py-1 rounded-full z-30 transition-opacity duration-200">
          🔲 Block
        </div>
      )}

      {/* Add Column Button */}
      {shouldShowUI && (
        <div className="absolute top-2 right-2 z-30">
          <button
            onClick={handleAddColumn}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded-full transition-colors duration-200 flex items-center gap-1"
          >
            + Column
          </button>
        </div>
      )}

      {/* Columns Container */}
      <div className="flex min-h-[200px]">
        {block.columns.map((column, index) => (
          <ColumnContainer
            key={column.id}
            column={column}
            blockId={block.id}
            isLastColumn={index === block.columns.length - 1}
            isBlockHovered={isHovered}
            isBlockSelected={isSelected}
          />
        ))}
      </div>
    </div>
  );
};