/**
 * Container - Componente container com layout responsivo
 * Implementa regras visuais do Canvas Layout conforme Doc 7
 */

import React from 'react';

interface ContainerProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  responsiveStyles?: {
    large?: React.CSSProperties;
    medium?: React.CSSProperties;
    small?: React.CSSProperties;
  };
}

export const Container: React.FC<ContainerProps> = ({
  children,
  style = {},
  className = '',
  responsiveStyles
}) => {
  // Aplicar estilos responsivos baseado no tamanho da tela
  // Por enquanto, vamos usar os estilos large como padrão
  const defaultResponsiveStyles = responsiveStyles?.large || {};
  
  // Combinar estilos
  const combinedStyles: React.CSSProperties = {
    ...defaultResponsiveStyles,
    ...style
  };

  return (
    <div 
      className={`editor2-container ${className}`.trim()}
      style={combinedStyles}
    >
      {children}
    </div>
  );
};