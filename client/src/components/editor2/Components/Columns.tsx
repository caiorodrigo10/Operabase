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
  // Gerar classes CSS baseado nas configurações + detecção de tela
  const getResponsiveClasses = () => {
    const classes = ['editor2-columns'];
    const currentWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    
    // ✅ Builder.io Logic: Só aplicar classes de empilhamento quando necessário
    if (stackColumnsAt === 'tablet' && currentWidth <= 991) {
      classes.push('columns-stack-tablet');
    } else if (stackColumnsAt === 'mobile' && currentWidth <= 640) {
      classes.push('columns-stack-mobile');
    }
    
    // Só aplicar reverse se realmente empilhando
    if (reverseColumnsWhenStacked && 
        ((stackColumnsAt === 'tablet' && currentWidth <= 991) || 
         (stackColumnsAt === 'mobile' && currentWidth <= 640))) {
      classes.push('columns-reverse-stacked');
    }
    
    return classes.join(' ');
  };

  // Método Builder.io EXATO (baseado no código real lines 77-88)
  const getWidth = (index: number) => {
    return (columns[index] && columns[index].width) || 100 / columns.length;
  };

  const getColumnWidth = (index: number) => {
    const width = getWidth(index);
    const subtractWidth = gutterSize * (columns.length - 1) * (width / 100);
    
    return `calc(${width}% - ${subtractWidth}px)`;
  };

  // Determinar se deve empilhar colunas baseado na largura da tela
  const shouldStack = typeof window !== 'undefined' ? 
    (stackColumnsAt === 'tablet' ? window.innerWidth <= 991 : window.innerWidth <= 640) : false;

  // CSS-in-JS Builder.io: REMOVER todas as classes CSS
  const inlineStyles: React.CSSProperties = {
    display: 'flex',
    height: '100%',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    width: '100%',
    // Remover qualquer gap - Builder.io usa margin-left
    gap: 0,
    ...styles,
  };

  // Aplicar responsividade inline
  const finalStyles: React.CSSProperties = {
    ...inlineStyles,
    
    // Aplicar stacking quando necessário
    ...(shouldStack && {
      flexDirection: reverseColumnsWhenStacked ? 'column-reverse' : 'column',
      gap: `${gutterSize}px`,
    }),
    
    // Aplicar responsive styles se existirem
    ...(typeof window !== 'undefined' && window.innerWidth >= 992 && responsiveStyles.large),
    ...(typeof window !== 'undefined' && window.innerWidth >= 641 && window.innerWidth <= 991 && responsiveStyles.medium),
    ...(typeof window !== 'undefined' && window.innerWidth < 641 && responsiveStyles.small),
  };

  // Debug para identificar problema com blocos null
  if (columns.length > 0) {
    console.log('🏗️ Columns component received:', { id, columns: columns.length, firstColumn: columns[0] });
  }

  // 🚨 DIAGNÓSTICO CRÍTICO: Debug estrutura completa
  console.log('🚨 COLUMNS DEBUG CSS-IN-JS:', {
    id,
    columnsLength: columns.length,
    gutterSize,
    stackColumnsAt,
    windowWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
    isDesktop: typeof window !== 'undefined' ? window.innerWidth >= 992 : false,
    inlineStyles,
    finalStyles,
    shouldStack: typeof window !== 'undefined' ? window.innerWidth <= 991 && stackColumnsAt === 'tablet' : false,
    firstColumnWidth: columns.length > 0 ? getColumnWidth(0) : 'none',
    firstColumnBlocks: columns.length > 0 ? columns[0].blocks?.length : 0
  });

  return (
    <div
      id={id}
      style={finalStyles}
      {...props}
    >
      {columns.map((column, index) => {
        const columnWidth = getColumnWidth(index);
        const columnStyles = {
          flex: `0 0 ${columnWidth}`,
          marginLeft: index === 0 ? 0 : `${gutterSize}px`,
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'stretch'
        };

        console.log(`🔹 Column ${index + 1}/${columns.length}:`, {
          width: columnWidth,
          marginLeft: columnStyles.marginLeft,
          flex: columnStyles.flex,
          blocksCount: column.blocks?.length || 0
        });

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