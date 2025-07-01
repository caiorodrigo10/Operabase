import React from 'react';
import { BlockComponentProps } from '../../../shared/editor2-types';

interface ColumnConfig {
  blocks: any[];
  width?: string;
  flex?: string;
}

interface ColumnsProps extends BlockComponentProps {
  columns?: ColumnConfig[];
  gutterSize?: number;
  stackColumnsAt?: 'tablet' | 'mobile' | 'never';
  reverseColumnsWhenStacked?: boolean;
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  renderBlock?: (block: any) => React.ReactNode;
}

export const Columns: React.FC<ColumnsProps> = ({
  id,
  children,
  className = '',
  responsiveStyles = {},
  styles = {},
  // Builder.io options
  columns = [],
  gutterSize = 32,
  stackColumnsAt = 'tablet',
  reverseColumnsWhenStacked = false,
  alignItems = 'stretch',
  justifyContent = 'flex-start',
  renderBlock,
  ...props
}) => {
  // Debug log para Columns com breakpoint detection
  const currentWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  console.log('📦 Columns component:', { 
    id, 
    columnsCount: columns.length,
    gutterSize,
    stackColumnsAt,
    windowWidth: currentWidth,
    isDesktop: currentWidth >= 992,
    shouldStack: (stackColumnsAt === 'tablet' && currentWidth <= 991) || (stackColumnsAt === 'mobile' && currentWidth <= 640),
    styles: Object.keys(styles || {}),
    hasColumns: columns.length > 0,
    firstColumnBlocks: columns[0]?.blocks?.length || 0
  });
  // Gerar classes CSS baseado nas configurações
  const getResponsiveClasses = () => {
    const classes = ['editor2-columns'];
    
    if (stackColumnsAt === 'tablet') {
      classes.push('columns-stack-tablet');
    } else if (stackColumnsAt === 'mobile') {
      classes.push('columns-stack-mobile');
    }
    
    if (reverseColumnsWhenStacked) {
      classes.push('columns-reverse-stacked');
    }
    
    return classes.join(' ');
  };

  // Função para calcular largura das colunas (Builder.io style)
  const getColumnWidth = (column: any) => {
    // Use a largura específica da coluna ou distribua igualmente
    return column.width ? `${column.width}%` : `${100 / columns.length}%`;
  };

  // Combinar estilos exatamente como Builder.io
  const combinedStyles = {
    display: 'flex',
    height: '100%',
    // NÃO usar gap - Builder.io usa margin-left
    alignItems,
    justifyContent,
    ...styles,
  };

  // ✅ Builder.io breakpoints: 992px+ desktop, 641-991px tablet, 321-640px mobile
  const getResponsiveStyles = () => {
    if (typeof window === 'undefined') return combinedStyles;
    
    const width = window.innerWidth;
    
    // Builder.io desktop breakpoint: 992px+
    if (width >= 992 && responsiveStyles.large) {
      return { ...combinedStyles, ...responsiveStyles.large };
    } 
    // Builder.io tablet breakpoint: 641-991px
    else if (width >= 641 && width <= 991 && responsiveStyles.medium) {
      return { ...combinedStyles, ...responsiveStyles.medium };
    } 
    // Builder.io mobile breakpoint: <641px
    else if (width < 641 && responsiveStyles.small) {
      return { ...combinedStyles, ...responsiveStyles.small };
    }
    
    return combinedStyles;
  };

  const finalStyles = getResponsiveStyles();

  // Debug para identificar problema com blocos null
  if (columns.length > 0) {
    console.log('🏗️ Columns component received:', { id, columns: columns.length, firstColumn: columns[0] });
  }

  return (
    <div
      id={id}
      className={`${getResponsiveClasses()} ${className}`.trim()}
      style={finalStyles}
      {...props}
    >
      {columns.map((column, index) => {
        const columnStyles = {
          flex: `0 0 ${getColumnWidth(column)}`,
          marginLeft: index === 0 ? 0 : `${gutterSize}px`,
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'stretch'
        };

        return (
          <div
            key={index}
            className="builder-column"
            style={columnStyles}
          >
            {column.blocks.map((block, blockIndex) => {
              // Debug para detectar blocos null
              if (!block) {
                console.warn('❌ Columns: block is null at index', blockIndex, 'in column', index);
                return null;
              }
              
              // Verificar se o bloco tem a estrutura correta
              if (!block.component) {
                console.warn('❌ Columns: Invalid block in column:', block);
                return null;
              }

              console.log('🔄 Columns rendering block:', block.id, 'component:', block.component.name);
              
              // Usar renderBlock passado como prop ou fallback simples
              if (renderBlock) {
                return renderBlock(block);
              }
              
              // Fallback: renderização simples sem RenderBlock
              return (
                <div key={block.id || `${index}-${blockIndex}`}>
                  Component: {block.component.name}
                </div>
              );
            })}
          </div>
        );
      })}
      
      {/* Fallback para children (compatibilidade) */}
      {!columns.length && children}
    </div>
  );
};

// Metadata para o Editor2
Columns.displayName = 'Columns';