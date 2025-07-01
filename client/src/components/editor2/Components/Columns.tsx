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

  // Determinar se deve empilhar colunas baseado na largura da tela (Builder.io pattern)
  const shouldStack = typeof window !== 'undefined' ? 
    (stackColumnsAt === 'tablet' && window.innerWidth <= 991) || 
    (stackColumnsAt === 'mobile' && window.innerWidth <= 640) : false;

  // BUILDER.IO EXATO: CSS-in-JS usando estilos inline (force override)
  const finalContainerStyles: React.CSSProperties = {
    display: 'flex', // Força display flex SEMPRE
    height: '100%',
    ...styles,
    
    // Aplicar stacking quando necessário (Builder.io pattern)
    ...(shouldStack && {
      flexDirection: reverseColumnsWhenStacked ? 'column-reverse' : 'column',
      alignItems: 'stretch',
    }),
    
    // FORÇA FINAL: Se não está stacking, força row
    ...(!shouldStack && {
      flexDirection: 'row',
    }),
  };

  // Debug para identificar problema com blocos null
  if (columns.length > 0) {
    console.log('🏗️ Columns component received:', { id, columns: columns.length, firstColumn: columns[0] });
  }

  // 🚨 DIAGNÓSTICO CRÍTICO: Debug estrutura completa
  console.log('🚨 COLUMNS DEBUG BUILDER.IO PATTERN:', {
    id,
    columnsLength: columns.length,
    gutterSize,
    stackColumnsAt,
    windowWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
    isDesktop: typeof window !== 'undefined' ? window.innerWidth >= 992 : false,
    finalContainerStyles,
    shouldStack,
    firstColumnWidth: columns.length > 0 ? getColumnWidth(0) : 'none',
    firstColumnBlocks: columns.length > 0 ? columns[0].blocks?.length : 0
  });

  // Debug DOM e CSS para detectar conflitos
  console.log('🔍 CONTAINER STYLES DEBUG:', {
    id,
    className: 'builder-columns',
    finalContainerStyles,
    display: finalContainerStyles.display,
    flexDirection: finalContainerStyles.flexDirection || 'row (default)',
    shouldStack,
    windowWidth: typeof window !== 'undefined' ? window.innerWidth : 0
  });

  // DETECTIVE MODE: Inspecionar CSS computado após render
  React.useEffect(() => {
    console.log('🔥 useEffect EXECUTADO para container:', id);
    
    // Dar tempo para o DOM renderizar completamente
    setTimeout(() => {
      const container = document.getElementById(id);
      console.log('🔍 Container encontrado:', !!container, container);
      
      if (container) {
        const computedStyles = window.getComputedStyle(container);
        console.log('🕵️ CSS COMPUTADO REAL (DOM):', {
          id,
          className: container.className,
          display: computedStyles.display,
          flexDirection: computedStyles.flexDirection,
          width: computedStyles.width,
          height: computedStyles.height,
          justifyContent: computedStyles.justifyContent,
          alignItems: computedStyles.alignItems,
          flexWrap: computedStyles.flexWrap,
          gap: computedStyles.gap
        });
        
        // Verificar filhos (colunas)
        const children = Array.from(container.children);
        console.log(`📊 TOTAL DE COLUNAS NO DOM: ${children.length}`);
        
        children.forEach((child, index) => {
          const childStyles = window.getComputedStyle(child);
          console.log(`🔍 COLUNA ${index + 1}/${children.length} CSS COMPUTADO:`, {
            className: child.className,
            display: childStyles.display,
            flexDirection: childStyles.flexDirection,
            width: childStyles.width,
            marginLeft: childStyles.marginLeft,
            flexShrink: childStyles.flexShrink,
            float: childStyles.float,
            position: childStyles.position,
            offsetWidth: child.offsetWidth,
            offsetHeight: child.offsetHeight
          });
        });
      } else {
        console.error('❌ Container não encontrado no DOM:', id);
      }
    }, 100);
  }, [id]);

  return (
    <div
      id={id}
      className="builder-columns"
      style={finalContainerStyles}
      {...props}
    >
      {columns.map((column, index) => {
        const columnWidth = getColumnWidth(index);
        
        // Builder.io EXATO: width em vez de flex
        const columnStyles: React.CSSProperties = {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          lineHeight: 'normal',
          width: columnWidth,  // ← WIDTH, não flex
          marginLeft: index === 0 ? 0 : gutterSize,  // ← NUMBER, não string
          
          // Responsive stacking
          ...(shouldStack && {
            width: '100%',
            marginLeft: 0,
          }),
        };

        console.log(`🔹 Column ${index + 1}/${columns.length} (Builder.io pattern):`, {
          width: columnWidth,
          marginLeft: columnStyles.marginLeft,
          useWidth: true, // não flex
          shouldStack,
          blocksCount: column.blocks?.length || 0
        });

        return (
          <div
            key={index}
            className="builder-column"
            style={columnStyles}
          >
            {/* Builder.io blocks wrapper */}
            <div className="builder-blocks" style={{ flexGrow: 1 }}>
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