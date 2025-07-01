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
import { DefaultComponent } from '../Components/DefaultComponent';

// Mapeamento interno de componentes
const internalComponentMap: any = {
  Container,
  HeroSection,
  Text,
  Button,
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
  // Usa componentMap customizado ou interno
  const activeComponentMap = customComponentMap || internalComponentMap;
  
  // Obter componente do mapeamento
  const Component = activeComponentMap[block.component.name];
  
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

  // Renderizar componente com props combinadas
  return (
    <Component 
      {...componentProps}
      key={block.id}
    >
      {children}
    </Component>
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