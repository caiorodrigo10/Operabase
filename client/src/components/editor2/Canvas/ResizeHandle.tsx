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
  const { updateColumnWidth, startResize, stopResize, isResizing } = useEditor2Store();
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
      
      const container = containerRef.current.closest('.editor2-block-container');
      if (!container) return;
      
      const containerWidth = container.getBoundingClientRect().width;
      const deltaX = e.clientX - startX.current;
      const deltaPercent = (deltaX / containerWidth) * 100;
      
      let newWidth = startWidth.current + deltaPercent;
      newWidth = Math.max(5, Math.min(95, newWidth)); // Clamp between 5% and 95%
      
      updateColumnWidth(columnId, Math.round(newWidth));
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
  }, [columnId, currentWidth, startResize, stopResize, updateColumnWidth]);

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
      <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-blue-500 hover:bg-blue-600" />
      
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