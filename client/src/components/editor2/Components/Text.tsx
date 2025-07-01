/**
 * Text - Componente base para texto
 * Renderiza texto simples com suporte a estilos
 */

import React from 'react';

interface TextProps {
  text?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const Text: React.FC<TextProps> = ({
  text = 'Texto padrão',
  children,
  style,
  className = ''
}) => {
  return (
    <p 
      className={`text-base text-gray-700 ${className}`.trim()}
      style={style}
    >
      {children || text}
    </p>
  );
};