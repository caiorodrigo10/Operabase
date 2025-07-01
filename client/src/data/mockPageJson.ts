/**
 * Mock Page JSON - Clínica Dr. Caio + Box Widget Demo
 * Página original da clínica com nova seção demonstrando Box Widget
 */

export const mockPageJson = {
  "id": "clinica-dr-caio-final",
  "blocks": [
    {
      "id": "hero-section",
      "@type": "@builder.io/sdk:Element",
      "component": {
        "name": "Section",
        "options": {
          "maxWidth": 1200
        }
      },
      "responsiveStyles": {
        "large": {
          "background": "linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #0ea5e9 100%)",
          "padding": "100px 0",
          "width": "100%"
        },
        "medium": {
          "padding": "80px 0"
        },
        "small": {
          "padding": "60px 0"
        }
      },
      "children": [
        {
          "id": "hero-container",
          "@type": "@builder.io/sdk:Element",
          "component": {
            "name": "Container",
            "options": {
              "maxWidth": 1200
            }
          },
          "responsiveStyles": {
            "large": {
              "maxWidth": "1200px",
              "margin": "0 auto",
              "padding": "0 40px"
            }
          },
          "children": [
            {
              "id": "hero-columns",
              "@type": "@builder.io/sdk:Element",
              "component": {
                "name": "Columns",
                "options": {
                  "gutterSize": 60,
                  "stackColumnsAt": "tablet",
                  "columns": [
                    {
                      "width": 65,
                      "blocks": [
                        {
                          "id": "hero-content",
                          "@type": "@builder.io/sdk:Element",
                          "component": {
                            "name": "Container",
                            "options": {}
                          },
                          "responsiveStyles": {
                            "large": {
                              "paddingTop": "60px",
                              "paddingBottom": "60px"
                            }
                          },
                          "children": [
                            {
                              "id": "hero-badge",
                              "@type": "@builder.io/sdk:Element",
                              "component": {
                                "name": "Text",
                                "options": {
                                  "text": "✨ Clínica Premium",
                                  "tag": "span"
                                }
                              },
                              "responsiveStyles": {
                                "large": {
                                  "backgroundColor": "rgba(255, 255, 255, 0.1)",
                                  "color": "#60a5fa",
                                  "padding": "8px 16px",
                                  "borderRadius": "20px",
                                  "fontSize": "14px",
                                  "fontWeight": "500",
                                  "display": "inline-block",
                                  "marginBottom": "24px"
                                }
                              }
                            },
                            {
                              "id": "hero-title",
                              "@type": "@builder.io/sdk:Element",
                              "component": {
                                "name": "Text",
                                "options": {
                                  "text": "Dr. Caio",
                                  "tag": "h1"
                                }
                              },
                              "responsiveStyles": {
                                "large": {
                                  "fontSize": "64px",
                                  "fontWeight": "900",
                                  "color": "#ffffff",
                                  "marginBottom": "16px",
                                  "lineHeight": "1.1",
                                  "letterSpacing": "-2px"
                                },
                                "medium": {
                                  "fontSize": "48px"
                                },
                                "small": {
                                  "fontSize": "36px"
                                }
                              }
                            },
                            {
                              "id": "hero-subtitle",
                              "@type": "@builder.io/sdk:Element",
                              "component": {
                                "name": "Text",
                                "options": {
                                  "text": "Revolucionando Sorrisos",
                                  "tag": "h2"
                                }
                              },
                              "responsiveStyles": {
                                "large": {
                                  "fontSize": "20px",
                                  "fontWeight": "300",
                                  "color": "#94a3b8",
                                  "marginBottom": "32px",
                                  "letterSpacing": "3px",
                                  "textTransform": "uppercase"
                                }
                              }
                            },
                            {
                              "id": "hero-description",
                              "@type": "@builder.io/sdk:Element",
                              "component": {
                                "name": "Text",
                                "options": {
                                  "text": "Onde tecnologia de ponta encontra arte dental. Transformamos vidas através de sorrisos únicos e tratamentos personalizados.",
                                  "tag": "p"
                                }
                              },
                              "responsiveStyles": {
                                "large": {
                                  "fontSize": "18px",
                                  "color": "#cbd5e1",
                                  "lineHeight": "1.7",
                                  "marginBottom": "48px",
                                  "maxWidth": "500px"
                                }
                              }
                            },
                            {
                              "id": "hero-button",
                              "@type": "@builder.io/sdk:Element",
                              "component": {
                                "name": "Button",
                                "options": {
                                  "text": "Agendar Avaliação",
                                  "href": "/agendamento"
                                }
                              },
                              "responsiveStyles": {
                                "large": {
                                  "background": "linear-gradient(45deg, #f59e0b, #f97316)",
                                  "color": "#ffffff",
                                  "padding": "16px 32px",
                                  "fontSize": "16px",
                                  "fontWeight": "600",
                                  "borderRadius": "8px",
                                  "border": "none",
                                  "cursor": "pointer",
                                  "textDecoration": "none",
                                  "display": "inline-block",
                                  "boxShadow": "0 10px 25px rgba(245, 158, 11, 0.3)"
                                }
                              }
                            }
                          ]
                        }
                      ]
                    },
                    {
                      "width": 35,
                      "blocks": [
                        {
                          "id": "hero-stats",
                          "@type": "@builder.io/sdk:Element",
                          "component": {
                            "name": "Container",
                            "options": {}
                          },
                          "responsiveStyles": {
                            "large": {
                              "display": "flex",
                              "alignItems": "center",
                              "justifyContent": "center",
                              "paddingTop": "60px",
                              "paddingBottom": "60px"
                            }
                          },
                          "children": [
                            {
                              "id": "stats-card",
                              "@type": "@builder.io/sdk:Element",
                              "component": {
                                "name": "Container",
                                "options": {}
                              },
                              "responsiveStyles": {
                                "large": {
                                  "backgroundColor": "rgba(255, 255, 255, 0.1)",
                                  "padding": "40px 30px",
                                  "borderRadius": "20px",
                                  "textAlign": "center",
                                  "border": "1px solid rgba(255, 255, 255, 0.1)"
                                }
                              },
                              "children": [
                                {
                                  "id": "stats-years",
                                  "@type": "@builder.io/sdk:Element",
                                  "component": {
                                    "name": "Text",
                                    "options": {
                                      "text": "15+",
                                      "tag": "h3"
                                    }
                                  },
                                  "responsiveStyles": {
                                    "large": {
                                      "fontSize": "48px",
                                      "fontWeight": "700",
                                      "color": "#ffffff",
                                      "marginBottom": "8px",
                                      "lineHeight": "1"
                                    }
                                  }
                                },
                                {
                                  "id": "stats-years-label",
                                  "@type": "@builder.io/sdk:Element",
                                  "component": {
                                    "name": "Text",
                                    "options": {
                                      "text": "Anos de Experiência",
                                      "tag": "p"
                                    }
                                  },
                                  "responsiveStyles": {
                                    "large": {
                                      "color": "#94a3b8",
                                      "fontSize": "14px",
                                      "marginBottom": "32px"
                                    }
                                  }
                                },
                                {
                                  "id": "stats-patients",
                                  "@type": "@builder.io/sdk:Element",
                                  "component": {
                                    "name": "Text",
                                    "options": {
                                      "text": "5000+",
                                      "tag": "h4"
                                    }
                                  },
                                  "responsiveStyles": {
                                    "large": {
                                      "fontSize": "32px",
                                      "fontWeight": "600",
                                      "color": "#f59e0b",
                                      "marginBottom": "8px",
                                      "lineHeight": "1"
                                    }
                                  }
                                },
                                {
                                  "id": "stats-patients-label",
                                  "@type": "@builder.io/sdk:Element",
                                  "component": {
                                    "name": "Text",
                                    "options": {
                                      "text": "Pacientes Atendidos",
                                      "tag": "p"
                                    }
                                  },
                                  "responsiveStyles": {
                                    "large": {
                                      "color": "#94a3b8",
                                      "fontSize": "14px"
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
                }
              }
            }
          ]
        }
      ]
    },
    // 🎨 NOVA SEÇÃO: BOX WIDGET DEMO
    {
      "id": "box-demo-section",
      "@type": "@builder.io/sdk:Element",
      "component": {
        "name": "Section",
        "options": {
          "maxWidth": 1200
        }
      },
      "responsiveStyles": {
        "large": {
          "backgroundColor": "#f1f5f9",
          "padding": "80px 0",
          "width": "100%"
        }
      },
      "children": [
        {
          "id": "box-demo-container",
          "@type": "@builder.io/sdk:Element",
          "component": {
            "name": "Container",
            "options": {
              "maxWidth": 1200
            }
          },
          "responsiveStyles": {
            "large": {
              "maxWidth": "1200px",
              "margin": "0 auto",
              "padding": "0 40px"
            }
          },
          "children": [
            {
              "id": "box-demo-title",
              "@type": "@builder.io/sdk:Element",
              "component": {
                "name": "Text",
                "options": {
                  "text": "Box Widget Demo",
                  "tag": "h2"
                }
              },
              "responsiveStyles": {
                "large": {
                  "fontSize": "36px",
                  "fontWeight": "700",
                  "color": "#1e293b",
                  "textAlign": "center",
                  "marginBottom": "16px"
                }
              }
            },
            {
              "id": "box-demo-subtitle",
              "@type": "@builder.io/sdk:Element",
              "component": {
                "name": "Text",
                "options": {
                  "text": "Containers flexíveis com controles visuais completos",
                  "tag": "p"
                }
              },
              "responsiveStyles": {
                "large": {
                  "fontSize": "18px",
                  "color": "#64748b",
                  "textAlign": "center",
                  "marginBottom": "60px"
                }
              }
            },
            {
              "id": "box-cards-container",
              "@type": "@builder.io/sdk:Element",
              "component": {
                "name": "Box",
                "options": {
                  "display": "flex",
                  "flexDirection": "row",
                  "justifyContent": "space-between",
                  "gap": 30
                }
              },
              "responsiveStyles": {
                "medium": {
                  "flexDirection": "column"
                },
                "small": {
                  "flexDirection": "column",
                  "gap": "20px"
                }
              },
              "children": [
                {
                  "id": "box-card-design",
                  "@type": "@builder.io/sdk:Element",
                  "component": {
                    "name": "Box",
                    "options": {
                      "backgroundColor": "#ffffff",
                      "borderRadius": 16,
                      "boxShadow": "0 4px 12px rgba(0, 0, 0, 0.1)",
                      "paddingTop": 40,
                      "paddingBottom": 40,
                      "paddingLeft": 32,
                      "paddingRight": 32,
                      "display": "flex",
                      "flexDirection": "column",
                      "alignItems": "center",
                      "gap": 24,
                      "width": "100%",
                      "border": "1px solid #e2e8f0"
                    }
                  },
                  "children": [
                    {
                      "id": "card-icon-design",
                      "@type": "@builder.io/sdk:Element",
                      "component": {
                        "name": "Box",
                        "options": {
                          "backgroundColor": "#3b82f6",
                          "borderRadius": 50,
                          "width": 64,
                          "height": 64,
                          "display": "flex",
                          "alignItems": "center",
                          "justifyContent": "center"
                        }
                      },
                      "children": [
                        {
                          "id": "icon-text-design",
                          "@type": "@builder.io/sdk:Element",
                          "component": {
                            "name": "Text",
                            "options": {
                              "text": "🎨",
                              "tag": "span"
                            }
                          },
                          "responsiveStyles": {
                            "large": {
                              "fontSize": "24px"
                            }
                          }
                        }
                      ]
                    },
                    {
                      "id": "card-title-design",
                      "@type": "@builder.io/sdk:Element",
                      "component": {
                        "name": "Text",
                        "options": {
                          "text": "Design Flexível",
                          "tag": "h3"
                        }
                      },
                      "responsiveStyles": {
                        "large": {
                          "fontSize": "20px",
                          "fontWeight": "600",
                          "color": "#1e293b",
                          "textAlign": "center",
                          "marginBottom": "12px"
                        }
                      }
                    },
                    {
                      "id": "card-desc-design",
                      "@type": "@builder.io/sdk:Element",
                      "component": {
                        "name": "Text",
                        "options": {
                          "text": "Controles completos de layout, background, borders e spacing em um único componente",
                          "tag": "p"
                        }
                      },
                      "responsiveStyles": {
                        "large": {
                          "fontSize": "14px",
                          "color": "#64748b",
                          "textAlign": "center",
                          "lineHeight": "1.5"
                        }
                      }
                    }
                  ]
                },
                {
                  "id": "box-card-responsive",
                  "@type": "@builder.io/sdk:Element",
                  "component": {
                    "name": "Box",
                    "options": {
                      "backgroundColor": "#ffffff",
                      "borderRadius": 16,
                      "boxShadow": "0 4px 12px rgba(0, 0, 0, 0.1)",
                      "paddingTop": 40,
                      "paddingBottom": 40,
                      "paddingLeft": 32,
                      "paddingRight": 32,
                      "display": "flex",
                      "flexDirection": "column",
                      "alignItems": "center",
                      "gap": 24,
                      "width": "100%",
                      "border": "1px solid #e2e8f0"
                    }
                  },
                  "children": [
                    {
                      "id": "card-icon-responsive",
                      "@type": "@builder.io/sdk:Element",
                      "component": {
                        "name": "Box",
                        "options": {
                          "backgroundColor": "#10b981",
                          "borderRadius": 50,
                          "width": 64,
                          "height": 64,
                          "display": "flex",
                          "alignItems": "center",
                          "justifyContent": "center"
                        }
                      },
                      "children": [
                        {
                          "id": "icon-text-responsive",
                          "@type": "@builder.io/sdk:Element",
                          "component": {
                            "name": "Text",
                            "options": {
                              "text": "📱",
                              "tag": "span"
                            }
                          },
                          "responsiveStyles": {
                            "large": {
                              "fontSize": "24px"
                            }
                          }
                        }
                      ]
                    },
                    {
                      "id": "card-title-responsive",
                      "@type": "@builder.io/sdk:Element",
                      "component": {
                        "name": "Text",
                        "options": {
                          "text": "Responsivo",
                          "tag": "h3"
                        }
                      },
                      "responsiveStyles": {
                        "large": {
                          "fontSize": "20px",
                          "fontWeight": "600",
                          "color": "#1e293b",
                          "textAlign": "center",
                          "marginBottom": "12px"
                        }
                      }
                    },
                    {
                      "id": "card-desc-responsive",
                      "@type": "@builder.io/sdk:Element",
                      "component": {
                        "name": "Text",
                        "options": {
                          "text": "Adapta automaticamente o layout para desktop, tablet e mobile usando responsiveStyles",
                          "tag": "p"
                        }
                      },
                      "responsiveStyles": {
                        "large": {
                          "fontSize": "14px",
                          "color": "#64748b",
                          "textAlign": "center",
                          "lineHeight": "1.5"
                        }
                      }
                    }
                  ]
                },
                {
                  "id": "box-card-performance",
                  "@type": "@builder.io/sdk:Element",
                  "component": {
                    "name": "Box",
                    "options": {
                      "backgroundColor": "#ffffff",
                      "borderRadius": 16,
                      "boxShadow": "0 4px 12px rgba(0, 0, 0, 0.1)",
                      "paddingTop": 40,
                      "paddingBottom": 40,
                      "paddingLeft": 32,
                      "paddingRight": 32,
                      "display": "flex",
                      "flexDirection": "column",
                      "alignItems": "center",
                      "gap": 24,
                      "width": "100%",
                      "border": "1px solid #e2e8f0"
                    }
                  },
                  "children": [
                    {
                      "id": "card-icon-performance",
                      "@type": "@builder.io/sdk:Element",
                      "component": {
                        "name": "Box",
                        "options": {
                          "backgroundColor": "#f59e0b",
                          "borderRadius": 50,
                          "width": 64,
                          "height": 64,
                          "display": "flex",
                          "alignItems": "center",
                          "justifyContent": "center"
                        }
                      },
                      "children": [
                        {
                          "id": "icon-text-performance",
                          "@type": "@builder.io/sdk:Element",
                          "component": {
                            "name": "Text",
                            "options": {
                              "text": "⚡",
                              "tag": "span"
                            }
                          },
                          "responsiveStyles": {
                            "large": {
                              "fontSize": "24px"
                            }
                          }
                        }
                      ]
                    },
                    {
                      "id": "card-title-performance",
                      "@type": "@builder.io/sdk:Element",
                      "component": {
                        "name": "Text",
                        "options": {
                          "text": "Otimizado",
                          "tag": "h3"
                        }
                      },
                      "responsiveStyles": {
                        "large": {
                          "fontSize": "20px",
                          "fontWeight": "600",
                          "color": "#1e293b",
                          "textAlign": "center",
                          "marginBottom": "12px"
                        }
                      }
                    },
                    {
                      "id": "card-desc-performance",
                      "@type": "@builder.io/sdk:Element",
                      "component": {
                        "name": "Text",
                        "options": {
                          "text": "CSS-in-JS otimizado com estilos aplicados apenas onde necessário para máxima performance",
                          "tag": "p"
                        }
                      },
                      "responsiveStyles": {
                        "large": {
                          "fontSize": "14px",
                          "color": "#64748b",
                          "textAlign": "center",
                          "lineHeight": "1.5"
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
    }
  ]
};