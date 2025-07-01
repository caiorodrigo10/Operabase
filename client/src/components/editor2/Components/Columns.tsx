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
  // Debug log para Columns
  console.log('📦 Columns component:', { 
    id, 
    columnsCount: columns.length,
    gutterSize,
    stackColumnsAt,
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
  const getColumnWidth = (index: number) => {
    const width = 100 / columns.length;
    const subtractWidth = gutterSize * (columns.length - 1) * (width / 100);
    return `calc(${width}% - ${subtractWidth}px)`;
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

  // Aplicar estilos responsivos
  const getResponsiveStyles = () => {
    if (typeof window === 'undefined') return combinedStyles;
    
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
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'stretch',
          width: getColumnWidth(index),
          marginLeft: index === 0 ? 0 : gutterSize,
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