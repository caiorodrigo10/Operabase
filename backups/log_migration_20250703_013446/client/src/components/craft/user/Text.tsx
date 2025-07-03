import React from "react";
import { useNode } from "@craftjs/core";

interface TextProps {
  text?: string;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
}

export const Text: React.FC<TextProps> = ({ 
  text = "Clique para editar", 
  fontSize = 16, 
  textAlign = 'left',
  color = '#000000'
}) => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div ref={(ref: HTMLDivElement | null) => ref && connect(drag(ref))}>
      <p style={{ 
        fontSize: `${fontSize}px`, 
        textAlign, 
        color,
        margin: 0,
        padding: '8px 0'
      }}>
        {text}
      </p>
    </div>
  );
};

(Text as any).craft = {
  props: {
    text: "Clique para editar",
    fontSize: 16,
    textAlign: 'left',
    color: '#000000'
  },
  rules: {
    canDrag: (node: any) => node.data.props.text !== "Não mover"
  }
};