import React, { useState, useRef, useEffect } from 'react';
import { useEditor2Store } from '../../../../stores/editor2Store';
import { TitleToolbar } from './TitleToolbar';

export interface TitleWidgetData {
  id: string;
  type: 'title';
  content: {
    text: string;
    level: 1 | 2 | 3 | 4 | 5 | 6;
  };
  style: {
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    color: string;
    textAlign: 'left' | 'center' | 'right' | 'justify';
    lineHeight: number;
    letterSpacing: number;
    textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    textDecoration: 'none' | 'underline' | 'line-through';
    backgroundColor: string;
  };
}

interface TitleWidgetProps {
  widget: TitleWidgetData;
  columnId: string;
  blockId: string;
}

export const TitleWidget: React.FC<TitleWidgetProps> = ({ widget, columnId, blockId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const elementRef = useRef<HTMLElement>(null);
  const { updateWidget, selectElement, currentPage } = useEditor2Store();

  const isSelected = currentPage.selectedElement.type === 'widget' && 
                    currentPage.selectedElement.id === widget.id;

  useEffect(() => {
    if (isSelected && elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      setToolbarPosition({
        top: rect.top - 50,
        left: rect.left
      });
    }
  }, [isSelected]);

  const handleClick = () => {
    selectElement('widget', widget.id);
    setIsEditing(true);
  };

  const handleTextChange = (newText: string) => {
    updateWidget(blockId, columnId, widget.id, {
      ...widget,
      content: { ...widget.content, text: newText }
    });
  };

  const handleStyleChange = (newStyle: Partial<TitleWidgetData['style']>) => {
    updateWidget(blockId, columnId, widget.id, {
      ...widget,
      style: { ...widget.style, ...newStyle }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setIsEditing(false), 100);
  };

  const getTitleTag = () => {
    const { level } = widget.content;
    return `h${level}` as keyof JSX.IntrinsicElements;
  };

  const getComputedStyle = (): React.CSSProperties => ({
    fontFamily: widget.style.fontFamily,
    fontSize: `${widget.style.fontSize}px`,
    fontWeight: widget.style.fontWeight,
    color: widget.style.color,
    textAlign: widget.style.textAlign,
    lineHeight: widget.style.lineHeight,
    letterSpacing: `${widget.style.letterSpacing}px`,
    textTransform: widget.style.textTransform,
    textDecoration: widget.style.textDecoration,
    backgroundColor: widget.style.backgroundColor,
    margin: 0,
    padding: '8px 12px',
    borderRadius: '4px',
    minHeight: '1.4em',
    outline: isSelected ? '2px solid #3b82f6' : 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });

  const TitleTag = getTitleTag();

  return (
    <>
      <TitleTag
        ref={elementRef as any}
        style={getComputedStyle()}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        contentEditable={isEditing}
        suppressContentEditableWarning={true}
        onInput={(e) => {
          if (isEditing) {
            handleTextChange(e.currentTarget.textContent || '');
          }
        }}
      >
        {widget.content.text}
      </TitleTag>

      {isSelected && (
        <TitleToolbar
          widget={widget}
          position={toolbarPosition}
          onStyleChange={handleStyleChange}
          onLevelChange={(level) => 
            updateWidget(blockId, columnId, widget.id, {
              ...widget,
              content: { ...widget.content, level }
            })
          }
          onClose={() => {
            setIsEditing(false);
            selectElement(null, null);
          }}
        />
      )}
    </>
  );
};