/**
 * Stack Widget - Layout Vertical/Horizontal
 * Baseado na arquitetura Builder.io com controles flexíveis de direção e spacing
 */

import React from 'react';
import { RenderBlock } from './Canvas/RenderBlock';

interface StackProps {
  id: string;
  direction?: 'vertical' | 'horizontal';
  spacing?: number;
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  justifyContent?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
  wrap?: boolean;
  reverseOrder?: boolean;
  children?: any[];
  responsiveStyles?: any;
  componentMap?: any;
}

export function Stack({
  id,
  direction = 'vertical',
  spacing = 16,
  alignItems = 'stretch',
  justifyContent = 'start',
  wrap = false,
  reverseOrder = false,
  children = [],
  responsiveStyles = {},
  componentMap
}: StackProps) {
  
  // Gera estilos base do Stack
  const baseStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: direction === 'vertical' 
      ? (reverseOrder ? 'column-reverse' : 'column')
      : (reverseOrder ? 'row-reverse' : 'row'),
    gap: `${spacing}px`,
    alignItems: alignItems === 'start' ? 'flex-start' : 
                alignItems === 'end' ? 'flex-end' : alignItems,
    justifyContent: justifyContent === 'start' ? 'flex-start' : 
                   justifyContent === 'end' ? 'flex-end' : justifyContent,
    flexWrap: wrap ? 'wrap' : 'nowrap',
    width: '100%'
  };

  // Aplica responsiveStyles se existirem
  const responsiveStylesForBreakpoint = responsiveStyles?.large || {};
  const finalStyles = { ...baseStyles, ...responsiveStylesForBreakpoint };

  console.log('📚 Stack component:', {
    id,
    direction,
    spacing,
    alignItems,
    justifyContent,
    wrap,
    reverseOrder,
    childrenCount: children?.length || 0,
    childrenIds: children?.map(child => child?.id || 'NO_ID') || [],
    hasValidChildren: children?.every(child => child && child.id && child.component),
    stylesApplied: finalStyles
  });

  // SUPER DEBUG Stack - Verificação total
  console.log('🎯 STACK RENDER START:', {
    id,
    receivedChildren: children,
    childrenCount: children?.length,
    childrenType: Array.isArray(children) ? 'array' : typeof children,
    firstChild: children?.[0],
    stackOptions: { direction, spacing, alignItems, justifyContent }
  });

  // Verificar se children existe e é array
  if (!children) {
    console.error('❌ STACK ERROR: No children received!', { id, direction, spacing });
    return <div style={{ padding: '20px', background: 'red', color: 'white' }}>Stack {id}: NO CHILDREN</div>;
  }

  if (!Array.isArray(children)) {
    console.error('❌ STACK ERROR: Children is not array!', { id, children, type: typeof children });
    return <div style={{ padding: '20px', background: 'orange', color: 'white' }}>Stack {id}: CHILDREN NOT ARRAY</div>;
  }

  if (children.length === 0) {
    console.warn('⚠️ STACK WARNING: Empty children array!', { id });
    return <div style={{ padding: '20px', background: 'yellow', color: 'black' }}>Stack {id}: EMPTY CHILDREN</div>;
  }

  console.log('✅ STACK CHILDREN VALID:', children.length, 'items');

  return (
    <div 
      id={id}
      className="builder-stack"
      style={finalStyles}
    >
      {children.map((child, index) => {
        console.log(`🔗 Stack rendering child ${index}:`, {
          childId: child?.id,
          componentName: child?.component?.name,
          hasComponent: !!child?.component,
          childValid: !!(child?.id && child?.component)
        });
        
        if (!child?.id || !child?.component) {
          console.error(`❌ INVALID CHILD ${index}:`, child);
          return <div key={`invalid-${index}`} style={{ background: 'red', color: 'white', padding: '10px' }}>Invalid Child {index}</div>;
        }
        
        return <RenderBlock key={child.id || `stack-child-${index}`} block={child} />;
      })}
    </div>
  );
}

// Registrar propriedades para Builder.io compatibility
Stack.builderOptions = {
  name: 'Stack',
  inputs: [
    {
      name: 'direction',
      type: 'text',
      enum: ['vertical', 'horizontal'],
      defaultValue: 'vertical',
      helperText: 'Direção do layout: vertical (coluna) ou horizontal (linha)'
    },
    {
      name: 'spacing',
      type: 'number',
      defaultValue: 16,
      helperText: 'Espaçamento entre elementos em pixels'
    },
    {
      name: 'alignItems',
      type: 'text',
      enum: ['start', 'center', 'end', 'stretch'],
      defaultValue: 'stretch',
      helperText: 'Alinhamento dos itens no eixo cruzado'
    },
    {
      name: 'justifyContent',
      type: 'text',
      enum: ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'],
      defaultValue: 'start',
      helperText: 'Distribuição dos itens no eixo principal'
    },
    {
      name: 'wrap',
      type: 'boolean',
      defaultValue: false,
      helperText: 'Permitir quebra de linha quando necessário'
    },
    {
      name: 'reverseOrder',
      type: 'boolean', 
      defaultValue: false,
      helperText: 'Inverter ordem dos elementos'
    }
  ],
  defaultChildren: [
    {
      '@type': '@builder.io/sdk:Element',
      component: {
        name: 'Text',
        options: {
          text: 'Stack Item 1'
        }
      }
    },
    {
      '@type': '@builder.io/sdk:Element',
      component: {
        name: 'Text',
        options: {
          text: 'Stack Item 2'
        }
      }
    }
  ]
};