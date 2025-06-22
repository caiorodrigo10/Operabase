import React from 'react';
import { Editor, Frame, Element } from '@craftjs/core';
import { createTheme, ThemeProvider } from '@mui/material';
import { Link } from 'wouter';
import { ArrowLeft, Eye, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import Landing example components
import { Viewport, RenderNode } from '../components/craft/editor';
import { Container, Text } from '../components/craft/selectors';
import { Button as CraftButton } from '../components/craft/selectors/Button';
import { Custom1, OnlyButtons } from '../components/craft/selectors/Custom1';
import { Custom2, Custom2VideoDrop } from '../components/craft/selectors/Custom2';
import { Custom3, Custom3BtnDrop } from '../components/craft/selectors/Custom3';
import { Video } from '../components/craft/selectors/Video';

const theme = createTheme({
  typography: {
    fontFamily: [
      'acumin-pro',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

export default function FunilPageEditor() {
  console.log('🔧 Abrindo editor padrão para página:', "Landing Page");

  return (
    <ThemeProvider theme={theme}>
      <div className="h-full min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 fixed top-0 left-0 right-0 z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/funis/1">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Funil
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Editor Landing Page
                </h1>
                <p className="text-sm text-gray-500">
                  Editor oficial Craft.js Landing Example
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
              
              <Button size="sm">
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content - Add top padding for fixed header */}
        <div className="pt-20">
          <Editor
            resolver={{
              Container,
              Text,
              Custom1,
              Custom2,
              Custom2VideoDrop,
              Custom3,
              Custom3BtnDrop,
              OnlyButtons,
              Button: CraftButton,
              Video,
            }}
            enabled={false}
            onRender={RenderNode}
          >
            <Viewport>
              <Frame>
                <Element
                  canvas
                  is={Container}
                  width="800px"
                  height="auto"
                  background={{ r: 255, g: 255, b: 255, a: 1 }}
                  padding={['40', '40', '40', '40']}
                  custom={{ displayName: 'App' }}
                >
                  <Element
                    canvas
                    is={Container}
                    flexDirection="row"
                    width="100%"
                    height="auto"
                    padding={['40', '40', '40', '40']}
                    margin={['0', '0', '40', '0']}
                    custom={{ displayName: 'Introduction' }}
                  >
                    <Element
                      canvas
                      is={Container}
                      width="40%"
                      height="100%"
                      padding={['0', '20', '0', '20']}
                      custom={{ displayName: 'Heading' }}
                    >
                      <Text
                        fontSize="23"
                        fontWeight="400"
                        text="Craft.js é um framework React para construir editores de página drag-n-drop poderosos e ricos em recursos."
                      />
                    </Element>
                    <Element
                      canvas
                      is={Container}
                      width="60%"
                      height="100%"
                      padding={['0', '20', '0', '20']}
                      custom={{ displayName: 'Description' }}
                    >
                      <Text
                        fontSize="14"
                        fontWeight="400"
                        text="Tudo que você vê aqui, incluindo o próprio editor, é feito de componentes React. Craft.js vem apenas com os blocos de construção para um editor de página."
                      />
                    </Element>
                  </Element>

                  <Element
                    canvas
                    is={Container}
                    background={{ r: 39, g: 41, b: 41, a: 1 }}
                    flexDirection="column"
                    width="100%"
                    height="auto"
                    padding={['40', '40', '40', '40']}
                    margin={['0', '0', '40', '0']}
                    custom={{ displayName: 'Hero' }}
                  >
                    <Text
                      fontSize="36"
                      fontWeight="700"
                      color={{ r: "255", g: "255", b: "255", a: "1" }}
                      text="Crie Páginas Incríveis"
                      textAlign="center"
                    />
                    
                    <Element
                      canvas
                      is={Container}
                      flexDirection="row"
                      width="100%"
                      height="auto"
                      padding={['20', '0', '0', '0']}
                      custom={{ displayName: 'Features' }}
                    >
                      <Element
                        canvas
                        is={Container}
                        width="45%"
                        height="100%"
                        padding={['0', '20', '0', '0']}
                        custom={{ displayName: 'Left' }}
                      >
                        <Custom1
                          background={{
                            r: 78,
                            g: 78,
                            b: 78,
                            a: 1,
                          }}
                          height="300px"
                          width="100%"
                          padding={['20', '20', '20', '20']}
                          shadow={20}
                        />
                      </Element>
                      
                      <Element
                        canvas
                        background={{
                          r: 0,
                          g: 0,
                          b: 0,
                          a: 0,
                        }}
                        is={Container}
                        padding={['0', '0', '0', '20']}
                        flexDirection="column"
                        width="55%"
                        custom={{ displayName: 'Right' }}
                      >
                        <Custom2
                          background={{
                            r: 108,
                            g: 126,
                            b: 131,
                            a: 1,
                          }}
                          height="125px"
                          width="100%"
                          padding={['0', '0', '0', '20']}
                          margin={['0', '0', '0', '0']}
                          shadow={40}
                          flexDirection="row"
                          alignItems="center"
                        />
                        <Custom3
                          background={{
                            r: 134,
                            g: 187,
                            b: 201,
                            a: 1,
                          }}
                          height="auto"
                          width="100%"
                          padding={['20', '20', '20', '20']}
                          margin={['20', '0', '0', '0']}
                          shadow={40}
                          flexDirection="column"
                        />
                      </Element>
                    </Element>
                  </Element>
                </Element>
              </Frame>
            </Viewport>
          </Editor>
        </div>
      </div>
    </ThemeProvider>
  );
}