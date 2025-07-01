/**
 * Mock Page JSON - Builder.io Style + Box Widget Test
 * Demonstração completa do Box widget com exemplos práticos
 */

export const mockPageJson = {
  id: 'box-widget-test',
  blocks: [
    // 🎨 SEÇÃO DEMO: BOX WIDGET TEST
    {
      id: 'box-demo-section',
      '@type': '@builder.io/sdk:Element',
      component: {
        name: 'Section',
        options: {
          maxWidth: 1200
        }
      },
      responsiveStyles: {
        large: {
          backgroundColor: '#0f172a',
          padding: '100px 0',
          width: '100%'
        }
      },
      children: [
        {
          id: 'box-demo-container',
          '@type': '@builder.io/sdk:Element',
          component: {
            name: 'Container',
            options: {
              maxWidth: 1200
            }
          },
          responsiveStyles: {
            large: {
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '0 40px'
            }
          },
          children: [
            {
              id: 'box-title',
              '@type': '@builder.io/sdk:Element',
              component: {
                name: 'Text',
                options: {
                  text: 'Box Widget Demo',
                  tag: 'h1'
                }
              },
              responsiveStyles: {
                large: {
                  fontSize: '48px',
                  fontWeight: '900',
                  color: '#ffffff',
                  textAlign: 'center',
                  marginBottom: '60px'
                }
              }
            },
            {
              id: 'box-cards-container',
              '@type': '@builder.io/sdk:Element',
              component: {
                name: 'Box',
                options: {
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  gap: 30
                }
              },
              responsiveStyles: {
                medium: {
                  flexDirection: 'column'
                },
                small: {
                  flexDirection: 'column',
                  gap: '20px'
                }
              },
              children: [
                {
                  id: 'box-card-1',
                  '@type': '@builder.io/sdk:Element',
                  component: {
                    name: 'Box',
                    options: {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 16,
                      paddingTop: 40,
                      paddingBottom: 40,
                      paddingLeft: 32,
                      paddingRight: 32,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 20,
                      width: '100%',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }
                  },
                  children: [
                    {
                      id: 'card-badge-1',
                      '@type': '@builder.io/sdk:Element',
                      component: {
                        name: 'Box',
                        options: {
                          backgroundColor: '#3b82f6',
                          borderRadius: 20,
                          paddingTop: 8,
                          paddingBottom: 8,
                          paddingLeft: 16,
                          paddingRight: 16,
                          display: 'inline-flex',
                          alignItems: 'center'
                        }
                      },
                      children: [
                        {
                          id: 'badge-text-1',
                          '@type': '@builder.io/sdk:Element',
                          component: {
                            name: 'Text',
                            options: {
                              text: '✨ Flexível',
                              tag: 'span'
                            }
                          },
                          responsiveStyles: {
                            large: {
                              color: '#ffffff',
                              fontSize: '14px',
                              fontWeight: '600'
                            }
                          }
                        }
                      ]
                    },
                    {
                      id: 'card-title-1',
                      '@type': '@builder.io/sdk:Element',
                      component: {
                        name: 'Text',
                        options: {
                          text: 'Layout Flexível',
                          tag: 'h3'
                        }
                      },
                      responsiveStyles: {
                        large: {
                          fontSize: '24px',
                          fontWeight: '700',
                          color: '#ffffff',
                          textAlign: 'center'
                        }
                      }
                    }
                  ]
                },
                {
                  id: 'box-card-2',
                  '@type': '@builder.io/sdk:Element',
                  component: {
                    name: 'Box',
                    options: {
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      borderRadius: 16,
                      paddingTop: 40,
                      paddingBottom: 40,
                      paddingLeft: 32,
                      paddingRight: 32,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 20,
                      width: '100%',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }
                  },
                  children: [
                    {
                      id: 'card-badge-2',
                      '@type': '@builder.io/sdk:Element',
                      component: {
                        name: 'Box',
                        options: {
                          backgroundColor: '#10b981',
                          borderRadius: 20,
                          paddingTop: 8,
                          paddingBottom: 8,
                          paddingLeft: 16,
                          paddingRight: 16,
                          display: 'inline-flex',
                          alignItems: 'center'
                        }
                      },
                      children: [
                        {
                          id: 'badge-text-2',
                          '@type': '@builder.io/sdk:Element',
                          component: {
                            name: 'Text',
                            options: {
                              text: '📱 Responsivo',
                              tag: 'span'
                            }
                          },
                          responsiveStyles: {
                            large: {
                              color: '#ffffff',
                              fontSize: '14px',
                              fontWeight: '600'
                            }
                          }
                        }
                      ]
                    },
                    {
                      id: 'card-title-2',
                      '@type': '@builder.io/sdk:Element',
                      component: {
                        name: 'Text',
                        options: {
                          text: 'Design Responsivo',
                          tag: 'h3'
                        }
                      },
                      responsiveStyles: {
                        large: {
                          fontSize: '24px',
                          fontWeight: '700',
                          color: '#ffffff',
                          textAlign: 'center'
                        }
                      }
                    }
                  ]
                },
                {
                  id: 'box-card-3',
                  '@type': '@builder.io/sdk:Element',
                  component: {
                    name: 'Box',
                    options: {
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      borderRadius: 16,
                      paddingTop: 40,
                      paddingBottom: 40,
                      paddingLeft: 32,
                      paddingRight: 32,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 20,
                      width: '100%',
                      border: '1px solid rgba(245, 158, 11, 0.3)'
                    }
                  },
                  children: [
                    {
                      id: 'card-badge-3',
                      '@type': '@builder.io/sdk:Element',
                      component: {
                        name: 'Box',
                        options: {
                          backgroundColor: '#f59e0b',
                          borderRadius: 20,
                          paddingTop: 8,
                          paddingBottom: 8,
                          paddingLeft: 16,
                          paddingRight: 16,
                          display: 'inline-flex',
                          alignItems: 'center'
                        }
                      },
                      children: [
                        {
                          id: 'badge-text-3',
                          '@type': '@builder.io/sdk:Element',
                          component: {
                            name: 'Text',
                            options: {
                              text: '⚡ Rápido',
                              tag: 'span'
                            }
                          },
                          responsiveStyles: {
                            large: {
                              color: '#ffffff',
                              fontSize: '14px',
                              fontWeight: '600'
                            }
                          }
                        }
                      ]
                    },
                    {
                      id: 'card-title-3',
                      '@type': '@builder.io/sdk:Element',
                      component: {
                        name: 'Text',
                        options: {
                          text: 'Performance',
                          tag: 'h3'
                        }
                      },
                      responsiveStyles: {
                        large: {
                          fontSize: '24px',
                          fontWeight: '700',
                          color: '#ffffff',
                          textAlign: 'center'
                        }
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    // 🔵 SEÇÃO 2: HERO ORIGINAL - AZUL ESCURO (#1e40af)
    {
      id: 'hero-section',
      '@type': '@builder.io/sdk:Element',
      component: {
        name: 'Section',
        options: {
          maxWidth: 1200
        }
      },
      responsiveStyles: {
        large: {
          backgroundColor: '#1e40af',
          padding: '100px 0',
          width: '100%'
        },
        medium: {
          backgroundColor: '#1e40af',
          padding: '80px 0'
        },
        small: {
          backgroundColor: '#1e40af',
          padding: '60px 0'
        }
      },
      children: [
        {
          id: 'hero-container',
          '@type': '@builder.io/sdk:Element',
          component: {
            name: 'Container',
            options: {
              maxWidth: 800
            }
          },
          responsiveStyles: {
            large: {
              maxWidth: '800px',
              margin: '0 auto',
              textAlign: 'center'
            }
          },
          children: [
            {
              id: 'hero-title',
              '@type': '@builder.io/sdk:Element',
              component: {
                name: 'Text',
                options: {
                  text: 'Transforme Sua Ideia em Realidade',
                  tag: 'h1'
                }
              },
              responsiveStyles: {
                large: {
                  fontSize: '48px',
                  fontWeight: '700',
                  color: '#ffffff',
                  marginBottom: '24px',
                  lineHeight: '1.2'
                },
                medium: {
                  fontSize: '36px',
                  marginBottom: '20px'
                },
                small: {
                  fontSize: '28px',
                  marginBottom: '16px'
                }
              }
            },
            {
              id: 'hero-description',
              '@type': '@builder.io/sdk:Element',
              component: {
                name: 'Text',
                options: {
                  text: 'Descubra como nossa plataforma inovadora pode acelerar seus projetos e maximizar seus resultados com tecnologia de ponta.',
                  tag: 'p'
                }
              },
              responsiveStyles: {
                large: {
                  fontSize: '20px',
                  color: '#e2e8f0',
                  marginBottom: '40px',
                  lineHeight: '1.6',
                  maxWidth: '600px',
                  margin: '0 auto 40px auto'
                },
                medium: {
                  fontSize: '18px',
                  marginBottom: '32px'
                },
                small: {
                  fontSize: '16px',
                  marginBottom: '24px'
                }
              }
            },
            {
              id: 'hero-button',
              '@type': '@builder.io/sdk:Element',
              component: {
                name: 'Button',
                options: {
                  text: 'Começar Agora',
                  href: '/signup'
                }
              },
              responsiveStyles: {
                large: {
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  padding: '16px 32px',
                  fontSize: '18px',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'inline-block'
                }
              }
            }
          ]
        }
      ]
    },

    // 🔘 SEÇÃO 2: FEATURES - CINZA CLARO (#f8fafc)
    {
      id: 'features-section',
      '@type': '@builder.io/sdk:Element',
      component: {
        name: 'Section',
        options: {
          maxWidth: 1200
        }
      },
      responsiveStyles: {
        large: {
          backgroundColor: '#f8fafc',
          padding: '100px 0',
          width: '100%'
        },
        medium: {
          backgroundColor: '#f8fafc',
          padding: '80px 0'
        },
        small: {
          backgroundColor: '#f8fafc',
          padding: '60px 0'
        }
      },
      children: [
        {
          id: 'features-container',
          '@type': '@builder.io/sdk:Element',
          component: {
            name: 'Container',
            options: {
              maxWidth: 1000
            }
          },
          responsiveStyles: {
            large: {
              maxWidth: '1000px',
              margin: '0 auto'
            }
          },
          children: [
            {
              id: 'features-title',
              '@type': '@builder.io/sdk:Element',
              component: {
                name: 'Text',
                options: {
                  text: 'Recursos Poderosos',
                  tag: 'h2'
                }
              },
              responsiveStyles: {
                large: {
                  fontSize: '36px',
                  fontWeight: '700',
                  color: '#1e293b',
                  textAlign: 'center',
                  marginBottom: '60px'
                },
                medium: {
                  fontSize: '32px',
                  marginBottom: '50px'
                },
                small: {
                  fontSize: '28px',
                  marginBottom: '40px'
                }
              }
            },
            {
              id: 'features-columns',
              '@type': '@builder.io/sdk:Element',
              component: {
                name: 'Columns',
                options: {
                  gutterSize: 40,
                  stackColumnsAt: 'tablet',
                  columns: [
                    {
                      width: 33.33,
                      blocks: [
                        {
                          id: 'feature-1-title',
                          '@type': '@builder.io/sdk:Element',
                          component: {
                            name: 'Text',
                            options: {
                              text: '🚀 Performance',
                              tag: 'h3'
                            }
                          },
                          responsiveStyles: {
                            large: {
                              fontSize: '24px',
                              fontWeight: '600',
                              color: '#1e293b',
                              marginBottom: '16px',
                              textAlign: 'center'
                            }
                          }
                        },
                        {
                          id: 'feature-1-desc',
                          '@type': '@builder.io/sdk:Element',
                          component: {
                            name: 'Text',
                            options: {
                              text: 'Velocidade impressionante que mantém seus usuários engajados e satisfeitos com a experiência.',
                              tag: 'p'
                            }
                          },
                          responsiveStyles: {
                            large: {
                              fontSize: '16px',
                              color: '#64748b',
                              lineHeight: '1.6',
                              textAlign: 'center'
                            }
                          }
                        }
                      ]
                    },
                    {
                      width: 33.33,
                      blocks: [
                        {
                          id: 'feature-2-title',
                          '@type': '@builder.io/sdk:Element',
                          component: {
                            name: 'Text',
                            options: {
                              text: '🔒 Segurança',
                              tag: 'h3'
                            }
                          },
                          responsiveStyles: {
                            large: {
                              fontSize: '24px',
                              fontWeight: '600',
                              color: '#1e293b',
                              marginBottom: '16px',
                              textAlign: 'center'
                            }
                          }
                        },
                        {
                          id: 'feature-2-desc',
                          '@type': '@builder.io/sdk:Element',
                          component: {
                            name: 'Text',
                            options: {
                              text: 'Proteção de dados de nível empresarial com criptografia avançada e monitoramento contínuo.',
                              tag: 'p'
                            }
                          },
                          responsiveStyles: {
                            large: {
                              fontSize: '16px',
                              color: '#64748b',
                              lineHeight: '1.6',
                              textAlign: 'center'
                            }
                          }
                        }
                      ]
                    },
                    {
                      width: 33.33,
                      blocks: [
                        {
                          id: 'feature-3-title',
                          '@type': '@builder.io/sdk:Element',
                          component: {
                            name: 'Text',
                            options: {
                              text: '⚡ Simplicidade',
                              tag: 'h3'
                            }
                          },
                          responsiveStyles: {
                            large: {
                              fontSize: '24px',
                              fontWeight: '600',
                              color: '#1e293b',
                              marginBottom: '16px',
                              textAlign: 'center'
                            }
                          }
                        },
                        {
                          id: 'feature-3-desc',
                          '@type': '@builder.io/sdk:Element',
                          component: {
                            name: 'Text',
                            options: {
                              text: 'Interface intuitiva que permite resultados profissionais sem curva de aprendizado complexa.',
                              tag: 'p'
                            }
                          },
                          responsiveStyles: {
                            large: {
                              fontSize: '16px',
                              color: '#64748b',
                              lineHeight: '1.6',
                              textAlign: 'center'
                            }
                          }
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

    // 🟦 SEÇÃO TESTE: RECURSOS PODEROSOS - AZUL (#2563eb)
    {
      id: 'recursos-section',
      '@type': '@builder.io/sdk:Element',
      component: {
        name: 'Section',
        options: {
          maxWidth: 1200
        }
      },
      responsiveStyles: {
        large: {
          backgroundColor: '#2563eb',
          padding: '80px 0',
          textAlign: 'center'
        },
        medium: {
          padding: '60px 0'
        },
        small: {
          padding: '40px 0'
        }
      },
      children: [
        {
          id: 'recursos-container',
          '@type': '@builder.io/sdk:Element',
          component: {
            name: 'Container',
            options: {
              maxWidth: 1000
            }
          },
          responsiveStyles: {
            large: {
              margin: '0 auto',
              padding: '0 20px'
            }
          },
          children: [
            // Título da seção
            {
              id: 'recursos-title',
              '@type': '@builder.io/sdk:Element',
              component: {
                name: 'Text',
                options: {
                  text: 'Recursos Poderosos',
                  tag: 'h2'
                }
              },
              responsiveStyles: {
                large: {
                  fontSize: '48px',
                  fontWeight: '700',
                  color: '#ffffff',
                  marginBottom: '60px',
                  lineHeight: '1.2'
                }
              }
            },
            
            // Colunas de recursos
            {
              id: 'recursos-columns',
              '@type': '@builder.io/sdk:Element',
              component: {
                name: 'Columns',
                options: {
                  columns: [
                    {
                      width: 33.33,
                      blocks: [
                        {
                          id: 'recurso-1-title',
                          '@type': '@builder.io/sdk:Element',
                          component: {
                            name: 'Text',
                            options: {
                              text: '🚀 Velocidade',
                              tag: 'h3'
                            }
                          },
                          responsiveStyles: {
                            large: {
                              fontSize: '28px',
                              fontWeight: '600',
                              color: '#ffffff',
                              marginBottom: '20px',
                              textAlign: 'center'
                            }
                          }
                        },
                        {
                          id: 'recurso-1-desc',
                          '@type': '@builder.io/sdk:Element',
                          component: {
                            name: 'Text',
                            options: {
                              text: 'Performance otimizada que garante carregamento instantâneo em qualquer dispositivo.',
                              tag: 'p'
                            }
                          },
                          responsiveStyles: {
                            large: {
                              fontSize: '16px',
                              color: '#e5e7eb',
                              lineHeight: '1.6',
                              textAlign: 'center'
                            }
                          }
                        }
                      ]
                    },
                    {
                      width: 33.33,
                      blocks: [
                        {
                          id: 'recurso-2-title',
                          '@type': '@builder.io/sdk:Element',
                          component: {
                            name: 'Text',
                            options: {
                              text: '🔒 Confiabilidade',
                              tag: 'h3'
                            }
                          },
                          responsiveStyles: {
                            large: {
                              fontSize: '28px',
                              fontWeight: '600',
                              color: '#ffffff',
                              marginBottom: '20px',
                              textAlign: 'center'
                            }
                          }
                        },
                        {
                          id: 'recurso-2-desc',
                          '@type': '@builder.io/sdk:Element',
                          component: {
                            name: 'Text',
                            options: {
                              text: 'Sistema robusto com 99.9% de uptime e backup automático de todos os dados.',
                              tag: 'p'
                            }
                          },
                          responsiveStyles: {
                            large: {
                              fontSize: '16px',
                              color: '#e5e7eb',
                              lineHeight: '1.6',
                              textAlign: 'center'
                            }
                          }
                        }
                      ]
                    },
                    {
                      width: 33.33,
                      blocks: [
                        {
                          id: 'recurso-3-title',
                          '@type': '@builder.io/sdk:Element',
                          component: {
                            name: 'Text',
                            options: {
                              text: '⚡ Inovação',
                              tag: 'h3'
                            }
                          },
                          responsiveStyles: {
                            large: {
                              fontSize: '28px',
                              fontWeight: '600',
                              color: '#ffffff',
                              marginBottom: '20px',
                              textAlign: 'center'
                            }
                          }
                        },
                        {
                          id: 'recurso-3-desc',
                          '@type': '@builder.io/sdk:Element',
                          component: {
                            name: 'Text',
                            options: {
                              text: 'Tecnologia de ponta com atualizações constantes e recursos exclusivos.',
                              tag: 'p'
                            }
                          },
                          responsiveStyles: {
                            large: {
                              fontSize: '16px',
                              color: '#e5e7eb',
                              lineHeight: '1.6',
                              textAlign: 'center'
                            }
                          }
                        }
                      ]
                    }
                  ],
                  gutterSize: 40,
                  stackColumnsAt: 'tablet',
                  reverseColumnsWhenStacked: false
                }
              }
            }
          ]
        }
      ]
    },

    // 🟢 SEÇÃO 3: TESTIMONIAL - VERDE (#059669)
    {
      id: 'testimonial-section',
      '@type': '@builder.io/sdk:Element',
      component: {
        name: 'Section',
        options: {
          maxWidth: 1200
        }
      },
      responsiveStyles: {
        large: {
          backgroundColor: '#059669',
          padding: '100px 0',
          width: '100%'
        },
        medium: {
          backgroundColor: '#059669',
          padding: '80px 0'
        },
        small: {
          backgroundColor: '#059669',
          padding: '60px 0'
        }
      },
      children: [
        {
          id: 'testimonial-container',
          '@type': '@builder.io/sdk:Element',
          component: {
            name: 'Container',
            options: {
              maxWidth: 800
            }
          },
          responsiveStyles: {
            large: {
              maxWidth: '800px',
              margin: '0 auto',
              textAlign: 'center'
            }
          },
          children: [
            {
              id: 'testimonial-quote',
              '@type': '@builder.io/sdk:Element',
              component: {
                name: 'Text',
                options: {
                  text: '"Esta plataforma revolucionou nossa forma de trabalhar. Resultados incríveis em tempo recorde!"',
                  tag: 'blockquote'
                }
              },
              responsiveStyles: {
                large: {
                  fontSize: '32px',
                  fontWeight: '600',
                  color: '#ffffff',
                  lineHeight: '1.4',
                  marginBottom: '32px',
                  fontStyle: 'italic'
                },
                medium: {
                  fontSize: '28px',
                  marginBottom: '28px'
                },
                small: {
                  fontSize: '24px',
                  marginBottom: '24px'
                }
              }
            },
            {
              id: 'testimonial-author',
              '@type': '@builder.io/sdk:Element',
              component: {
                name: 'Text',
                options: {
                  text: 'Ana Carolina Silva',
                  tag: 'p'
                }
              },
              responsiveStyles: {
                large: {
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: '8px'
                }
              }
            },
            {
              id: 'testimonial-position',
              '@type': '@builder.io/sdk:Element',
              component: {
                name: 'Text',
                options: {
                  text: 'CEO, TechStart Solutions',
                  tag: 'p'
                }
              },
              responsiveStyles: {
                large: {
                  fontSize: '16px',
                  color: '#d1fae5',
                  fontWeight: '400'
                }
              }
            }
          ]
        }
      ]
    },

    // ⚫ SEÇÃO 4: CTA - CINZA ESCURO (#1f2937)
    {
      id: 'cta-section',
      '@type': '@builder.io/sdk:Element',
      component: {
        name: 'Section',
        options: {
          maxWidth: 1200
        }
      },
      responsiveStyles: {
        large: {
          backgroundColor: '#1f2937',
          padding: '100px 0',
          width: '100%'
        },
        medium: {
          backgroundColor: '#1f2937',
          padding: '80px 0'
        },
        small: {
          backgroundColor: '#1f2937',
          padding: '60px 0'
        }
      },
      children: [
        {
          id: 'cta-container',
          '@type': '@builder.io/sdk:Element',
          component: {
            name: 'Container',
            options: {
              maxWidth: 600
            }
          },
          responsiveStyles: {
            large: {
              maxWidth: '600px',
              margin: '0 auto',
              textAlign: 'center'
            }
          },
          children: [
            {
              id: 'cta-title',
              '@type': '@builder.io/sdk:Element',
              component: {
                name: 'Text',
                options: {
                  text: 'Pronto para Começar?',
                  tag: 'h2'
                }
              },
              responsiveStyles: {
                large: {
                  fontSize: '40px',
                  fontWeight: '700',
                  color: '#ffffff',
                  marginBottom: '24px',
                  lineHeight: '1.2'
                },
                medium: {
                  fontSize: '34px',
                  marginBottom: '20px'
                },
                small: {
                  fontSize: '28px',
                  marginBottom: '16px'
                }
              }
            },
            {
              id: 'cta-description',
              '@type': '@builder.io/sdk:Element',
              component: {
                name: 'Text',
                options: {
                  text: 'Junte-se a milhares de empresas que já transformaram seus resultados. Comece sua jornada hoje mesmo.',
                  tag: 'p'
                }
              },
              responsiveStyles: {
                large: {
                  fontSize: '18px',
                  color: '#d1d5db',
                  marginBottom: '40px',
                  lineHeight: '1.6'
                },
                medium: {
                  fontSize: '16px',
                  marginBottom: '32px'
                },
                small: {
                  fontSize: '14px',
                  marginBottom: '24px'
                }
              }
            },
            {
              id: 'cta-button-primary',
              '@type': '@builder.io/sdk:Element',
              component: {
                name: 'Button',
                options: {
                  text: 'Começar Gratuitamente',
                  href: '/signup'
                }
              },
              responsiveStyles: {
                large: {
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  padding: '16px 32px',
                  fontSize: '18px',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'inline-block',
                  marginRight: '16px'
                }
              }
            },
            {
              id: 'cta-button-secondary',
              '@type': '@builder.io/sdk:Element',
              component: {
                name: 'Button',
                options: {
                  text: 'Ver Demonstração',
                  href: '/demo'
                }
              },
              responsiveStyles: {
                large: {
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  padding: '16px 32px',
                  fontSize: '18px',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: '2px solid #ffffff',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'inline-block'
                }
              }
            }
          ]
        }
      ]
    }
  ]
};