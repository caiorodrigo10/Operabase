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
  width?: string;
  height?: string;
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
  width: '100%',
  height: 'auto',
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
    width,
    height,
    children,
    className
  } = finalProps;

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={className}
      style={{
        backgroundColor: background,
        padding,
        margin,
        borderRadius,
        minHeight,
        width,
        height,
        display: 'flex',
        flexDirection,
        alignItems,
        justifyContent,
        position: 'relative',
        boxSizing: 'border-box'
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