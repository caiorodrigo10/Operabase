import React from "react";
import { useNode } from "@craftjs/core";
import { Button as ShadcnButton } from "@/components/ui/button";

interface ButtonProps {
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  children?: string;
  backgroundColor?: string;
  textColor?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  size = 'default',
  variant = 'default', 
  children = "Clique aqui",
  backgroundColor,
  textColor
}) => {
  const { connectors: { connect, drag } } = useNode();

  const customStyle = {
    backgroundColor: backgroundColor || undefined,
    color: textColor || undefined,
    borderColor: backgroundColor || undefined
  };

  return (
    <div ref={(ref: HTMLDivElement | null) => ref && connect(drag(ref))} className="inline-block">
      <ShadcnButton 
        size={size} 
        variant={variant}
        style={customStyle}
      >
        {children}
      </ShadcnButton>
    </div>
  );
};

(Button as any).craft = {
  props: {
    size: 'default',
    variant: 'default',
    children: "Clique aqui",
    backgroundColor: '',
    textColor: ''
  },
  rules: {
    canDrag: () => true
  }
};