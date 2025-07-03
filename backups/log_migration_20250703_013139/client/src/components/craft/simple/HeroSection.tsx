import React from 'react';
import { useNode } from '@craftjs/core';

export type HeroSectionProps = {
  background?: { r: number; g: number; b: number; a: number };
  padding?: string[];
  margin?: string[];
  minHeight?: string;
  children?: React.ReactNode;
};

const defaultProps: HeroSectionProps = {
  background: { r: 37, g: 99, b: 235, a: 1 },
  padding: ['60', '40', '60', '40'],
  margin: ['0', '0', '0', '0'],
  minHeight: '300px'
};

export const HeroSection = (props: HeroSectionProps) => {
  const finalProps = { ...defaultProps, ...props };
  const {
    connectors: { connect, drag }
  } = useNode();

  const {
    background,
    padding,
    margin,
    minHeight,
    children
  } = finalProps;

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      style={{
        background: `rgba(${background.r}, ${background.g}, ${background.b}, ${background.a})`,
        padding: `${padding[0]}px ${padding[1]}px ${padding[2]}px ${padding[3]}px`,
        margin: `${margin[0]}px ${margin[1]}px ${margin[2]}px ${margin[3]}px`,
        minHeight,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        width: '100%',
        position: 'relative'
      }}
    >
      {children}
    </div>
  );
};

HeroSection.craft = {
  displayName: 'Hero Section',
  props: defaultProps,
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true
  }
};