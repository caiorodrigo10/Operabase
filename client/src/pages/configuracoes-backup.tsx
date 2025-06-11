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
    statusColor: "bg-slate-100 text-slate-600",
  },
  {
    id: 3,
    name: "Email Marketing",
    icon: Mail,
    description: "Automatize campanhas de email",
    connected: false,
    status: "inactive", 
    statusColor: "bg-slate-100 text-slate-600",
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
  const [linkedCalendarId, setLinkedCalendarId] = useState<string>("");
  const [addEventsToCalendar, setAddEventsToCalendar] = useState<string>("");

  // Fetch calendar integrations using TanStack Query
  const { data: calendarIntegrations = [], refetch: refetchIntegrations } = useQuery({
    queryKey: ['/api/calendar/integrations'],
    queryFn: getQueryFn,
  });

  // Fetch user calendars when integration is selected
  const { data: userCalendars = [], isLoading: isLoadingCalendars } = useQuery({
    queryKey: ['/api/calendar/integrations', selectedIntegrationId, 'calendars'],
    queryFn: getQueryFn,
    enabled: !!selectedIntegrationId,
  });

  // Update sync preferences mutation
  const updateSyncPreferencesMutation = useMutation({
    mutationFn: async ({ integrationId, syncPreference }: { integrationId: number; syncPreference: string }) => {
      const response = await apiRequest("PUT", `/api/calendar/integrations/${integrationId}/sync-preferences`, {
        syncPreference
      });
      return response.json();
    },
    onSuccess: () => {
      refetchIntegrations();
      setShowSyncDialog(false);
    },
  });

  // Save linked calendar settings mutation
  const saveLinkedCalendarMutation = useMutation({
    mutationFn: async ({ 
      integrationId, 
      linkedCalendarId, 
      addEventsToCalendar 
    }: { 
      integrationId: number; 
      linkedCalendarId: string; 
      addEventsToCalendar: string;
    }) => {
      const response = await apiRequest("PUT", `/api/calendar/integrations/${integrationId}/linked-calendar`, {
        linkedCalendarId: addEventsToCalendar === "google-account" ? linkedCalendarId : null,
        addEventsToCalendar: addEventsToCalendar === "google-account" ? linkedCalendarId : null
      });
      return response.json();
    },
    onSuccess: () => {
      refetchIntegrations();
      setShowLinkedCalendarDialog(false);
    },
  });

  const handleConflictCalendarSelection = (calendarId: string, selected: boolean) => {
    if (selected) {
      setConflictCalendars([...conflictCalendars, calendarId]);
    } else {
      setConflictCalendars(conflictCalendars.filter(id => id !== calendarId));
    }
  };

  const handleEditLinkedCalendar = (integrationId: number, currentCalendarId?: string) => {
    setSelectedIntegrationId(integrationId);
    setLinkedCalendarId(currentCalendarId || "");
    
    // Pre-populate with existing settings
    if (currentCalendarId) {
      setAddEventsToCalendar("google-account");
    } else {
      setAddEventsToCalendar("none");
    }
    
    setShowLinkedCalendarDialog(true);
  };

  const handleEditConflictCalendars = (integrationId: number) => {
    setSelectedIntegrationId(integrationId);
    setShowConflictCalendarDialog(true);
  };

  // Auto-refresh integrations periodically
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      refetchIntegrations();
    }, 2000);

    return () => clearTimeout(timer);
  }, [refetchIntegrations]);

  const handleEditSyncPreferences = (integrationId: number, currentPreference: string) => {
    setSelectedIntegrationId(integrationId);
    setSyncPreference(currentPreference || 'one-way');
    setShowSyncDialog(true);
  };

  const handleSaveSyncPreferences = () => {
    if (selectedIntegrationId && syncPreference) {
      updateSyncPreferencesMutation.mutate({
        integrationId: selectedIntegrationId,
        syncPreference
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-slate-600 mt-2">
          Gerencie as configurações da clínica, integrações e preferências do sistema.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da Clínica</CardTitle>
              <p className="text-sm text-slate-600">
                Gerencie as informações básicas da sua clínica
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clinic-name">Nome da Clínica</Label>
                  <Input id="clinic-name" defaultValue={mockClinic.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsible">Responsável</Label>
                  <Input id="responsible" defaultValue={mockClinic.responsible} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" defaultValue={mockClinic.phone} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input id="address" defaultValue={mockClinic.address} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue={mockClinic.email} />
              </div>
              <Button>Salvar Alterações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integrações Disponíveis</CardTitle>
              <p className="text-sm text-slate-600">
                Conecte sua clínica com serviços externos para automatizar processos
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.map((integration) => {
                  const Icon = integration.icon;
                  return (
                    <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{integration.name}</h3>
                          <p className="text-sm text-slate-600">{integration.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={integration.statusColor}>
                          {integration.connected ? "Conectado" : "Desconectado"}
                        </Badge>
                        <Button 
                          variant={integration.connected ? "outline" : "default"}
                          size="sm"
                        >
                          {integration.connected ? "Configurar" : "Conectar"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Integrações de Calendário</span>
              </CardTitle>
              <p className="text-sm text-slate-600">
                Gerencie suas conexões com serviços de calendário
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
              ) : calendarIntegrations.length > 0 ? (
                <div className="space-y-4">
                  {calendarIntegrations.map((integration: any) => (
                    <div key={integration.id} className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">Google Calendar</h3>
                            <p className="text-sm text-slate-600">{integration.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={integration.is_active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}>
                            {integration.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditSyncPreferences(integration.id, integration.sync_preference)}
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            Configurar
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-slate-700">Calendário Vinculado:</span>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-slate-600">
                              {integration.calendar_id ? integration.calendar_id : "Não configurado"}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditLinkedCalendar(integration.id, integration.calendar_id)}
                            >
                              {integration.calendar_id ? <Edit className="w-4 h-4" /> : <Link className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Calendários de Conflito:</span>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-slate-600">
                              {integration.linked_calendars?.length || 0} selecionados
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditConflictCalendars(integration.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="text-sm">
                        <span className="font-medium text-slate-700">Preferências de Sincronização:</span>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-slate-600">
                            {integration.sync_preference === 'one-way' ? 'Unidirecional (Padrão)' : 
                             integration.sync_preference === 'bidirectional' ? 'Bidirecional' : 'Não configurado'}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {integration.sync_preference === 'one-way' ? 'Recomendado' : 'Avançado'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma integração de calendário</h3>
                  <p className="text-slate-600 mb-4">
                    Conecte com Google Calendar para sincronizar seus agendamentos
                  </p>
                  <Button onClick={() => setShowProviderDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Conectar Calendário
                  </Button>
                </div>
              )}
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
                window.location.href = '/api/calendar/auth/google';
              }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Google Calendar</h3>
                  <p className="text-sm text-slate-600">Conecte com sua conta Google</p>
                </div>
              </div>
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
            <DialogTitle>Calendário Vinculado</DialogTitle>
            <DialogDescription>
              Configure como os eventos serão adicionados ao seu calendário
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Adicionar eventos ao calendário</Label>
              <Select value={addEventsToCalendar} onValueChange={setAddEventsToCalendar}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não adicionar eventos</SelectItem>
                  {calendarIntegrations.filter(integration => integration.provider === 'google' && integration.is_active).map(integration => (
                    <SelectItem key={integration.id} value="google-account">
                      {integration.email} (Conta Google)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {addEventsToCalendar === "google-account" && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Calendário específico</Label>
                {isLoadingCalendars ? (
                  <div className="text-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm text-slate-600 mt-2">Carregando calendários...</p>
                  </div>
                ) : (
                  <Select value={linkedCalendarId} onValueChange={setLinkedCalendarId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um calendário" />
                    </SelectTrigger>
                    <SelectContent>
                      {(userCalendars as any[]).map((calendar: any) => (
                        <SelectItem key={calendar.id} value={calendar.id}>
                          <div className="flex items-center space-x-2">
                            <span>{calendar.summary}</span>
                            {calendar.primary && (
                              <Badge variant="secondary" className="text-xs">Principal</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Configuração de Eventos</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {addEventsToCalendar === "none" 
                      ? "Novos agendamentos não serão adicionados automaticamente ao seu calendário."
                      : "Novos agendamentos serão automaticamente criados no calendário selecionado."
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkedCalendarDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (selectedIntegrationId) {
                  saveLinkedCalendarMutation.mutate({
                    integrationId: selectedIntegrationId,
                    linkedCalendarId,
                    addEventsToCalendar
                  });
                }
              }} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={saveLinkedCalendarMutation.isPending || (!linkedCalendarId && !addEventsToCalendar)}
            >
              {saveLinkedCalendarMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conflict Calendar Selection Dialog */}
      <Dialog open={showConflictCalendarDialog} onOpenChange={setShowConflictCalendarDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Calendários de Conflito</DialogTitle>
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
            ) : (userCalendars as any[]).length > 0 ? (
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
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma agenda encontrada</h3>
                <p className="text-slate-600 mb-4">
                  Para configurar detecção de conflitos, você precisa primeiro conectar com o Google Calendar através do botão "Conectar Calendário".
                </p>
                <p className="text-sm text-slate-500">
                  Após conectar, você poderá selecionar agendas adicionais para verificar conflitos de horário.
                </p>
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

      {/* Sync Preferences Dialog */}
      <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Preferências de Sincronização</DialogTitle>
            <DialogDescription>
              Configure como os eventos serão sincronizados entre o sistema e seu calendário Google.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-4">
              {/* One-way sync option */}
              <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                syncPreference === 'one-way' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-slate-200 hover:border-slate-300'
              }`} onClick={() => setSyncPreference('one-way')}>
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    id="one-way-sync"
                    name="sync-preference"
                    value="one-way"
                    checked={syncPreference === 'one-way'}
                    onChange={() => setSyncPreference('one-way')}
                    className="w-4 h-4 text-blue-600 mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Label htmlFor="one-way-sync" className="cursor-pointer font-medium">
                        Sincronização Padrão (Unidirecional)
                      </Label>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        Recomendado
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">
                      Eventos do calendário vinculado são tratados como horários bloqueados.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bidirectional sync option */}
              <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                syncPreference === 'bidirectional' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-slate-200 hover:border-slate-300'
              }`} onClick={() => setSyncPreference('bidirectional')}>
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    id="bidirectional-sync"
                    name="sync-preference"
                    value="bidirectional"
                    checked={syncPreference === 'bidirectional'}
                    onChange={() => setSyncPreference('bidirectional')}
                    className="w-4 h-4 text-blue-600 mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="bidirectional-sync" className="cursor-pointer font-medium mb-2 block">
                      Sincronização Bidirecional
                    </Label>
                    <p className="text-sm text-slate-600">
                      Contatos são criados para convidados encontrados em eventos do calendário vinculado, e esses eventos são transformados em agendamentos do sistema.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Information box */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Configuração de Sincronização</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {syncPreference === 'one-way' 
                      ? 'Os eventos do seu calendário Google aparecerão como horários ocupados, mas não serão criados agendamentos no sistema.'
                      : 'Eventos do Google Calendar serão automaticamente convertidos em agendamentos no sistema, criando contatos quando necessário.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSyncDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveSyncPreferences}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={updateSyncPreferencesMutation.isPending}
            >
              {updateSyncPreferencesMutation.isPending ? "Salvando..." : "Salvar Preferências"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}