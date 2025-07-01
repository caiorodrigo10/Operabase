/**
 * componentMap - Mapeamento de componentes para renderização
 * Mapeia nomes de componentes para seus componentes React correspondentes
 */

import { ComponentMap } from '@/../shared/editor2-types';
import { Container } from '../Components/Container';
import { HeroSection } from '../Components/HeroSection';
import { Text } from '../Components/Text';
import { Button } from '../Components/Button';
import { DefaultComponent } from '../Components/DefaultComponent';

// Mapeamento principal de componentes
export const componentMap: ComponentMap = {
  // Layout básico
  Container,
  
  // Seções
  HeroSection,
  
  // Elementos básicos
  Text,
  Button,
  
  // Fallback para componentes não encontrados
  DefaultComponent
};

// Função auxiliar para obter componente
export function getComponent(name: string) {
  return componentMap[name] || DefaultComponent;
}

// Função auxiliar para verificar se componente existe
export function hasComponent(name: string): boolean {
  return name in componentMap && name !== 'DefaultComponent';
}

// Lista de componentes disponíveis (para toolbox futuro)
export const availableComponents = Object.keys(componentMap).filter(
  name => name !== 'DefaultComponent'
);

// Categorias de componentes (para organização futura)
export const componentCategories = {
  layout: ['HeroSection'],
  content: ['Text'],
  interactive: ['Button']
};

// Função para obter componentes por categoria
export function getComponentsByCategory(category: keyof typeof componentCategories) {
  return componentCategories[category] || [];
}