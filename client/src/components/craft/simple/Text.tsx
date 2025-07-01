import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import ContentEditable from 'react-contenteditable';

export type TextProps = {
  text?: string;
  fontSize?: string;
  fontWeight?: string;
  color?: { r: number; g: number; b: number; a: number };
  textAlign?: 'left' | 'center' | 'right';
  margin?: string[];
  padding?: string[];
  shadow?: number;
  tag?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span';
};

const defaultProps: TextProps = {
  text: 'Text',
  fontSize: '16',
  fontWeight: '400',
  color: { r: 51, g: 51, b: 51, a: 1 },
  textAlign: 'left',
  margin: ['0', '0', '0', '0'],
  padding: ['0', '0', '0', '0'],
  shadow: 0,
  tag: 'p'
};

export const Text = (props: TextProps) => {
  const finalProps = { ...defaultProps, ...props };
  const {
    connectors: { connect, drag },
    setProp
  } = useNode();
  
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled
  }));

  const {
    text,
    fontSize,
    fontWeight,
    color,
    textAlign,
    margin,
    padding,
    shadow,
    tag
  } = finalProps;

  return (
    <ContentEditable
      innerRef={(ref) => connect(drag(ref))}
      html={text || ''}
      disabled={!enabled}
      onChange={(e) => {
        setProp((props: TextProps) => (props.text = e.target.value), 500);
      }}
      tagName={tag}
      style={{
        fontSize: `${fontSize}px`,
        fontWeight,
        color: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
        textAlign,
        margin: `${margin[0]}px ${margin[1]}px ${margin[2]}px ${margin[3]}px`,
        padding: `${padding[0]}px ${padding[1]}px ${padding[2]}px ${padding[3]}px`,
        textShadow: shadow > 0 ? `0 2px ${shadow}px rgba(0,0,0,0.1)` : 'none',
        outline: 'none',
        width: '100%',
        cursor: enabled ? 'text' : 'default'
      }}
    />
  );
};

Text.craft = {
  displayName: 'Text',
  props: defaultProps,
  rules: {
    canDrag: () => true,
    canDrop: () => false,
    canMoveIn: () => false,
    canMoveOut: () => true
  }
};