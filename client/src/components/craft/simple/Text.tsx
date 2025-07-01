import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import ContentEditable from 'react-contenteditable';

export type TextProps = {
  text?: string;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  margin?: string;
  padding?: string;
  tag?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span';
};

const defaultProps: TextProps = {
  text: 'Text',
  fontSize: '16px',
  fontWeight: '400',
  color: '#333333',
  textAlign: 'left',
  margin: '0px',
  padding: '0px',
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
        fontSize,
        fontWeight,
        color,
        textAlign,
        margin,
        padding,
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