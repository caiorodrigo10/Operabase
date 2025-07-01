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

// Função para aplicar estilos responsivos baseado na largura da janela
function getResponsiveStyles(responsiveStyles?: ContainerProps['responsiveStyles']): React.CSSProperties {
  if (!responsiveStyles) return {};
  
  // Por enquanto, usar lógica simples baseada em window.innerWidth
  // TODO: Implementar sistema de breakpoints mais robusto
  const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
  
  if (width >= 1024) {
    // Desktop (large)
    return responsiveStyles.large || {};
  } else if (width >= 768) {
    // Tablet (medium)
    return responsiveStyles.medium || responsiveStyles.large || {};
  } else {
    // Mobile (small)
    return responsiveStyles.small || responsiveStyles.medium || responsiveStyles.large || {};
  }
}

export const Container: React.FC<ContainerProps> = ({
  children,
  style = {},
  className = '',
  responsiveStyles
}) => {
  // Aplicar estilos responsivos inteligentes
  const responsiveStylesApplied = getResponsiveStyles(responsiveStyles);
  
  // Combinar estilos: responsivos + props style
  const combinedStyles: React.CSSProperties = {
    ...responsiveStylesApplied,
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