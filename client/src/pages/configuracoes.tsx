import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockClinic } from "@/lib/mock-data";
import { MessageSquare, Database, Calendar, Mail, CheckCircle, AlertCircle, Bot } from "lucide-react";

const integrations = [
  {
    id: 1,
    name: "CRM Webhook",
    description: "Sincronização automática de dados",
    icon: Database,
    status: "active",
    statusColor: "bg-green-100 text-green-800",
  },
  {
    id: 2,
    name: "Google Calendar",
    description: "Agendamento automático",
    icon: Calendar,
    status: "active",
    statusColor: "bg-green-100 text-green-800",
  },
  {
    id: 3,
    name: "Email Marketing",
    description: "Campanhas de follow-up",
    icon: Mail,
    status: "inactive",
    statusColor: "bg-slate-100 text-slate-800",
  },
];

const systemStatus = [
  {
    name: "IA Livia",
    status: "Online",
    color: "bg-green-500",
  },
  {
    name: "WhatsApp API",
    status: "Conectado",
    color: "bg-green-500",
  },
  {
    name: "Base de Dados",
    status: "Operacional",
    color: "bg-green-500",
  },
];

export function Configuracoes() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="mb-6 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-40 bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Configurações</h2>
        <p className="text-slate-600">Configurações atuais do sistema (somente leitura)</p>
      </div>

      <div className="space-y-6">
        {/* Clinic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Clínica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="clinic-name">Nome da Clínica</Label>
                <Input
                  id="clinic-name"
                  value={mockClinic.name}
                  readOnly
                  className="bg-slate-50"
                />
              </div>
              <div>
                <Label htmlFor="responsible">Responsável</Label>
                <Input
                  id="responsible"
                  value={mockClinic.responsible}
                  readOnly
                  className="bg-slate-50"
                />
              </div>
              <div>
                <Label htmlFor="specialties">Especialidades</Label>
                <Input
                  id="specialties"
                  value={mockClinic.specialties?.join(", ") || ""}
                  readOnly
                  className="bg-slate-50"
                />
              </div>
              <div>
                <Label htmlFor="hours">Horário de Funcionamento</Label>
                <Input
                  id="hours"
                  value={mockClinic.working_hours || ""}
                  readOnly
                  className="bg-slate-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Integration */}
        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Conectado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800">{mockClinic.whatsapp_number}</p>
                <p className="text-sm text-slate-600">Status: Conectado e ativo</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </CardContent>
        </Card>

        {/* AI Agent Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações da Livia IA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="agent-name">Nome da Agente</Label>
                <Input
                  id="agent-name"
                  value="Livia"
                  readOnly
                  className="bg-slate-50"
                />
              </div>
              <div>
                <Label htmlFor="language">Idioma</Label>
                <Input
                  id="language"
                  value="Português (Brasil)"
                  readOnly
                  className="bg-slate-50"
                />
              </div>
              <div>
                <Label htmlFor="tone">Tom de Voz</Label>
                <Input
                  id="tone"
                  value="Profissional e Amigável"
                  readOnly
                  className="bg-slate-50"
                />
              </div>
              <div>
                <Label htmlFor="ai-hours">Horário de Funcionamento da IA</Label>
                <Input
                  id="ai-hours"
                  value="24 horas (com mensagens automáticas fora do horário)"
                  readOnly
                  className="bg-slate-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card>
          <CardHeader>
            <CardTitle>Integrações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {integrations.map((integration) => {
                const Icon = integration.icon;
                return (
                  <div key={integration.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{integration.name}</p>
                        <p className="text-sm text-slate-600">{integration.description}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${integration.statusColor}`}>
                      {integration.status === "active" ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {systemStatus.map((system, index) => (
                <div key={index} className="text-center p-4 bg-green-50 rounded-lg">
                  <div className={`w-3 h-3 ${system.color} rounded-full mx-auto mb-2`}></div>
                  <p className="font-medium text-slate-800">{system.name}</p>
                  <p className="text-sm text-green-600">{system.status}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
