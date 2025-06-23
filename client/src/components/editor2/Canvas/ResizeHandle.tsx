import React, { useState, useRef, useCallback } from 'react';
import { useEditor2Store } from '../../../stores/editor2Store';

interface ResizeHandleProps {
  columnId: string;
  blockId: string;
  currentWidth: number;
  isVisible: boolean;
  isSelected: boolean;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  columnId,
  blockId,
  currentWidth,
  isVisible,
  isSelected,
}) => {
  const { updateColumnWidth, updateColumnWidths, startResize, stopResize, isResizing } = useEditor2Store();
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setShowTooltip(true);
    startResize(columnId);
    
    startX.current = e.clientX;
    startWidth.current = currentWidth;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      // Find the block container by looking for the flex container with columns
      const blockContainer = containerRef.current.closest('[data-block-id]') || 
                            containerRef.current.closest('.flex.min-h-\\[200px\\]')?.parentElement;
      
      if (!blockContainer) {
        console.warn('Block container not found for resize');
        return;
      }
      
      const containerWidth = blockContainer.getBoundingClientRect().width;
      const deltaX = e.clientX - startX.current;
      const deltaPercent = (deltaX / containerWidth) * 100;
      
      let newWidth = startWidth.current + deltaPercent;
      newWidth = Math.max(10, Math.min(90, newWidth)); // Clamp between 10% and 90%
      
      console.log('Resizing column:', {
        columnId,
        blockId,
        oldWidth: startWidth.current,
        newWidth: Math.round(newWidth),
        deltaX,
        deltaPercent,
        containerWidth
      });
      
      updateColumnWidths(blockId, columnId, Math.round(newWidth));
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setShowTooltip(false);
      stopResize();
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [columnId, blockId, currentWidth, startResize, stopResize, updateColumnWidths]);

  const shouldShow = isVisible || isSelected || isDragging || isResizing;

  return (
    <div
      ref={containerRef}
      className={`absolute top-0 right-0 bottom-0 w-2 cursor-col-resize z-10 transition-opacity duration-200 ${
        shouldShow ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => !isDragging && setShowTooltip(false)}
    >
      {/* Resize Handle Line */}
      <div className={`absolute right-0 top-0 bottom-0 w-0.5 transition-all duration-200 ${
        isDragging 
          ? 'bg-blue-600 w-1' 
          : showTooltip 
          ? 'bg-blue-500 w-0.5' 
          : 'bg-blue-400 w-0.5'
      }`} />
      
      {/* Visual Drag Indicator */}
      {(showTooltip || isDragging) && (
        <div className="absolute right-0.5 top-1/2 transform -translate-y-1/2 -translate-x-1/2">
          <div className="flex flex-col gap-0.5">
            <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
            <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
            <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
          </div>
        </div>
      )}
      
      {/* Hover Area */}
      <div className="absolute -right-1 -left-1 top-0 bottom-0" />
      
      {/* Width Tooltip */}
      {(showTooltip || isDragging) && (
        <div className="absolute -top-8 right-0 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20">
          ↔ {Math.round(currentWidth)}%
        </div>
      )}
    </div>
  );
};