/**
 * PageProvider - Context API para Editor2
 * Gerencia estado global da página JSON e operações relacionadas
 */

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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

  // JSON padrão para carregamento automático
  const getDefaultPageJson = (): PageJSON => {
    return {
      blocks: [
        {
          id: 'root-container',
          component: {
            name: 'Container',
            options: {}
          },
          responsiveStyles: {
            large: {
              maxWidth: '1200px',
              margin: '0 auto',
              paddingLeft: '40px',
              paddingRight: '40px'
            },
            medium: {
              maxWidth: '100%',
              paddingLeft: '24px',
              paddingRight: '24px'
            },
            small: {
              maxWidth: '100%',
              paddingLeft: '16px',
              paddingRight: '16px'
            }
          },
          children: [
            // Hero Section com Section component
            {
              id: 'hero-section',
              component: {
                name: 'Section',
                options: {
                  backgroundColor: '#1e40af',
                  padding: '60px 0',
                  margin: '0'
                }
              },
              children: [
                {
                  id: 'hero-title',
                  component: {
                    name: 'Text',
                    options: {
                      text: '🚀 Editor2 Builder.io Components'
                    }
                  },
                  styles: {
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: 'white',
                    textAlign: 'center',
                    marginBottom: '16px'
                  }
                },
                {
                  id: 'hero-subtitle',
                  component: {
                    name: 'Text',
                    options: {
                      text: 'Section, Columns, Image, Video, Spacer e Divider funcionando!'
                    }
                  },
                  styles: {
                    fontSize: '18px',
                    color: 'rgba(255,255,255,0.9)',
                    textAlign: 'center',
                    marginBottom: '24px'
                  }
                }
              ]
            },
            // Spacer
            {
              id: 'spacer-1',
              component: {
                name: 'Spacer',
                options: {
                  height: '40px'
                }
              }
            },
            // Columns Demo
            {
              id: 'columns-demo',
              component: {
                name: 'Columns',
                options: {
                  gutterSize: 24,
                  stackColumnsAt: 'tablet',
                  columns: [
                    {
                      blocks: [
                        {
                          id: 'col1-title',
                          component: {
                            name: 'Text',
                            options: { text: 'Coluna 1' }
                          },
                          styles: { fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }
                        },
                        {
                          id: 'col1-desc',
                          component: {
                            name: 'Text',
                            options: { text: 'Componente Section' }
                          }
                        }
                      ]
                    },
                    {
                      blocks: [
                        {
                          id: 'col2-title',
                          component: {
                            name: 'Text',
                            options: { text: 'Coluna 2' }
                          },
                          styles: { fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }
                        },
                        {
                          id: 'col2-desc',
                          component: {
                            name: 'Text',
                            options: { text: 'Sistema Columns' }
                          }
                        }
                      ]
                    },
                    {
                      blocks: [
                        {
                          id: 'col3-title',
                          component: {
                            name: 'Text',
                            options: { text: 'Coluna 3' }
                          },
                          styles: { fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }
                        },
                        {
                          id: 'col3-desc',
                          component: {
                            name: 'Text',
                            options: { text: 'Video, Image, Spacer' }
                          }
                        }
                      ]
                    }
                  ]
                }
              }
            },
            // Divider
            {
              id: 'divider-1',
              component: {
                name: 'Divider',
                options: {
                  color: '#e5e7eb',
                  thickness: '2px',
                  margin: '30px 0'
                }
              }
            },
            // Video Demo
            {
              id: 'video-demo',
              component: {
                name: 'Video',
                options: {
                  src: 'https://www.youtube.com/watch?v=u7KQ4ityQeI',
                  type: 'youtube',
                  aspectRatio: '16:9'
                }
              },
              styles: {
                maxWidth: '600px',
                margin: '0 auto'
              }
            }
          ]
        }
      ],
      meta: {
        title: 'Editor2 - Builder.io Components Demo',
        description: 'Demonstração completa dos componentes Builder.io implementados'
      }
    };
  };

  // Efeito para carregar JSON padrão automaticamente
  useEffect(() => {
    if (!pageJson) {
      console.log('🚀 PageProvider: Carregando JSON padrão automaticamente...');
      setPageJson(getDefaultPageJson());
    }
  }, [pageJson]);

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