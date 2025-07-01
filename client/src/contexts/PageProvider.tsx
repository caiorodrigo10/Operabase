/**
 * PageProvider - Context API para Editor2
 * Gerencia estado global da página JSON e operações relacionadas
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PageJSON, PageContextType } from '@/../shared/editor2-types';

// Criação do Context
const PageContext = createContext<PageContextType | undefined>(undefined);

// Props do Provider
interface PageProviderProps {
  children: ReactNode;
}

// Provider Component
export function PageProvider({ children }: PageProviderProps) {
  // Estado principal da página JSON
  const [pageJson, setPageJson] = useState<PageJSON | null>(null);
  
  // Estado de loading
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Estado de erro
  const [error, setError] = useState<string | null>(null);

  // Função auxiliar para limpar erro ao setar nova página
  const handleSetPageJson = (newPageJson: PageJSON | null) => {
    setError(null); // Limpa erro ao carregar nova página
    setPageJson(newPageJson);
  };

  // Função auxiliar para limpar estados
  const handleSetError = (newError: string | null) => {
    if (newError) {
      setIsLoading(false); // Para loading ao encontrar erro
    }
    setError(newError);
  };

  // Valor do contexto
  const contextValue: PageContextType = {
    pageJson,
    setPageJson: handleSetPageJson,
    isLoading,
    setIsLoading,
    error,
    setError: handleSetError,
  };

  return (
    <PageContext.Provider value={contextValue}>
      {children}
    </PageContext.Provider>
  );
}

// Hook customizado para usar o contexto
export function usePage(): PageContextType {
  const context = useContext(PageContext);
  
  if (context === undefined) {
    throw new Error('usePage deve ser usado dentro de um PageProvider');
  }
  
  return context;
}

// Hook auxiliar para verificar se tem dados
export function useHasPageData(): boolean {
  const { pageJson } = usePage();
  return pageJson !== null && pageJson.blocks.length > 0;
}

// Hook auxiliar para obter meta dados
export function usePageMeta() {
  const { pageJson } = usePage();
  return pageJson?.meta || null;
}