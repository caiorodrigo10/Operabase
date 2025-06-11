import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Calendar, BarChart3, MessageCircle, Settings } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Painel Espelho da Livia
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Plataforma completa de gestão para clínicas de saúde com inteligência artificial adaptável, 
            projetada para múltiplas especialidades médicas e de bem-estar.
          </p>
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            onClick={() => window.location.href = "/api/login"}
          >
            Entrar com Replit
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Multi-tenant Seguro</CardTitle>
              <CardDescription>
                Arquitetura multi-inquilino com controle de acesso granular e segurança de nível empresarial.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Gestão de Pacientes</CardTitle>
              <CardDescription>
                Sistema completo de gerenciamento de contatos e pacientes com histórico detalhado.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Agendamentos</CardTitle>
              <CardDescription>
                Controle total de consultas e agendamentos com notificações automáticas.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-orange-600 mb-4" />
              <CardTitle>Pipeline de Vendas</CardTitle>
              <CardDescription>
                Funil de vendas completo com 5 estágios e tracking automático de oportunidades.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <MessageCircle className="h-12 w-12 text-pink-600 mb-4" />
              <CardTitle>WhatsApp API</CardTitle>
              <CardDescription>
                Integração completa com WhatsApp para comunicação automatizada com pacientes.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Settings className="h-12 w-12 text-gray-600 mb-4" />
              <CardTitle>IA Configurável</CardTitle>
              <CardDescription>
                Templates de IA personalizáveis para diferentes especialidades médicas.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Tecnologia de Ponta
          </h2>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full">React.js</span>
            <span className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full">PostgreSQL</span>
            <span className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full">WhatsApp API</span>
            <span className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full">Replit Auth</span>
            <span className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full">TypeScript</span>
            <span className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full">Tailwind CSS</span>
          </div>
        </div>
      </div>
    </div>
  );
}