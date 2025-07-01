import React from 'react';
import { useNode } from '@craftjs/core';

export type ContainerProps = {
  background?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  minHeight?: string;
  children?: React.ReactNode;
  flexDirection?: 'row' | 'column';
  alignItems?: 'flex-start' | 'center' | 'flex-end';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  className?: string;
};

const defaultProps: ContainerProps = {
  background: '#ffffff',
  padding: '20px',
  margin: '0px',
  borderRadius: '0px',
  minHeight: 'auto',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  className: ''
};

export const Container = (props: ContainerProps) => {
  const finalProps = { ...defaultProps, ...props };
  const {
    connectors: { connect, drag }
  } = useNode();

  const {
    background,
    padding,
    margin,
    borderRadius,
    minHeight,
    flexDirection,
    alignItems,
    justifyContent,
    children,
    className
  } = finalProps;

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={`w-full ${className}`}
      style={{
        background,
        padding,
        margin,
        borderRadius,
        minHeight,
        display: 'flex',
        flexDirection,
        alignItems,
        justifyContent,
        position: 'relative'
      }}
    >
      {children}
    </div>
  );
};

Container.craft = {
  displayName: 'Container',
  props: defaultProps,
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true
  }
};