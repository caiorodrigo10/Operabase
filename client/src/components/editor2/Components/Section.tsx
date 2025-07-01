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
  // Section aplica background diretamente conforme Builder.io
  const sectionStyles = {
    backgroundColor,
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
    backgroundSize: backgroundImage ? 'cover' : undefined,
    backgroundPosition: backgroundImage ? 'center' : undefined,
    backgroundRepeat: backgroundImage ? 'no-repeat' : undefined,
    borderRadius,
    boxShadow,
    minHeight,
    width: '100%', // Section ocupa toda largura
    display: 'block',
    ...styles, // Aplicar estilos customizados por último
  };

  // Container interno apenas para centralizar conteúdo
  const containerStyles = {
    maxWidth,
    margin,
    padding,
    width: '100%',
    background: 'transparent' // Container transparente
  };

  // Aplicar estilos responsivos baseado no viewport
  const getResponsiveStyles = () => {
    if (typeof window === 'undefined') return {};
    
    const width = window.innerWidth;
    if (width >= 1024 && responsiveStyles.large) {
      return { ...combinedStyles, ...responsiveStyles.large };
    } else if (width >= 768 && responsiveStyles.medium) {
      return { ...combinedStyles, ...responsiveStyles.medium };
    } else if (width < 768 && responsiveStyles.small) {
      return { ...combinedStyles, ...responsiveStyles.small };
    }
    
    return combinedStyles;
  };

  const finalStyles = getResponsiveStyles();

  return (
    <section
      id={id}
      className={`editor2-section ${className}`.trim()}
      style={finalStyles}
      {...props}
    >
      <div className="section-content">
        {children}
      </div>
    </section>
  );
};

// Metadata para o Editor2
Section.displayName = 'Section';