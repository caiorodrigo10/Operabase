import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { mockClinic } from "@/lib/mock-data";
import { MessageSquare, Database, Calendar, Mail, CheckCircle, AlertCircle, Bot, Plus, Trash2, Settings, Edit, Info, Link, Unlink, X } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";

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
  const [syncPreference, setSyncPreference] = useState("one-way");
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [showProviderDialog, setShowProviderDialog] = useState(false);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<number | null>(null);

  // Fetch calendar integrations using TanStack Query
  const { data: calendarIntegrations = [], refetch: refetchIntegrations } = useQuery({
    queryKey: ["/api/calendar/integrations"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Type assertion for calendar integrations
  const typedCalendarIntegrations = (calendarIntegrations as any[]) || [];

  const connectCalendarMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/calendar/auth/google");
      const data = await response.json();
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      console.error("Error connecting calendar:", error);
    },
  });

  const updateSyncPreferencesMutation = useMutation({
    mutationFn: async ({ integrationId, syncPreference }: { integrationId: number; syncPreference: string }) => {
      const response = await apiRequest("PUT", `/api/calendar/integrations/${integrationId}/sync`, {
        sync_preference: syncPreference,
      });
      return response.json();
    },
    onSuccess: () => {
      refetchIntegrations();
      setShowSyncDialog(false);
    },
  });

  const deleteCalendarMutation = useMutation({
    mutationFn: async (integrationId: number) => {
      await apiRequest("DELETE", `/api/calendar/integrations/${integrationId}`);
    },
    onSuccess: () => {
      refetchIntegrations();
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    // Check for calendar connection status from URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('calendar') === 'connected') {
      refetchIntegrations();
    }

    return () => clearTimeout(timer);
  }, [refetchIntegrations]);

  const handleConnectCalendar = () => {
    setShowProviderDialog(true);
  };

  const handleSelectProvider = (provider: string) => {
    setShowProviderDialog(false);
    if (provider === 'google') {
      connectCalendarMutation.mutate();
    }
  };

  const handleDisconnectCalendar = (integrationId: number) => {
    deleteCalendarMutation.mutate(integrationId);
  };

  const handleSaveSyncPreferences = () => {
    if (selectedIntegrationId) {
      updateSyncPreferencesMutation.mutate({
        integrationId: selectedIntegrationId,
        syncPreference,
      });
    }
  };

  const handleEditSyncPreferences = (integrationId: number, currentPreference: string) => {
    setSelectedIntegrationId(integrationId);
    setSyncPreference(currentPreference);
    setShowSyncDialog(true);
  };

  const isCalendarConnected = Array.isArray(typedCalendarIntegrations) && typedCalendarIntegrations.length > 0;

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

        {/* Calendar Integration */}
        <Card>
          <CardHeader>
            <CardTitle>Integração de Calendário</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="calendars" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="calendars">Calendários</TabsTrigger>
                <TabsTrigger value="video">Video Conferencing</TabsTrigger>
              </TabsList>

              <TabsContent value="calendars" className="space-y-6 mt-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Calendários Conectados</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Conecte facilmente seus calendários de terceiros para verificar disponibilidade, atualizar agendamentos conforme são marcados e evitar duplas reservas.
                  </p>

                  {!isCalendarConnected ? (
                    <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                      <div className="mx-auto w-24 h-24 mb-4 flex items-center justify-center">
                        <div className="relative">
                          <Calendar className="w-12 h-12 text-slate-400" />
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                            <Calendar className="w-3 h-3 text-orange-600" />
                          </div>
                        </div>
                      </div>
                      <h4 className="text-lg font-medium text-slate-700 mb-2">Nenhuma conexão encontrada</h4>
                      <p className="text-slate-500 mb-6">Conecte seus calendários de terceiros para sincronizar agendamentos e verificar disponibilidade</p>
                      <Button onClick={handleConnectCalendar} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Novo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div></div>
                        <Button onClick={handleConnectCalendar} variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Novo
                        </Button>
                      </div>



                      {/* Connected Calendars */}
                      {typedCalendarIntegrations.map((integration) => (
                        <div key={integration.id} className="p-4 border border-green-200 bg-green-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <p className="font-medium text-slate-800">{integration.provider === 'google' ? 'Google Calendar' : integration.provider}</p>
                                  {integration.is_active ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4 text-orange-600" />
                                  )}
                                </div>
                                <p className="text-sm text-slate-600">{integration.email}</p>
                                {integration.last_sync && (
                                  <p className="text-xs text-slate-500">
                                    Última sinc: {new Date(integration.last_sync).toLocaleString('pt-BR')}
                                  </p>
                                )}
                                {integration.sync_errors && (
                                  <p className="text-xs text-red-500">
                                    Erro: {integration.sync_errors}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditSyncPreferences(integration.id, integration.sync_preference)}
                              >
                                <Settings className="w-4 h-4 mr-2" />
                                Configurar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDisconnectCalendar(integration.id)}
                                className="text-slate-500 hover:text-red-600"
                                disabled={deleteCalendarMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {integration.is_active && (
                            <div className="mt-4 space-y-4">
                              <Separator />
                              
                              <div>
                                <h4 className="font-medium text-slate-800 mb-3">Configuração do Calendário</h4>
                                
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                    <div className="flex items-center space-x-3">
                                      <Calendar className="w-5 h-5 text-blue-600" />
                                      <div>
                                        <p className="font-medium text-sm">Calendário Vinculado</p>
                                        <p className="text-xs text-slate-600">Sincronizar agendamentos com seu calendário vinculado</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="w-4 h-4 text-blue-600" />
                                      <span className="text-sm text-slate-600">{integration.email}</span>
                                      <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
                                        <DialogTrigger asChild>
                                          <Button variant="ghost" size="sm">
                                            <Edit className="w-4 h-4" />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl">
                                          <DialogHeader>
                                            <DialogTitle>Preferências de Sincronização</DialogTitle>
                                            <DialogDescription>
                                              Como você gostaria de sincronizar os eventos do seu calendário vinculado?
                                            </DialogDescription>
                                          </DialogHeader>

                                          <div className="space-y-6 py-4">
                                            <div className="text-center">
                                              <h3 className="text-lg font-medium mb-4">Sincronização Padrão (Unidirecional)</h3>
                                              <div className="flex items-center justify-center space-x-8 mb-6">
                                                <div className="text-center">
                                                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                                    <Calendar className="w-8 h-8 text-blue-600" />
                                                  </div>
                                                  <p className="text-sm font-medium">Eventos do Calendário Vinculado</p>
                                                </div>
                                                <div className="flex-1 h-px bg-blue-300 relative">
                                                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full"></div>
                                                </div>
                                                <div className="text-center">
                                                  <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                                    <Calendar className="w-8 h-8 text-slate-600" />
                                                  </div>
                                                  <p className="text-sm font-medium">Tratados como Horários Bloqueados</p>
                                                </div>
                                              </div>
                                            </div>

                                            <RadioGroup value={syncPreference} onValueChange={setSyncPreference}>
                                              <div className="space-y-4">
                                                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                                                  <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="one-way" id="one-way" />
                                                    <Label htmlFor="one-way" className="flex-1">
                                                      <div className="flex items-center justify-between">
                                                        <span className="font-medium">Sincronização Padrão (Unidirecional)</span>
                                                        <Badge variant="secondary">Recomendado</Badge>
                                                      </div>
                                                      <p className="text-sm text-slate-600 mt-1">
                                                        Eventos do calendário vinculado são sincronizados como horários bloqueados, e nenhum contato é criado para os convidados.
                                                      </p>
                                                    </Label>
                                                  </div>
                                                </div>

                                                <div className="border border-slate-200 rounded-lg p-4">
                                                  <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="two-way" id="two-way" />
                                                    <Label htmlFor="two-way" className="flex-1">
                                                      <span className="font-medium">Sincronização Bidirecional</span>
                                                      <p className="text-sm text-slate-600 mt-1">
                                                        Contatos são criados para convidados encontrados em eventos do calendário vinculado, e esses eventos são transformados em agendamentos do sistema.
                                                      </p>
                                                    </Label>
                                                  </div>
                                                </div>
                                              </div>
                                            </RadioGroup>
                                          </div>

                                          <DialogFooter>
                                            <Button variant="outline" onClick={() => setShowSyncDialog(false)}>
                                              Cancelar
                                            </Button>
                                            <Button onClick={handleSaveSyncPreferences} className="bg-blue-600 hover:bg-blue-700">
                                              Salvar
                                            </Button>
                                          </DialogFooter>
                                        </DialogContent>
                                      </Dialog>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                    <div className="flex items-center space-x-3">
                                      <Calendar className="w-5 h-5 text-blue-600" />
                                      <div>
                                        <p className="font-medium text-sm">Calendários de Conflito</p>
                                        <p className="text-xs text-slate-600">Adicione calendários adicionais para verificar e prevenir agendamentos duplos</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="w-4 h-4 text-blue-600" />
                                      <span className="text-sm text-slate-600">{integration.email}</span>
                                      <Button variant="ghost" size="sm">
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-end">
                                <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                                  <Settings className="w-4 h-4 mr-2" />
                                  Configurações Avançadas
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="video" className="space-y-6 mt-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Video Conferencing</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Gere automaticamente links únicos de reunião e compartilhe-os sempre que um agendamento for marcado.
                  </p>

                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      <p className="text-sm text-orange-800">
                        Google Meet requer que o Google Calendar esteja conectado. Por favor, conecte seu Google Calendar para prosseguir.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">Google Meet</p>
                        <p className="text-sm text-slate-600">Conecte Google Meet para gerar um link único de reunião a cada vez</p>
                      </div>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700" disabled={!isCalendarConnected}>
                      {isCalendarConnected ? "Conectar Google Calendar" : "Conectar Google Calendar"}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
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

        {/* Calendar Provider Selection Modal */}
        <Dialog open={showProviderDialog} onOpenChange={setShowProviderDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Conectar Calendário</DialogTitle>
              <DialogDescription>
                Selecione o provedor de calendário que deseja conectar
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              <div 
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => handleSelectProvider('google')}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Google Calendar</p>
                    <p className="text-sm text-slate-600">Conecte seu Google Calendar</p>
                  </div>
                </div>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectProvider('google');
                  }}
                >
                  Conectar
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg opacity-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Outlook Calendar</p>
                    <p className="text-sm text-slate-600">Em breve</p>
                  </div>
                </div>
                <Button variant="outline" disabled>
                  Em breve
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg opacity-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">iCloud Calendar</p>
                    <p className="text-sm text-slate-600">Em breve</p>
                  </div>
                </div>
                <Button variant="outline" disabled>
                  Em breve
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowProviderDialog(false)}>
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
