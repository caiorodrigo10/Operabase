import React, { useState } from 'react';
import { Bold, Underline, Type, Palette, AlignLeft, AlignCenter, AlignRight, AlignJustify, Link, Upload, Sparkles } from 'lucide-react';
import { TitleWidgetData } from './TitleWidget';
import { FontSelector } from './FontSelector';
import { ColorPicker } from './ColorPicker';
import { AlignmentPicker } from './AlignmentPicker';

interface TitleToolbarProps {
  widget: TitleWidgetData;
  position: { top: number; left: number };
  onStyleChange: (style: Partial<TitleWidgetData['style']>) => void;
  onLevelChange: (level: 1 | 2 | 3 | 4 | 5 | 6) => void;
  onClose: () => void;
}

export const TitleToolbar: React.FC<TitleToolbarProps> = ({
  widget,
  position,
  onStyleChange,
  onLevelChange,
  onClose
}) => {
  const [showFontSelector, setShowFontSelector] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showAlignmentPicker, setShowAlignmentPicker] = useState(false);
  const [showHeaderSelector, setShowHeaderSelector] = useState(false);

  const handleBoldToggle = () => {
    onStyleChange({
      fontWeight: widget.style.fontWeight === 'bold' ? 'normal' : 'bold'
    });
  };

  const handleUnderlineToggle = () => {
    onStyleChange({
      textDecoration: widget.style.textDecoration === 'underline' ? 'none' : 'underline'
    });
  };

  const handleTextTransformToggle = () => {
    const transforms: Array<TitleWidgetData['style']['textTransform']> = 
      ['none', 'uppercase', 'lowercase', 'capitalize'];
    const currentIndex = transforms.indexOf(widget.style.textTransform);
    const nextIndex = (currentIndex + 1) % transforms.length;
    onStyleChange({ textTransform: transforms[nextIndex] });
  };

  const headerLevels = [
    { level: 1, label: 'Header 1', size: '32px' },
    { level: 2, label: 'Header 2', size: '28px' },
    { level: 3, label: 'Header 3', size: '24px' },
    { level: 4, label: 'Header 4', size: '20px' },
    { level: 5, label: 'Header 5', size: '18px' },
    { level: 6, label: 'Header 6', size: '16px' },
  ] as const;

  return (
    <div 
      className="title-toolbar"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 1000,
        transform: 'translateY(-100%)',
      }}
    >
      <div className="title-toolbar-content">
        {/* Magic Wand - AI Suggestions */}
        <button className="toolbar-button" title="AI Suggestions">
          <Sparkles size={16} />
        </button>

        {/* Bold */}
        <button 
          className={`toolbar-button ${widget.style.fontWeight === 'bold' ? 'active' : ''}`}
          onClick={handleBoldToggle}
          title="Bold"
        >
          <Bold size={16} />
        </button>

        {/* Underline */}
        <button 
          className={`toolbar-button ${widget.style.textDecoration === 'underline' ? 'active' : ''}`}
          onClick={handleUnderlineToggle}
          title="Underline"
        >
          <Underline size={16} />
        </button>

        {/* Font Family */}
        <div className="toolbar-dropdown">
          <button 
            className="toolbar-button dropdown-trigger"
            onClick={() => setShowFontSelector(!showFontSelector)}
            title="Font Family"
          >
            <span className="font-name">{widget.style.fontFamily}</span>
            <span className="dropdown-arrow">▼</span>
          </button>
          {showFontSelector && (
            <FontSelector
              currentFont={widget.style.fontFamily}
              onFontChange={(fontFamily) => {
                onStyleChange({ fontFamily });
                setShowFontSelector(false);
              }}
              onClose={() => setShowFontSelector(false)}
            />
          )}
        </div>

        {/* Font Size */}
        <div className="toolbar-dropdown">
          <button 
            className="toolbar-button dropdown-trigger"
            onClick={() => setShowHeaderSelector(!showHeaderSelector)}
            title="Header Level"
          >
            <span className="font-size">{widget.style.fontSize}</span>
            <span className="dropdown-arrow">▼</span>
          </button>
          {showHeaderSelector && (
            <div className="dropdown-menu header-selector">
              {headerLevels.map(({ level, label, size }) => (
                <button
                  key={level}
                  className={`dropdown-item ${widget.content.level === level ? 'active' : ''}`}
                  onClick={() => {
                    onLevelChange(level);
                    onStyleChange({ fontSize: parseInt(size) });
                    setShowHeaderSelector(false);
                  }}
                  style={{ fontSize: size, fontWeight: level <= 2 ? 'bold' : 'normal' }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text Transform */}
        <button 
          className="toolbar-button"
          onClick={handleTextTransformToggle}
          title="Text Transform"
        >
          <Type size={16} />
          <span className="transform-indicator">
            {widget.style.textTransform === 'uppercase' ? 'AA' : 
             widget.style.textTransform === 'lowercase' ? 'aa' : 
             widget.style.textTransform === 'capitalize' ? 'Aa' : 'A'}
          </span>
        </button>

        {/* Text Color */}
        <div className="toolbar-dropdown">
          <button 
            className="toolbar-button color-button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Text Color"
          >
            <span className="color-icon" style={{ color: widget.style.color }}>A</span>
            <div className="color-bar" style={{ backgroundColor: widget.style.color }}></div>
          </button>
          {showColorPicker && (
            <ColorPicker
              currentColor={widget.style.color}
              onColorChange={(color) => {
                onStyleChange({ color });
                setShowColorPicker(false);
              }}
              onClose={() => setShowColorPicker(false)}
            />
          )}
        </div>

        {/* Background Color */}
        <div className="toolbar-dropdown">
          <button 
            className="toolbar-button color-button"
            onClick={() => setShowBgColorPicker(!showBgColorPicker)}
            title="Background Color"
          >
            <span className="color-icon" style={{ color: widget.style.backgroundColor }}>A</span>
            <div className="color-bar" style={{ backgroundColor: widget.style.backgroundColor || 'transparent' }}></div>
          </button>
          {showBgColorPicker && (
            <ColorPicker
              currentColor={widget.style.backgroundColor || '#ffffff'}
              onColorChange={(backgroundColor) => {
                onStyleChange({ backgroundColor });
                setShowBgColorPicker(false);
              }}
              onClose={() => setShowBgColorPicker(false)}
            />
          )}
        </div>

        {/* Text Alignment */}
        <div className="toolbar-dropdown">
          <button 
            className="toolbar-button"
            onClick={() => setShowAlignmentPicker(!showAlignmentPicker)}
            title="Text Alignment"
          >
            {widget.style.textAlign === 'left' && <AlignLeft size={16} />}
            {widget.style.textAlign === 'center' && <AlignCenter size={16} />}
            {widget.style.textAlign === 'right' && <AlignRight size={16} />}
            {widget.style.textAlign === 'justify' && <AlignJustify size={16} />}
            <span className="dropdown-arrow">▼</span>
          </button>
          {showAlignmentPicker && (
            <AlignmentPicker
              currentAlignment={widget.style.textAlign}
              onAlignmentChange={(textAlign) => {
                onStyleChange({ textAlign });
                setShowAlignmentPicker(false);
              }}
              onClose={() => setShowAlignmentPicker(false)}
            />
          )}
        </div>

        {/* Link */}
        <button className="toolbar-button" title="Add Link">
          <Link size={16} />
        </button>

        {/* Upload */}
        <button className="toolbar-button" title="Upload Asset">
          <Upload size={16} />
        </button>

        {/* AI Assistant */}
        <button className="toolbar-button ai-button" title="AI Assistant">
          <div className="ai-icon">
            <span>AI</span>
          </div>
        </button>
      </div>
    </div>
  );
};