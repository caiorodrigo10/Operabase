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
    name: "WhatsApp Business",
    icon: MessageSquare,
    description: "Conecte com WhatsApp para comunicação direta",
    connected: true,
    status: "active",
    statusColor: "bg-green-100 text-green-800",
  },
  {
    id: 2,
    name: "Google Calendar",
    icon: Calendar,
    description: "Sincronize agendamentos com Google Calendar",
    connected: false,
    status: "inactive",
    statusColor: "bg-slate-100 text-slate-800",
  },
  {
    id: 3,
    name: "Sistema ERP",
    icon: Database,
    description: "Integração com sistema de gestão",
    connected: false,
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
  const [showLinkedCalendarDialog, setShowLinkedCalendarDialog] = useState(false);
  const [showConflictCalendarDialog, setShowConflictCalendarDialog] = useState(false);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [conflictCalendars, setConflictCalendars] = useState<string[]>([]);

  // Fetch calendar integrations using TanStack Query
  const { data: calendarIntegrations = [], refetch: refetchIntegrations } = useQuery({
    queryKey: ["/api/calendar/integrations"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Type assertion for calendar integrations
  const typedCalendarIntegrations = (calendarIntegrations as any[]) || [];

  // Fetch user calendars for selected integration
  const { data: userCalendars = [], isLoading: isLoadingCalendars } = useQuery({
    queryKey: [`/api/calendar/integrations/${selectedIntegrationId}/calendars`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!selectedIntegrationId,
  });

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

  const handleOpenLinkedCalendarDialog = (integrationId: number) => {
    setSelectedIntegrationId(integrationId);
    setShowLinkedCalendarDialog(true);
  };

  const handleOpenConflictCalendarDialog = (integrationId: number) => {
    setSelectedIntegrationId(integrationId);
    setShowConflictCalendarDialog(true);
  };

  const handleCalendarSelection = (calendarId: string, checked: boolean) => {
    if (checked) {
      setSelectedCalendars(prev => [...prev, calendarId]);
    } else {
      setSelectedCalendars(prev => prev.filter(id => id !== calendarId));
    }
  };

  const handleConflictCalendarSelection = (calendarId: string, checked: boolean) => {
    if (checked) {
      setConflictCalendars(prev => [...prev, calendarId]);
    } else {
      setConflictCalendars(prev => prev.filter(id => id !== calendarId));
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    // Check for calendar connection status from URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('calendar') === 'connected') {
      refetchIntegrations();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => clearTimeout(timer);
  }, [refetchIntegrations]);

  const handleEditSyncPreferences = (integrationId: number, currentPreference: string) => {
    setSelectedIntegrationId(integrationId);
    setSyncPreference(currentPreference);
    setShowSyncDialog(true);
  };

  const handleSaveSyncPreferences = () => {
    if (selectedIntegrationId && syncPreference) {
      updateSyncPreferencesMutation.mutate({
        integrationId: selectedIntegrationId,
        syncPreference: syncPreference,
      });
    }
  };

  const handleDisconnectCalendar = (integrationId: number) => {
    deleteCalendarMutation.mutate(integrationId);
  };

  const renderSkeletonCard = () => (
    <div className="animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-6">
                  {renderSkeletonCard()}
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Configurações</h1>
          <p className="text-slate-600">
            Gerencie as configurações da sua clínica e integrações do sistema.
          </p>
        </div>

        <Tabs defaultValue="clinic" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="clinic">Clínica</TabsTrigger>
            <TabsTrigger value="integrations">Integrações</TabsTrigger>
            <TabsTrigger value="ai">IA Livia</TabsTrigger>
            <TabsTrigger value="system">Sistema</TabsTrigger>
          </TabsList>

          <TabsContent value="clinic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Clínica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clinic-name">Nome da Clínica</Label>
                    <Input
                      id="clinic-name"
                      defaultValue={mockClinic.name}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clinic-phone">Telefone</Label>
                    <Input
                      id="clinic-phone"
                      defaultValue={mockClinic.phone}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="clinic-address">Endereço</Label>
                  <Input
                    id="clinic-address"
                    defaultValue={mockClinic.address}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="clinic-email">E-mail</Label>
                  <Input
                    id="clinic-email"
                    defaultValue={mockClinic.email}
                    className="mt-1"
                  />
                </div>
                <Button className="mt-4">Salvar Alterações</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Integrações de Calendário</CardTitle>
                    <p className="text-sm text-slate-600 mt-1">
                      Conecte suas contas de calendário para sincronização automática
                    </p>
                  </div>
                  <Button 
                    onClick={() => setShowProviderDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Conectar Calendário
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {typedCalendarIntegrations.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum calendário conectado</h3>
                      <p className="text-slate-600 mb-4">
                        Conecte seu Google Calendar para sincronizar agendamentos automaticamente.
                      </p>
                      <Button 
                        onClick={() => setShowProviderDialog(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Conectar Primeiro Calendário
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {typedCalendarIntegrations.map((integration: any) => (
                        <div key={integration.id} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-medium text-slate-800">Google Calendar</h3>
                                  <Badge variant={integration.is_active ? "default" : "secondary"}>
                                    {integration.is_active ? "Conectado" : "Inativo"}
                                  </Badge>
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
                                        <p className="text-xs text-slate-600">Selecionar agendas para sincronização</p>
                                      </div>
                                    </div>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleOpenLinkedCalendarDialog(integration.id)}
                                    >
                                      <Calendar className="w-4 h-4 mr-2" />
                                      Calendário Vinculado
                                    </Button>
                                  </div>

                                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                    <div className="flex items-center space-x-3">
                                      <AlertCircle className="w-5 h-5 text-orange-600" />
                                      <div>
                                        <p className="font-medium text-sm">Calendários de Conflito</p>
                                        <p className="text-xs text-slate-600">Detectar conflitos com outras agendas</p>
                                      </div>
                                    </div>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleOpenConflictCalendarDialog(integration.id)}
                                    >
                                      <AlertCircle className="w-4 h-4 mr-2" />
                                      Calendários de Conflito
                                    </Button>
                                  </div>

                                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                    <div className="flex items-center space-x-3">
                                      <Settings className="w-5 h-5 text-slate-600" />
                                      <div>
                                        <p className="font-medium text-sm">Preferências de Sincronização</p>
                                        <p className="text-xs text-slate-600">Configurar como sincronizar eventos</p>
                                      </div>
                                    </div>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleEditSyncPreferences(integration.id, integration.sync_preference)}
                                    >
                                      <Settings className="w-4 h-4 mr-2" />
                                      Configurar
                                    </Button>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da IA</CardTitle>
                <p className="text-sm text-slate-600">
                  Configure o comportamento e templates da assistente virtual Livia.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Bot className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Assistente IA Ativa</p>
                      <p className="text-sm text-slate-600">
                        A IA Livia está respondendo automaticamente as mensagens
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Ativo
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status do Sistema</CardTitle>
                <p className="text-sm text-slate-600">
                  Monitore o status dos componentes críticos do sistema.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemStatus.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Sync Preferences Dialog */}
        <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
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
                          Eventos do calendário vinculado são tratados como horários bloqueados.
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

        {/* Calendar Provider Selection Dialog */}
        <Dialog open={showProviderDialog} onOpenChange={setShowProviderDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Conectar Calendário</DialogTitle>
              <DialogDescription>
                Escolha um provedor de calendário para conectar
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div 
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                onClick={() => {
                  setShowProviderDialog(false);
                  connectCalendarMutation.mutate();
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Google Calendar</p>
                    <p className="text-sm text-slate-600">Sincronizar com Google Calendar</p>
                  </div>
                </div>
                <Button variant="outline" disabled>
                  Conectar
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg opacity-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-600" />
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

        {/* Linked Calendar Selection Dialog */}
        <Dialog open={showLinkedCalendarDialog} onOpenChange={setShowLinkedCalendarDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Linked Calendar</DialogTitle>
              <DialogDescription>
                Selecione as agendas que deseja sincronizar com o sistema
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {isLoadingCalendars ? (
                <div className="text-center py-4">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-sm text-slate-600 mt-2">Carregando agendas...</p>
                </div>
              ) : userCalendars.length > 0 ? (
                <div className="space-y-3">
                  {(userCalendars as any[]).map((calendar: any) => (
                    <div key={calendar.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={calendar.id}
                        checked={selectedCalendars.includes(calendar.id)}
                        onCheckedChange={(checked) => handleCalendarSelection(calendar.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={calendar.id} className="cursor-pointer">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{calendar.summary}</span>
                            {calendar.primary && (
                              <Badge variant="secondary" className="text-xs">Principal</Badge>
                            )}
                          </div>
                          {calendar.description && (
                            <p className="text-xs text-slate-600 mt-1">{calendar.description}</p>
                          )}
                        </Label>
                      </div>
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-slate-300"
                        style={{ backgroundColor: calendar.backgroundColor || '#4285f4' }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma agenda encontrada</h3>
                  <p className="text-slate-600 mb-4">
                    Para visualizar suas agendas, você precisa primeiro conectar com o Google Calendar através do botão "Conectar Calendário".
                  </p>
                  <p className="text-sm text-slate-500">
                    Após conectar, você poderá selecionar quais agendas sincronizar com o sistema.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLinkedCalendarDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setShowLinkedCalendarDialog(false)} className="bg-blue-600 hover:bg-blue-700">
                Salvar Seleção
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Conflict Calendar Selection Dialog */}
        <Dialog open={showConflictCalendarDialog} onOpenChange={setShowConflictCalendarDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Conflict Calendars</DialogTitle>
              <DialogDescription>
                Selecione agendas adicionais para detectar conflitos de horário
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {isLoadingCalendars ? (
                <div className="text-center py-4">
                  <div className="animate-spin w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-sm text-slate-600 mt-2">Carregando agendas...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(userCalendars as any[]).map((calendar: any) => (
                    <div key={calendar.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={`conflict-${calendar.id}`}
                        checked={conflictCalendars.includes(calendar.id)}
                        onCheckedChange={(checked) => handleConflictCalendarSelection(calendar.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={`conflict-${calendar.id}`} className="cursor-pointer">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{calendar.summary}</span>
                            {calendar.primary && (
                              <Badge variant="secondary" className="text-xs">Principal</Badge>
                            )}
                          </div>
                          {calendar.description && (
                            <p className="text-xs text-slate-600 mt-1">{calendar.description}</p>
                          )}
                        </Label>
                      </div>
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-slate-300"
                        style={{ backgroundColor: calendar.backgroundColor || '#4285f4' }}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">Detecção de Conflitos</p>
                    <p className="text-xs text-orange-700 mt-1">
                      O sistema verificará essas agendas antes de confirmar novos agendamentos para evitar conflitos de horário.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConflictCalendarDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setShowConflictCalendarDialog(false)} className="bg-orange-600 hover:bg-orange-700">
                Salvar Seleção
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}