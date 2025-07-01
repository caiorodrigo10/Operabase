import React from 'react';
import { BlockComponentProps } from '../../../shared/editor2-types';

interface SectionProps extends BlockComponentProps {
  padding?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  maxWidth?: string;
  margin?: string;
  borderRadius?: string;
  boxShadow?: string;
  minHeight?: string;
}

export const Section: React.FC<SectionProps> = ({
  id,
  children,
  className = '',
  responsiveStyles = {},
  styles = {},
  // Section-specific props
  padding = '40px 0',
  backgroundColor,
  backgroundImage,
  maxWidth = '1200px',
  margin = '0 auto',
  borderRadius,
  boxShadow,
  minHeight,
  ...props
}) => {
  // Debug logs para Section
  console.log('🎨 Section component:', { 
    id, 
    backgroundColor, 
    padding, 
    styles: Object.keys(styles || {}),
    responsiveStyles: Object.keys(responsiveStyles || {})
  });
  // Calcular estilos responsivos (Builder.io style)
  const calculateResponsiveStyles = () => {
    if (!responsiveStyles) return {};
    
    const getCurrentBreakpoint = () => {
      if (typeof window === 'undefined') return 'large';
      const width = window.innerWidth;
      if (width >= 1024) return 'large';
      if (width >= 768) return 'medium';
      return 'small';
    };
    
    const currentBreakpoint = getCurrentBreakpoint();
    
    return {
      ...responsiveStyles.large,
      ...(currentBreakpoint === 'medium' ? responsiveStyles.medium : {}),
      ...(currentBreakpoint === 'small' ? responsiveStyles.small : {})
    };
  };

  // Section aplica background diretamente conforme Builder.io 
  const sectionStyles = {
    // Propriedades básicas
    width: '100%', // Section ocupa toda largura
    borderRadius,
    boxShadow,
    minHeight,
    // Background
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
    backgroundSize: backgroundImage ? 'cover' : undefined,
    backgroundPosition: backgroundImage ? 'center' : undefined,
    backgroundRepeat: backgroundImage ? 'no-repeat' : undefined,
    // Props padrão
    backgroundColor,
    padding,
    margin,
    maxWidth,
    // Sobrescrever com styles e responsiveStyles
    ...styles,
    ...calculateResponsiveStyles()
  };

  // Container interno apenas para centralizar conteúdo conforme Builder.io
  const containerStyles = {
    maxWidth,
    margin,
    width: '100%',
    background: 'transparent' // Container transparente - não aplica padding
  };

  // Aplicar estilos responsivos para Section
  const getResponsiveSectionStyles = () => {
    if (typeof window === 'undefined') return sectionStyles;
    
    const width = window.innerWidth;
    if (width >= 1024 && responsiveStyles.large) {
      return { ...sectionStyles, ...responsiveStyles.large };
    } else if (width >= 768 && responsiveStyles.medium) {
      return { ...sectionStyles, ...responsiveStyles.medium };
    } else if (width < 768 && responsiveStyles.small) {
      return { ...sectionStyles, ...responsiveStyles.small };
    }
    
    return sectionStyles;
  };

  const finalSectionStyles = getResponsiveSectionStyles();

  return (
    <section
      id={id}
      className={`editor2-section ${className}`.trim()}
      style={finalSectionStyles}
      {...props}
    >
      {/* Container interno transparente para centralizar conteúdo */}
      <div style={containerStyles}>
        {children}
      </div>
    </section>
  );
};

// Metadata para o Editor2
Section.displayName = 'Section';