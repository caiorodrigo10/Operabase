import React from 'react';
import { useNode } from '@craftjs/core';

export type LandingCardProps = {
  background?: { r: number; g: number; b: number; a: number };
  padding?: number;
  margin?: string[];
  borderRadius?: number;
  shadow?: number;
  children?: React.ReactNode;
};

const defaultProps: LandingCardProps = {
  background: { r: 255, g: 255, b: 255, a: 1 },
  padding: 30,
  margin: ['10', '10', '10', '10'],
  borderRadius: 8,
  shadow: 2
};

export const LandingCard = (props: LandingCardProps) => {
  const finalProps = { ...defaultProps, ...props };
  const {
    connectors: { connect, drag }
  } = useNode();

  const {
    background,
    padding,
    margin,
    borderRadius,
    shadow,
    children
  } = finalProps;

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      style={{
        background: `rgba(${background.r}, ${background.g}, ${background.b}, ${background.a})`,
        padding: `${padding}px`,
        margin: `${margin[0]}px ${margin[1]}px ${margin[2]}px ${margin[3]}px`,
        borderRadius: `${borderRadius}px`,
        boxShadow: shadow > 0 ? `0 ${shadow}px ${shadow * 2}px rgba(0,0,0,0.1)` : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        position: 'relative',
        minWidth: '200px',
        flex: '1'
      }}
    >
      {children}
    </div>
  );
};

LandingCard.craft = {
  displayName: 'Card',
  props: defaultProps,
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true
  }
};