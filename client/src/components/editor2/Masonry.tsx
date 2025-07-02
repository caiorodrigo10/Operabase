/**
 * Masonry Widget - Layout Pinterest-style
 * Baseado na arquitetura Builder.io com grid masonry responsivo
 */

import React from 'react';
import { RenderBlock } from './Canvas/RenderBlock';

interface MasonryProps {
  id: string;
  columns?: number;
  columnGap?: number;
  rowGap?: number;
  breakpoints?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  children?: any[];
  responsiveStyles?: any;
}

export function Masonry({
  id,
  columns = 3,
  columnGap = 20,
  rowGap = 20,
  breakpoints = {
    mobile: 1,
    tablet: 2,
    desktop: 3
  },
  children = [],
  responsiveStyles = {}
}: MasonryProps) {
  
  // Gera estilos CSS Grid (removendo masonry para compatibilidade)
  const baseStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${rowGap}px ${columnGap}px`,
    width: '100%',
    gridAutoRows: 'min-content', // Permite altura automática dos items
    alignItems: 'start' // Alinha items no topo para efeito masonry simples
  };

  // CSS responsivo para breakpoints
  const responsiveCSS = `
    .builder-masonry-${id} {
      display: grid;
      width: 100%;
      gap: ${rowGap}px ${columnGap}px;
    }
    
    /* Desktop */
    @media (min-width: 1024px) {
      .builder-masonry-${id} {
        grid-template-columns: repeat(${breakpoints.desktop}, 1fr);
      }
    }
    
    /* Tablet */
    @media (max-width: 1023px) and (min-width: 768px) {
      .builder-masonry-${id} {
        grid-template-columns: repeat(${breakpoints.tablet}, 1fr);
      }
    }
    
    /* Mobile */
    @media (max-width: 767px) {
      .builder-masonry-${id} {
        grid-template-columns: repeat(${breakpoints.mobile}, 1fr);
      }
    }
    
    /* Masonry item styling */
    .builder-masonry-${id} > * {
      break-inside: avoid;
      display: inline-block;
      width: 100%;
    }
  `;

  // Aplica responsiveStyles se existirem
  const responsiveStylesForBreakpoint = responsiveStyles?.large || {};
  const finalStyles = { ...baseStyles, ...responsiveStylesForBreakpoint };

  console.log('🧱 Masonry component:', {
    id,
    columns,
    columnGap,
    rowGap,
    breakpoints,
    childrenCount: children?.length || 0,
    stylesApplied: finalStyles
  });

  return (
    <>
      {/* Inject responsive CSS */}
      <style dangerouslySetInnerHTML={{ __html: responsiveCSS }} />
      
      <div 
        id={id}
        className={`builder-masonry builder-masonry-${id}`}
        style={finalStyles}
      >
        {children?.map((child, index) => (
          <div key={child.id || `masonry-item-${index}`} className="masonry-item">
            <RenderBlock block={child} />
          </div>
        ))}
      </div>
    </>
  );
}

// Registrar propriedades para Builder.io compatibility
Masonry.builderOptions = {
  name: 'Masonry',
  inputs: [
    {
      name: 'columns',
      type: 'number',
      defaultValue: 3,
      helperText: 'Número de colunas no desktop'
    },
    {
      name: 'columnGap',
      type: 'number',
      defaultValue: 20,
      helperText: 'Espaçamento horizontal entre colunas em pixels'
    },
    {
      name: 'rowGap',
      type: 'number',
      defaultValue: 20,
      helperText: 'Espaçamento vertical entre linhas em pixels'
    },
    {
      name: 'breakpoints',
      type: 'object',
      defaultValue: {
        mobile: 1,
        tablet: 2,
        desktop: 3
      },
      helperText: 'Configuração responsiva de colunas por dispositivo'
    }
  ],
  defaultChildren: [
    {
      '@type': '@builder.io/sdk:Element',
      component: {
        name: 'Text',
        options: {
          text: 'Masonry Item 1 - Texto curto'
        }
      }
    },
    {
      '@type': '@builder.io/sdk:Element',
      component: {
        name: 'Text',
        options: {
          text: 'Masonry Item 2 - Texto mais longo que demonstra como o layout masonry organiza elementos de diferentes alturas de forma automática e fluida.'
        }
      }
    },
    {
      '@type': '@builder.io/sdk:Element',
      component: {
        name: 'Text',
        options: {
          text: 'Item 3'
        }
      }
    }
  ]
};