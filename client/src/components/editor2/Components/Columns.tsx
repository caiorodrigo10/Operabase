import React from 'react';
import { BlockComponentProps } from '../../../shared/editor2-types';
import { RenderBlock } from '../Canvas/RenderBlock';

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
}

export const Columns: React.FC<ColumnsProps> = ({
  id,
  children,
  className = '',
  responsiveStyles = {},
  styles = {},
  // Columns-specific props
  columns = [],
  gutterSize = 32,
  stackColumnsAt = 'tablet',
  reverseColumnsWhenStacked = false,
  alignItems = 'stretch',
  justifyContent = 'flex-start',
  ...props
}) => {
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

  // Combinar estilos
  const combinedStyles = {
    display: 'flex',
    gap: `${gutterSize}px`,
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
          flex: column.flex || '1',
          width: column.width || 'auto',
        };

        return (
          <div
            key={index}
            className="editor2-column"
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
                console.warn('Invalid block in column:', block);
                return null;
              }
              
              return (
                <RenderBlock
                  key={block.id || `${index}-${blockIndex}`}
                  block={block}
                />
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