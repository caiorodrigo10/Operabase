import React from 'react';
import { useNode } from '@craftjs/core';

export type ButtonProps = {
  text?: string;
  backgroundColor?: string;
  color?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  fontSize?: string;
  fontWeight?: string;
  border?: string;
  cursor?: string;
  width?: string;
  textAlign?: 'left' | 'center' | 'right';
  href?: string;
  target?: '_blank' | '_self';
};

const defaultProps: ButtonProps = {
  text: 'Button',
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  padding: '12px 24px',
  margin: '8px 0px',
  borderRadius: '6px',
  fontSize: '16px',
  fontWeight: '500',
  border: 'none',
  cursor: 'pointer',
  width: 'auto',
  textAlign: 'center',
  href: '#',
  target: '_self'
};

export const Button = (props: ButtonProps) => {
  const finalProps = { ...defaultProps, ...props };
  const {
    connectors: { connect, drag }
  } = useNode();

  const {
    text,
    backgroundColor,
    color,
    padding,
    margin,
    borderRadius,
    fontSize,
    fontWeight,
    border,
    cursor,
    width,
    textAlign,
    href,
    target
  } = finalProps;

  const buttonStyle = {
    backgroundColor,
    color,
    padding,
    margin,
    borderRadius,
    fontSize,
    fontWeight,
    border,
    cursor,
    width,
    textAlign,
    textDecoration: 'none',
    display: 'inline-block',
    transition: 'all 0.2s ease',
    outline: 'none'
  };

  // For V1, we'll render as a div to avoid link functionality in editor
  return (
    <div
      ref={(ref) => connect(drag(ref))}
      style={buttonStyle}
      className="hover:opacity-90 select-none"
    >
      {text}
    </div>
  );
};

Button.craft = {
  displayName: 'Button',
  props: defaultProps,
  rules: {
    canDrag: () => true,
    canDrop: () => false,
    canMoveIn: () => false,
    canMoveOut: () => true
  }
};