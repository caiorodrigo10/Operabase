/**
 * Mock Page JSON - Builder.io Style
 * Template padrão carregado automaticamente no Editor2
 */

export const mockPageJson = {
  blocks: [
    {
      id: 'root-section',
      component: {
        name: 'Section',
        options: {
          backgroundColor: '#1e40af',
          padding: '80px 0'
        }
      },
      responsiveStyles: {
        large: { width: '100%' },
        medium: { width: '100%', padding: '60px 0' },
        small: { width: '100%', padding: '40px 0' }
      },
      children: [
        {
          id: 'hero-container',
          component: {
            name: 'Container',
            options: {
              maxWidth: '1200px'
            }
          },
          responsiveStyles: {
            large: {
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '0 40px'
            },
            medium: {
              maxWidth: '100%',
              padding: '0 24px'
            },
            small: {
              maxWidth: '100%',
              padding: '0 16px'
            }
          },
          children: [
            {
              id: 'hero-title',
              component: {
                name: 'Text',
                options: {
                  text: '🚀 Builder.io Page Builder',
                  tag: 'h1'
                }
              },
              styles: {
                fontSize: '48px',
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                marginBottom: '24px',
                lineHeight: '1.2'
              },
              responsiveStyles: {
                medium: { fontSize: '36px' },
                small: { fontSize: '28px' }
              }
            },
            {
              id: 'hero-subtitle',
              component: {
                name: 'Text',
                options: {
                  text: 'Construa landing pages incríveis com componentes arrastar e soltar'
                }
              },
              styles: {
                fontSize: '20px',
                color: 'rgba(255,255,255,0.9)',
                textAlign: 'center',
                marginBottom: '32px',
                lineHeight: '1.6'
              },
              responsiveStyles: {
                medium: { fontSize: '18px' },
                small: { fontSize: '16px' }
              }
            },
            {
              id: 'hero-cta',
              component: {
                name: 'Button',
                options: {
                  text: 'Começar Agora',
                  href: '/dashboard',
                  variant: 'primary'
                }
              },
              styles: {
                backgroundColor: '#ffffff',
                color: '#1f2937',
                padding: '16px 32px',
                fontSize: '18px',
                fontWeight: '600',
                borderRadius: '8px',
                border: '2px solid #ffffff',
                cursor: 'pointer',
                display: 'block',
                margin: '0 auto',
                width: 'fit-content',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease'
              }
            }
          ]
        }
      ]
    },
    {
      id: 'spacer-section',
      component: {
        name: 'Spacer',
        options: {
          height: '60px'
        }
      }
    },
    {
      id: 'features-section',
      component: {
        name: 'Section',
        options: {}
      },
      styles: {
        backgroundColor: '#f8fafc',
        padding: '80px 0'
      },
      children: [
        {
          id: 'features-container',
          component: {
            name: 'Container',
            options: {
              maxWidth: '1200px'
            }
          },
          responsiveStyles: {
            large: {
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '0 40px'
            },
            medium: { padding: '0 24px' },
            small: { padding: '0 16px' }
          },
          children: [
            {
              id: 'features-title',
              component: {
                name: 'Text',
                options: {
                  text: 'Recursos Principais',
                  tag: 'h2'
                }
              },
              styles: {
                fontSize: '36px',
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: '48px',
                color: '#1f2937'
              },
              responsiveStyles: {
                medium: { fontSize: '28px' },
                small: { fontSize: '24px' }
              }
            },
            {
              id: 'features-columns',
              component: {
                name: 'Columns',
                options: {
                  gutterSize: 32,
                  stackColumnsAt: 'tablet',
                  columns: [
                    {
                      blocks: [
                        {
                          id: 'feature-1-title',
                          component: {
                            name: 'Text',
                            options: { text: '⚡ Rápido', tag: 'h3' }
                          },
                          styles: {
                            fontSize: '24px',
                            fontWeight: 'bold',
                            marginBottom: '16px',
                            color: '#1e40af'
                          }
                        },
                        {
                          id: 'feature-1-desc',
                          component: {
                            name: 'Text',
                            options: { text: 'Interface responsiva e otimizada para performance máxima.' }
                          },
                          styles: { color: '#6b7280', lineHeight: '1.6' }
                        }
                      ]
                    },
                    {
                      blocks: [
                        {
                          id: 'feature-2-title',
                          component: {
                            name: 'Text',
                            options: { text: '🎨 Flexível', tag: 'h3' }
                          },
                          styles: {
                            fontSize: '24px',
                            fontWeight: 'bold',
                            marginBottom: '16px',
                            color: '#1e40af'
                          }
                        },
                        {
                          id: 'feature-2-desc',
                          component: {
                            name: 'Text',
                            options: { text: 'Componentes customizáveis com design system completo.' }
                          },
                          styles: { color: '#6b7280', lineHeight: '1.6' }
                        }
                      ]
                    },
                    {
                      blocks: [
                        {
                          id: 'feature-3-title',
                          component: {
                            name: 'Text',
                            options: { text: '🚀 Moderno', tag: 'h3' }
                          },
                          styles: {
                            fontSize: '24px',
                            fontWeight: 'bold',
                            marginBottom: '16px',
                            color: '#1e40af'
                          }
                        },
                        {
                          id: 'feature-3-desc',
                          component: {
                            name: 'Text',
                            options: { text: 'Tecnologia de ponta com React, TypeScript e Builder.io patterns.' }
                          },
                          styles: { color: '#6b7280', lineHeight: '1.6' }
                        }
                      ]
                    }
                  ]
                }
              }
            }
          ]
        }
      ]
    },
    {
      id: 'divider-section',
      component: {
        name: 'Divider',
        options: {
          color: '#e5e7eb',
          thickness: '1px',
          margin: '60px 0'
        }
      }
    },
    {
      id: 'testimonial-section',
      component: {
        name: 'Section',
        options: {
          backgroundColor: 'white',
          padding: '80px 0'
        }
      },
      children: [
        {
          id: 'testimonial-container',
          component: {
            name: 'Container',
            options: {
              maxWidth: '800px'
            }
          },
          responsiveStyles: {
            large: {
              maxWidth: '800px',
              margin: '0 auto',
              padding: '0 40px'
            },
            medium: { padding: '0 24px' },
            small: { padding: '0 16px' }
          },
          children: [
            {
              id: 'testimonial-title',
              component: {
                name: 'Text',
                options: {
                  text: 'O que nossos usuários dizem',
                  tag: 'h2'
                }
              },
              styles: {
                fontSize: '32px',
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: '48px',
                color: '#1f2937'
              }
            },
            {
              id: 'testimonial-card',
              component: {
                name: 'Testimonial',
                options: {
                  author: 'Maria Silva',
                  text: 'O Editor2 transformou completamente nosso processo de criação de landing pages. Interface intuitiva e resultados profissionais.',
                  rating: 5,
                  position: 'CEO',
                  company: 'TechStartup'
                }
              }
            }
          ]
        }
      ]
    }
  ],
  meta: {
    title: 'Builder.io Page Builder - Editor2',
    description: 'Template padrão do Editor2 com componentes Builder.io',
    viewport: 'width=device-width, initial-scale=1'
  }
};