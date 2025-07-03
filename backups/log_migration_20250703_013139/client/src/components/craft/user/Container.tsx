import React from "react";
import { useNode } from "@craftjs/core";

interface ContainerProps {
  background?: string;
  padding?: number;
  children?: React.ReactNode;
}

export const Container: React.FC<ContainerProps> = ({ 
  background = '#ffffff', 
  padding = 20, 
  children 
}) => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div 
      ref={(ref: HTMLDivElement | null) => ref && connect(drag(ref))}
      style={{
        margin: "5px 0", 
        background, 
        padding: `${padding}px`,
        border: "1px solid #e2e8f0",
        borderRadius: "6px",
        minHeight: "40px"
      }}
    >
      {children}
    </div>
  );
};

(Container as any).craft = {
  props: {
    background: '#ffffff',
    padding: 20
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true
  }
};