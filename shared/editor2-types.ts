/**
 * Editor2 - Tipos e Interfaces Compartilhadas
 * Sistema de renderização baseado em JSON para landing pages
 */

import React from 'react';

// Tipos base para estilos responsivos
export interface ResponsiveStyles {
  mobile?: React.CSSProperties;
  tablet?: React.CSSProperties;
  desktop?: React.CSSProperties;
}

// Interface base para componentes
export interface Component {
  name: string;
  options: Record<string, any>;
}

// Interface para blocos do sistema JSON
export interface Block {
  id: string;
  component: Component;
  children?: Block[];
  styles?: React.CSSProperties;
  responsiveStyles?: ResponsiveStyles;
}

// Interface principal para estrutura de página
export interface PageJSON {
  blocks: Block[];
  meta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

// Interface para o Context Provider
export interface PageContextType {
  pageJson: PageJSON | null;
  setPageJson: (pageJson: PageJSON | null) => void;
  savePageJson: (pageJson: PageJSON) => boolean;
  resetToDefault: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

// Tipos para mapeamento de componentes
export type ComponentMap = Record<string, React.ComponentType<any>>;

// Props para RenderBlock
export interface RenderBlockProps {
  block: Block;
  componentMap: ComponentMap;
}

// Props para DefaultComponent
export interface DefaultComponentProps {
  name: string;
  children?: React.ReactNode;
}

// Utilidade para estilos responsivos
export type BreakpointKey = 'mobile' | 'tablet' | 'desktop';

// Estado de loading para UI
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

// Estado de erro para UI
export interface ErrorState {
  hasError: boolean;
  message?: string;
  details?: any;
}

// Props base para componentes do Editor2
export interface BlockComponentProps {
  id: string;
  children?: Block[];
  className?: string;
  responsiveStyles?: ResponsiveStyles;
  styles?: React.CSSProperties;
  [key: string]: any; // Para props específicas do componente
}