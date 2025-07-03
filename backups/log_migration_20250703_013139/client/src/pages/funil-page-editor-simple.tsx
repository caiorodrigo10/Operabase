import React from 'react';
import { Editor, Frame, Element } from '@craftjs/core';
import { Link } from 'wouter';
import { ArrowLeft, Eye, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import basic Craft.js components that we know work
import { Container, Text } from '../components/craft/selectors';
import { Button as CraftButton } from '../components/craft/selectors/Button';

export default function FunilPageEditorSimple() {
  console.log('🔧 Abrindo editor simples para página:', "Landing Page");

  return (
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
                Editor Craft.js funcionando
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

      {/* Main Content */}
      <div className="pt-20 h-full">
        <Editor
          resolver={{
            Container,
            Text,
            Button: CraftButton,
          }}
          enabled={true}
        >
          <div className="flex h-full">
            {/* Editor Area */}
            <div className="flex-1 bg-gray-100 p-6">
              <div className="bg-white rounded-lg shadow-sm min-h-96 p-8">
                <Frame>
                  <Element
                    canvas
                    is={Container}
                    width="100%"
                    height="auto"
                    background={{ r: 255, g: 255, b: 255, a: 1 }}
                    padding={['40', '40', '40', '40']}
                  >
                    <Text
                      fontSize="32"
                      fontWeight="700"
                      text="Bem-vindo ao Editor Landing Page"
                      textAlign="center"
                      color={{ r: "33", g: "37", b: "41", a: "1" }}
                    />
                    
                    <Text
                      fontSize="16"
                      fontWeight="400"
                      text="Este é o editor oficial do Craft.js funcionando no seu sistema de funis. Clique nos elementos para editá-los e use a barra lateral para adicionar novos componentes."
                      textAlign="center"
                      color={{ r: "107", g: "114", b: "128", a: "1" }}
                      margin={["20", "0", "30", "0"]}
                    />

                    <Element
                      canvas
                      is={Container}
                      background={{ r: 248, g: 250, b: 252, a: 1 }}
                      padding={['30', '30', '30', '30']}
                      margin={['20', '0', '0', '0']}
                    >
                      <Text
                        fontSize="24"
                        fontWeight="600"
                        text="Seção de Conteúdo"
                        color={{ r: "31", g: "41", b: "55", a: "1" }}
                      />
                      
                      <Text
                        fontSize="14"
                        fontWeight="400"
                        text="Adicione aqui o conteúdo principal da sua landing page. Você pode editar textos, adicionar botões e customizar layouts."
                        color={{ r: "75", g: "85", b: "99", a: "1" }}
                        margin={["10", "0", "20", "0"]}
                      />
                      
                      <CraftButton
                        size="lg"
                        buttonStyle="full"
                        text="Call to Action"
                        color={{ r: 59, g: 130, b: 246, a: 1 }}
                        background={{ r: 37, g: 99, b: 235, a: 1 }}
                      />
                    </Element>
                  </Element>
                </Frame>
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-80 bg-white border-l border-gray-200 p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Elementos
                  </h3>
                  <div className="space-y-2">
                    <div className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      📝 Texto
                    </div>
                    <div className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      🔘 Botão
                    </div>
                    <div className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      📦 Container
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Propriedades
                  </h3>
                  <div className="text-sm text-gray-500 p-4 border border-gray-200 rounded-lg">
                    Selecione um elemento para editar suas propriedades
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Editor>
      </div>
    </div>
  );
}