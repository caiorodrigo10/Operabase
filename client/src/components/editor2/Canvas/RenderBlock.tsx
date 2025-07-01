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
  Divider,
  DefaultComponent
};

// Função auxiliar para calcular estilos responsivos (placeholder por enquanto)
function calculateResponsiveStyles(responsiveStyles?: any): React.CSSProperties {
  // Por enquanto retorna vazio, será implementado futuramente
  // TODO: Implementar lógica de breakpoints mobile/tablet/desktop
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

  // Combinar estilos conforme sugestão do GPT
  const combinedStyles: React.CSSProperties = {
    ...(block.styles || {}),
    ...(calculateResponsiveStyles(block.responsiveStyles))
  };

  // Para componentes Container, passar responsiveStyles como prop separada
  const componentProps = block.component.name === 'Container' 
    ? { 
        ...block.component.options,
        responsiveStyles: block.responsiveStyles,
        style: block.styles
      }
    : {
        ...block.component.options,
        style: combinedStyles
      };

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

  // Se não estiver em modo edição, renderizar componente simples
  if (!inEditMode) {
    return (
      <Component 
        {...componentProps}
        key={block.id}
      >
        {children}
      </Component>
    );
  }

  // Renderizar componente com wrapper interativo para modo edição
  return (
    <div
      className={interactiveClasses}
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