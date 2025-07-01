/**
 * RenderBlock - Sistema de renderização recursiva
 * Renderiza blocos JSON em componentes React com suporte a estilos
 */

import React from 'react';
import { RenderBlockProps, Block } from '@/../shared/editor2-types';
import { Container } from '../Components/Container';
import { HeroSection } from '../Components/HeroSection';
import { Text } from '../Components/Text';
import { Button } from '../Components/Button';
import { Section } from '../Components/Section';
import { Columns } from '../Components/Columns';
import { Image } from '../Components/Image';
import { Video } from '../Components/Video';
import { Spacer } from '../Components/Spacer';
import { Divider } from '../Components/Divider';
import { Form } from '../Components/Form';
import { Testimonial } from '../Components/Testimonial';
import { DefaultComponent } from '../Components/DefaultComponent';

// Import do contexto de edição (opcional para não quebrar se não tiver)
let useEditor: any = null;
try {
  const editorModule = require('../../../contexts/EditorContext');
  useEditor = editorModule.useEditor;
} catch (e) {
  // Context não disponível, continuar sem interatividade
}

// Mapeamento interno de componentes
const internalComponentMap: any = {
  Container,
  HeroSection,
  Text,
  Button,
  Section,
  Columns,
  Image,
  Video,
  Spacer,
  Form,
  Testimonial,
  Divider,
  DefaultComponent
};

// Sistema de breakpoints Builder.io style
const BREAKPOINTS = {
  large: 1024, // desktop
  medium: 768, // tablet  
  small: 0    // mobile
};

// Função para calcular estilos responsivos
function calculateResponsiveStyles(responsiveStyles?: any): React.CSSProperties {
  if (!responsiveStyles || typeof window === 'undefined') {
    return {};
  }

  const width = window.innerWidth;
  
  // Determinar breakpoint atual (precedência: large > medium > small)
  if (width >= BREAKPOINTS.large && responsiveStyles.large) {
    return responsiveStyles.large;
  } else if (width >= BREAKPOINTS.medium && responsiveStyles.medium) {
    return responsiveStyles.medium;
  } else if (width < BREAKPOINTS.medium && responsiveStyles.small) {
    return responsiveStyles.small;
  }
  
  return {};
}

export const RenderBlock: React.FC<RenderBlockProps> = ({ 
  block, 
  componentMap: customComponentMap 
}) => {
  // Verificação de segurança do bloco
  if (!block) {
    console.warn('RenderBlock: block is null or undefined');
    return null;
  }
  
  if (!block.component) {
    console.warn('RenderBlock: block.component is null or undefined for block:', block);
    return null;
  }
  
  if (!block.component.name) {
    console.warn('RenderBlock: block.component.name is null or undefined for block:', block);
    return null;
  }
  
  // Usa componentMap customizado ou interno
  const activeComponentMap = customComponentMap || internalComponentMap;
  
  // Tentar usar contexto de edição se disponível
  const editor = useEditor ? useEditor() : null;
  
  // Obter componente do mapeamento
  const Component = activeComponentMap[block.component.name];
  
  // Estados de interação (apenas se editor context disponível)
  const isSelected = editor ? editor.selectedBlockId === block.id : false;
  const isHovered = editor ? editor.hoveredBlockId === block.id : false;
  const inEditMode = editor ? editor.mode === 'edit' : false;
  
  // Se componente não existe, usar DefaultComponent
  if (!Component) {
    return (
      <DefaultComponent name={block.component.name}>
        {block.children?.map((child) => (
          <RenderBlock 
            key={child.id} 
            block={child} 
            componentMap={activeComponentMap}
          />
        ))}
      </DefaultComponent>
    );
  }

  // Sistema de precedência Builder.io: responsiveStyles > styles > options
  const combinedStyles: React.CSSProperties = {
    // 1. Estilos base do bloco (menor precedência)
    ...(block.styles || {}),
    // 2. Estilos responsivos (maior precedência)
    ...(calculateResponsiveStyles(block.responsiveStyles))
  };

  // Debug para entender passagem de props
  console.log('🔧 RenderBlock debug:', {
    componentName: block.component.name,
    blockId: block.id,
    options: block.component.options,
    styles: block.styles,
    responsiveStyles: Object.keys(block.responsiveStyles || {}),
    hasChildren: !!block.children?.length
  });

  // Log específico para Columns
  if (block.component.name === 'Columns') {
    console.log('🏗️ COLUMNS DETECTED:', {
      id: block.id,
      columns: block.component.options?.columns?.length || 0,
      gutterSize: block.component.options?.gutterSize,
      firstColumnBlocks: block.component.options?.columns?.[0]?.blocks?.length || 0
    });
  }

  // Separar estilos do wrapper (Builder.io pattern) dos estilos do componente
  const separateWrapperStyles = (styles: any) => {
    const { backgroundColor, padding, margin, ...componentStyles } = styles || {};
    
    console.log('🎨 WrapperStyles Debug:', {
      blockId: block.id,
      componentName: block.component.name,
      originalStyles: styles,
      wrapperStyles: { backgroundColor, padding, margin },
      componentStyles
    });
    
    return {
      wrapperStyles: { backgroundColor, padding, margin },
      componentStyles
    };
  };

  const { wrapperStyles, componentStyles } = separateWrapperStyles(combinedStyles);

  // Preparar props baseado no tipo de componente
  const componentProps = (() => {
    const baseProps = {
      id: block.id,
      ...block.component.options,
      className: '',
      styles: componentStyles, // Usar estilos sem wrapper styles
      responsiveStyles: block.responsiveStyles || {}
    };

    // Para componentes específicos que precisam de tratamento especial
    if (block.component.name === 'Container') {
      return {
        ...baseProps,
        style: block.styles
      };
    }

    // Para componente Columns, passar função renderBlock
    if (block.component.name === 'Columns') {
      return {
        ...baseProps,
        style: combinedStyles,
        renderBlock: (childBlock: any) => (
          <RenderBlock 
            key={childBlock.id} 
            block={childBlock} 
            componentMap={activeComponentMap}
          />
        )
      };
    }
    
    // Para outros componentes, usar estilos combinados
    return {
      ...baseProps,
      style: combinedStyles
    };
  })();

  // Renderizar children recursivamente
  const children = block.children?.map((child) => (
    <RenderBlock 
      key={child.id} 
      block={child} 
      componentMap={activeComponentMap}
    />
  ));

  // Handlers de interação (apenas se editor context disponível)
  const handleClick = (e: React.MouseEvent) => {
    if (editor && inEditMode) {
      e.stopPropagation();
      editor.selectBlock(block.id);
    }
  };

  const handleMouseEnter = () => {
    if (editor && inEditMode) {
      editor.setHoveredBlock(block.id);
    }
  };

  const handleMouseLeave = () => {
    if (editor && inEditMode) {
      editor.setHoveredBlock(null);
    }
  };

  // Classes CSS para interação
  const interactiveClasses = inEditMode ? [
    'editor2-block',
    isSelected && 'selected',
    isHovered && 'hovered'
  ].filter(Boolean).join(' ') : '';

  // Se não estiver em modo edição, renderizar componente com wrapper styles (Builder.io pattern)
  if (!inEditMode) {
    return (
      <div className="builder-block" style={wrapperStyles}>
        <Component 
          {...componentProps}
          key={block.id}
        >
          {children}
        </Component>
      </div>
    );
  }

  // Renderizar componente com wrapper interativo para modo edição
  return (
    <div
      className={`builder-block ${interactiveClasses}`}
      style={wrapperStyles}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-block-id={block.id}
      data-block-type={block.component.name}
    >
      {/* Label do bloco (aparece quando selecionado/hover) */}
      <div className="editor2-block-label">
        {block.component.name}
      </div>
      
      {/* Componente real */}
      <Component 
        {...componentProps}
        key={block.id}
      >
        {children}
      </Component>
    </div>
  );
};

// Hook auxiliar para renderizar múltiplos blocos
export function useRenderBlocks(blocks: Block[], customComponentMap?: any) {
  return React.useMemo(() => {
    return blocks.map((block) => (
      <RenderBlock 
        key={block.id} 
        block={block} 
        componentMap={customComponentMap}
      />
    ));
  }, [blocks, customComponentMap]);
}

// Função auxiliar para renderizar array de blocos
export function renderBlocks(blocks: Block[], customComponentMap?: any) {
  return blocks.map((block) => (
    <RenderBlock 
      key={block.id} 
      block={block} 
      componentMap={customComponentMap}
    />
  ));
}