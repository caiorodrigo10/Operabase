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
import { MessageSquare, Database, Calendar, Mail, CheckCircle, AlertCircle, Bot, Plus, Trash2, Settings, Edit, Info, Link, Unlink, X, RefreshCw, Save, Phone, Users, Timer, QrCode } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { getCountries, getCountryCallingCode } from 'react-phone-number-input';
import countries from 'world-countries';
import { UserManagement } from '@/components/UserManagement';
import { WhatsAppManager } from '@/components/WhatsAppManager';
// import { useUser } from '@/lib/auth';

// WhatsApp Integration Component
const WhatsAppIntegration = () => {
  const [whatsappConfig, setWhatsappConfig] = useState({
    api_key: '',
    base_url: '',
    instance_name: ''
  });
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, qr-active, qr-expired, connected, error
  const [qrCode, setQrCode] = useState('');
  const [qrTimer, setQrTimer] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const { toast } = useToast();

  // Timer effect for QR Code
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && qrTimer > 0) {
      interval = setInterval(() => {
        setQrTimer(prev => {
          if (prev <= 1) {
            setIsTimerActive(false);
            setConnectionStatus('qr-expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, qrTimer]);

  // Save WhatsApp configuration
  const saveConfigMutation = useMutation({
    mutationFn: async (config: typeof whatsappConfig) => {
      const response = await apiRequest('/api/whatsapp/config', 'POST', config);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuração salva",
        description: "As configurações do WhatsApp foram salvas com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações do WhatsApp",
        variant: "destructive",
      });
    }
  });

  // Create WhatsApp instance and get QR Code
  const connectWhatsAppMutation = useMutation({
    mutationFn: async () => {
      setConnectionStatus('connecting');
      const response = await apiRequest('/api/whatsapp/create-instance', 'POST');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.data?.qrcode) {
        // Extract base64 from data:image/png;base64,... format as specified in the plan
        const base64Data = data.data.qrcode.split(',')[1];
        setQrCode(`data:image/png;base64,${base64Data}`);
        setConnectionStatus('qr-active');
        setQrTimer(30);
        setIsTimerActive(true);
      } else {
        setConnectionStatus('error');
        toast({
          title: "Erro na conexão",
          description: "Não foi possível gerar o QR Code",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      setConnectionStatus('error');
      toast({
        title: "Erro na conexão",
        description: "Falha ao conectar com a Evolution API",
        variant: "destructive",
      });
    }
  });

  // Regenerate QR Code
  const regenerateQRMutation = useMutation({
    mutationFn: async () => {
      setConnectionStatus('connecting');
      const response = await apiRequest('/api/whatsapp/qr-code', 'GET');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.data?.qrcode) {
        // Extract base64 from data:image/png;base64,... format
        const base64Data = data.data.qrcode.split(',')[1];
        setQrCode(`data:image/png;base64,${base64Data}`);
        setConnectionStatus('qr-active');
        setQrTimer(30);
        setIsTimerActive(true);
      } else {
        setConnectionStatus('error');
      }
    },
    onError: () => {
      setConnectionStatus('error');
    }
  });

  // Test connection
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/whatsapp/test-connection', 'POST');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setConnectionStatus('connected');
        toast({
          title: "Conexão bem-sucedida",
          description: "WhatsApp conectado com sucesso",
        });
      } else {
        toast({
          title: "Falha na conexão",
          description: data.message || "Não foi possível conectar",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro no teste",
        description: "Falha ao testar a conexão",
        variant: "destructive",
      });
    }
  });

  const handleSaveConfig = () => {
    if (!whatsappConfig.api_key) {
      toast({
        title: "API Key obrigatória",
        description: "Por favor, insira sua API Key da Evolution",
        variant: "destructive",
      });
      return;
    }
    saveConfigMutation.mutate(whatsappConfig);
  };

  const handleConnectWhatsApp = () => {
    connectWhatsAppMutation.mutate();
  };

  const handleRegenerateQR = () => {
    regenerateQRMutation.mutate();
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'qr-active': return 'bg-yellow-500';
      case 'connecting': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Conectado';
      case 'qr-active': return 'Aguardando leitura do QR Code';
      case 'qr-expired': return 'QR Code expirado';
      case 'connecting': return 'Conectando...';
      case 'error': return 'Erro na conexão';
      default: return 'Desconectado';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-600" />
              WhatsApp Business - Evolution API
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              Configure sua integração com WhatsApp através da Evolution API
            </p>
          </div>
          <Badge variant="outline" className={`${connectionStatus === 'connected' ? 'text-green-600 border-green-200' : 'text-slate-600 border-slate-200'}`}>
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Configuration Section */}
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Configuração da Evolution API</p>
                <p className="text-sm text-green-700 mt-1">
                  URL: https://n8n-evolution-api.4gmy9o.easypanel.host<br/>
                  Webhook: Configurado automaticamente para receber mensagens
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp-api-key">API Key da Evolution</Label>
              <Input
                id="whatsapp-api-key"
                type="password"
                value={whatsappConfig.api_key}
                onChange={(e) => setWhatsappConfig({...whatsappConfig, api_key: e.target.value})}
                placeholder="Digite sua API Key..."
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp-instance">Nome da Instância (opcional)</Label>
              <Input
                id="whatsapp-instance"
                value={whatsappConfig.instance_name}
                onChange={(e) => setWhatsappConfig({...whatsappConfig, instance_name: e.target.value})}
                placeholder="taskmed_clinic_1"
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={() => testConnectionMutation.mutate()}
              disabled={testConnectionMutation.isPending || !whatsappConfig.api_key}
            >
              {testConnectionMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Settings className="w-4 h-4 mr-2" />
              )}
              Testar Conexão
            </Button>
            <Button 
              onClick={handleSaveConfig}
              disabled={saveConfigMutation.isPending || !whatsappConfig.api_key}
              className="bg-green-600 hover:bg-green-700"
            >
              {saveConfigMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Configuração
            </Button>
          </div>
        </div>

        <Separator />

        {/* Connection Status Section */}
        <div className="space-y-4">
          <h3 className="font-medium text-slate-800">Status da Conexão WhatsApp</h3>
          
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
              <span className="font-medium">{getStatusText()}</span>
            </div>
            
            {connectionStatus === 'disconnected' && whatsappConfig.api_key && (
              <Button 
                onClick={handleConnectWhatsApp}
                disabled={connectWhatsAppMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {connectWhatsAppMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4 mr-2" />
                )}
                Conectar WhatsApp
              </Button>
            )}
          </div>

          {/* QR Code Section */}
          {(connectionStatus === 'qr-active' || connectionStatus === 'qr-expired') && qrCode && (
            <div className="border rounded-lg p-6 text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <QrCode className="w-5 h-5 text-slate-600" />
                <h4 className="font-medium text-slate-800">
                  {connectionStatus === 'qr-active' ? 'Escaneie o QR Code com seu WhatsApp' : 'QR Code Expirado'}
                </h4>
              </div>
              
              <div className={`inline-block p-4 bg-white border-2 rounded-lg ${connectionStatus === 'qr-expired' ? 'opacity-50 grayscale' : ''}`}>
                <img 
                  src={qrCode} 
                  alt="QR Code WhatsApp" 
                  className="w-64 h-64 mx-auto"
                />
              </div>
              
              {connectionStatus === 'qr-active' && (
                <div className="flex items-center justify-center space-x-2 text-sm text-slate-600">
                  <Timer className="w-4 h-4" />
                  <span>Expira em: {qrTimer}s</span>
                </div>
              )}
              
              {connectionStatus === 'qr-expired' && (
                <div className="space-y-2">
                  <p className="text-sm text-red-600">Este QR Code expirou</p>
                  <Button 
                    onClick={handleRegenerateQR}
                    disabled={regenerateQRMutation.isPending}
                    variant="outline"
                  >
                    {regenerateQRMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Gerar novo QR Code
                  </Button>
                </div>
              )}
              
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                1. Abra o WhatsApp no seu celular<br/>
                2. Toque em Menu ou Configurações<br/>
                3. Toque em Aparelhos conectados<br/>
                4. Toque em Conectar um aparelho<br/>
                5. Aponte seu celular para esta tela para capturar o código
              </p>
            </div>
          )}

          {connectionStatus === 'connected' && (
            <div className="border border-green-200 bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">WhatsApp Conectado com Sucesso!</p>
                  <p className="text-sm text-green-700">
                    Seu WhatsApp está pronto para enviar e receber mensagens automaticamente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {connectionStatus === 'error' && (
            <div className="border border-red-200 bg-red-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Erro na Conexão</p>
                  <p className="text-sm text-red-700">
                    Verifique sua API Key e tente novamente.
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setConnectionStatus('disconnected')}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                Tentar Novamente
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Country selector component
const CountrySelector = ({ value, onChange, placeholder = "Selecione um país" }: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => {
  const sortedCountries = countries
    .map(country => ({
      code: country.cca2,
      name: country.name.common,
      flag: country.flag
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {sortedCountries.map((country) => (
          <SelectItem key={country.code} value={country.code}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{country.flag}</span>
              <span>{country.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

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
  const { toast } = useToast();
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
  
  // Clinic configuration state
  const [clinicConfig, setClinicConfig] = useState<Partial<InsertClinic>>({});
  const [workingDays, setWorkingDays] = useState<string[]>(["monday", "tuesday", "wednesday", "thursday", "friday"]);
  const [isSaving, setIsSaving] = useState(false);
  const [phoneValue, setPhoneValue] = useState<string | undefined>("");
  const [celularValue, setCelularValue] = useState<string | undefined>("");
  const [hasLunchBreak, setHasLunchBreak] = useState(true);

  // Fetch clinic configuration
  const { data: clinic, refetch: refetchClinic } = useQuery<Clinic>({
    queryKey: ["/api/clinic/1/config"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Initialize phone values and working days when clinic data loads
  useEffect(() => {
    if (clinic) {
      console.log("🏥 Clinic data loaded:", { 
        working_days: clinic.working_days, 
        phone: clinic.phone, 
        celular: clinic.celular,
        has_lunch_break: clinic.has_lunch_break
      });
      
      setPhoneValue(clinic.phone || "");
      setCelularValue(clinic.celular || "");
      
      // Update working days from clinic data - this should override the default
      if (clinic.working_days && Array.isArray(clinic.working_days)) {
        console.log("📅 Setting working days from clinic data:", clinic.working_days);
        setWorkingDays(clinic.working_days);
      } else {
        // Fallback to default if no working days are set
        console.log("📅 Using default working days");
        setWorkingDays(["monday", "tuesday", "wednesday", "thursday", "friday"]);
      }
      
      // Load lunch break setting
      setHasLunchBreak(clinic.has_lunch_break !== false);
    }
  }, [clinic]);

  // Update clinic configuration mutation
  const updateClinicMutation = useMutation({
    mutationFn: async (data: Partial<InsertClinic>) => {
      const res = await apiRequest("/api/clinic/1/config", "PUT", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinic/1/config"] });
      toast({
        title: "Configurações salvas",
        description: "As configurações da clínica foram atualizadas com sucesso.",
      });
      setIsSaving(false);
    },
    onError: (error: any) => {
      console.error("Error updating clinic config:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
      setIsSaving(false);
    },
  });

  // Function to collect form data and save configuration
  const handleSaveConfiguration = () => {
    setIsSaving(true);
    
    // Debug: Log the phone values to confirm they include country codes
    console.log("📞 Phone values before save:", {
      phoneValue,
      celularValue,
      includesCountryCode: phoneValue?.startsWith('+'),
      celularIncludesCountryCode: celularValue?.startsWith('+')
    });
    
    const formElements = {
      name: document.getElementById("clinic-name") as HTMLInputElement,
      responsible: document.getElementById("clinic-responsible") as HTMLInputElement,
      phone: document.getElementById("clinic-phone") as HTMLInputElement,
      whatsapp_number: document.getElementById("clinic-whatsapp") as HTMLInputElement,
      email: document.getElementById("clinic-email") as HTMLInputElement,
      website: document.getElementById("clinic-website") as HTMLInputElement,
      cnpj: document.getElementById("clinic-cnpj") as HTMLInputElement,
      description: document.getElementById("clinic-description") as HTMLTextAreaElement,
      address_street: document.getElementById("address-street") as HTMLInputElement,
      address_number: document.getElementById("address-number") as HTMLInputElement,
      address_complement: document.getElementById("address-complement") as HTMLInputElement,
      address_neighborhood: document.getElementById("address-neighborhood") as HTMLInputElement,
      address_city: document.getElementById("address-city") as HTMLInputElement,
      address_state: document.querySelector("#address-state [data-value]")?.getAttribute("data-value") as string,
      address_zip: document.getElementById("address-zip") as HTMLInputElement,
      address_country: document.querySelector("#address-country [data-value]")?.getAttribute("data-value") as string,
      work_start: document.getElementById("work-start") as HTMLInputElement,
      work_end: document.getElementById("work-end") as HTMLInputElement,
      lunch_start: document.getElementById("lunch-start") as HTMLInputElement,
      lunch_end: document.getElementById("lunch-end") as HTMLInputElement,
    };

    const configData: Partial<InsertClinic> = {
      name: formElements.name?.value || "",
      responsible: formElements.responsible?.value || "",
      phone: phoneValue || "", // This already includes +55 from PhoneInput
      celular: celularValue || "", // This already includes +55 from PhoneInput
      email: formElements.email?.value || "",
      website: formElements.website?.value || "",
      cnpj: formElements.cnpj?.value || "",
      description: formElements.description?.value || "",
      address_street: formElements.address_street?.value || "",
      address_number: formElements.address_number?.value || "",
      address_complement: formElements.address_complement?.value || "",
      address_neighborhood: formElements.address_neighborhood?.value || "",
      address_city: formElements.address_city?.value || "",
      address_state: formElements.address_state || "SP",
      address_zip: formElements.address_zip?.value || "",
      address_country: clinicConfig.address_country || "BR",
      work_start: formElements.work_start?.value || "08:00",
      work_end: formElements.work_end?.value || "18:00",
      has_lunch_break: hasLunchBreak,
      lunch_start: formElements.lunch_start?.value || "12:00",
      lunch_end: formElements.lunch_end?.value || "13:00",
      working_days: workingDays,
    };

    console.log("💾 Data being saved to database:", configData);
    updateClinicMutation.mutate(configData);
  };

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

  // Helper function to get calendar name by ID
  const getCalendarName = (calendarId: string, calendars: any[]) => {
    const calendar = calendars.find((cal: any) => cal.id === calendarId);
    return calendar ? calendar.summary || calendar.name || 'Calendário Padrão' : 'Calendário Principal';
  };

  const connectCalendarMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/calendar/auth/google", "GET");
      const data = await response.json();
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      console.error("Error connecting calendar:", error);
    },
  });

  const updateSyncPreferencesMutation = useMutation({
    mutationFn: async ({ integrationId, syncPreference }: { integrationId: number; syncPreference: string }) => {
      const response = await apiRequest(`/api/calendar/integrations/${integrationId}/sync`, "PUT", {
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
      await apiRequest(`/api/calendar/integrations/${integrationId}`, "DELETE");
    },
    onSuccess: () => {
      refetchIntegrations();
    },
  });

  const syncFromGoogleMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/calendar/sync-from-google");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sincronização concluída",
        description: "Eventos do Google Calendar foram sincronizados com sucesso",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar com o Google Calendar",
        variant: "destructive",
      });
    },
  });

  const forceRefreshMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/calendar/force-refresh", "POST");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Cache atualizado",
        description: "Próxima consulta buscará dados atualizados do Google Calendar",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar cache",
        description: "Não foi possível limpar o cache do calendário",
        variant: "destructive",
      });
    },
  });

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
      const response = await apiRequest(`/api/calendar/integrations/${integrationId}/linked-calendar`, "PUT", {
        linkedCalendarId: addEventsToCalendar === "google-account" ? linkedCalendarId : null,
        addEventsToCalendar: addEventsToCalendar
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Configuração do calendário salva com sucesso:', data);
      refetchIntegrations();
      setShowLinkedCalendarDialog(false);
      setLinkedCalendarId("");
      setAddEventsToCalendar("");
      toast({
        title: "Configuração salva",
        description: "As configurações do calendário foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      console.error('❌ Erro ao salvar configurações do calendário vinculado:', error);
      toast({
        title: "Erro ao salvar configuração",
        description: "Não foi possível atualizar as configurações do calendário.",
        variant: "destructive",
      });
    }
  });

  const handleOpenLinkedCalendarDialog = (integrationId: number) => {
    setSelectedIntegrationId(integrationId);
    
    // Find the integration and pre-populate settings
    const integration = (calendarIntegrations as any[]).find((int: any) => int.id === integrationId);
    if (integration) {
      setLinkedCalendarId(integration.calendar_id || "");
      // Set to google-account if calendar is linked, otherwise none
      setAddEventsToCalendar(integration.calendar_id ? "google-account" : "none");
    }
    
    setShowLinkedCalendarDialog(true);
  };

  const handleOpenConflictCalendarDialog = (integrationId: number) => {
    setSelectedIntegrationId(integrationId);
    
    // Find the integration and pre-populate with linked calendar
    const integration = (calendarIntegrations as any[]).find((int: any) => int.id === integrationId);
    if (integration && integration.calendar_id) {
      setConflictCalendars([integration.calendar_id]);
    }
    
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
    setSyncPreference(currentPreference || 'one-way');
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="clinic">Clínica</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="integrations">Integrações</TabsTrigger>
            <TabsTrigger value="ai">IA Livia</TabsTrigger>
            <TabsTrigger value="system">Sistema</TabsTrigger>
          </TabsList>

          <TabsContent value="clinic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clinic-name">Nome da Clínica</Label>
                    <Input
                      id="clinic-name"
                      defaultValue={clinic?.name || ""}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clinic-responsible">Responsável</Label>
                    <Input
                      id="clinic-responsible"
                      defaultValue={clinic?.responsible || ""}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clinic-phone">Telefone Principal</Label>
                    <PhoneInput
                      international
                      defaultCountry="BR"
                      value={phoneValue}
                      onChange={(value) => setPhoneValue(value || "")}
                      displayInitialValueAsLocalNumber={false}
                      countryCallingCodeEditable={false}
                      addInternationalOption={false}
                      smartCaret={false}
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 phone-input-container"
                      style={{
                        '--PhoneInputCountryFlag-aspectRatio': '1.5',
                        '--PhoneInputCountrySelectArrow-color': 'transparent',
                      } as any}
                    />
                  </div>
                  <div>
                    <Label htmlFor="clinic-celular">Celular/WhatsApp</Label>
                    <PhoneInput
                      international
                      defaultCountry="BR"
                      value={celularValue}
                      onChange={(value) => setCelularValue(value || "")}
                      displayInitialValueAsLocalNumber={false}
                      countryCallingCodeEditable={false}
                      addInternationalOption={false}
                      smartCaret={false}
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 phone-input-container"
                      style={{
                        '--PhoneInputCountryFlag-aspectRatio': '1.5',
                        '--PhoneInputCountrySelectArrow-color': 'transparent',
                      } as any}
                    />
                  </div>
                  <div>
                    <Label htmlFor="clinic-email">E-mail</Label>
                    <Input
                      id="clinic-email"
                      type="email"
                      defaultValue={clinic?.email || ""}
                      className="mt-1"
                      placeholder="contato@clinica.com.br"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clinic-website">Website</Label>
                    <Input
                      id="clinic-website"
                      defaultValue={clinic?.website || ""}
                      className="mt-1"
                      placeholder="www.clinica.com.br"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clinic-cnpj">CNPJ</Label>
                    <Input
                      id="clinic-cnpj"
                      defaultValue={clinic?.cnpj || ""}
                      className="mt-1"
                      placeholder="00.000.000/0001-00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="total-professionals">Número de Profissionais</Label>
                    <Select defaultValue="1">
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 profissional</SelectItem>
                        <SelectItem value="2-5">2-5 profissionais</SelectItem>
                        <SelectItem value="6-10">6-10 profissionais</SelectItem>
                        <SelectItem value="11-20">11-20 profissionais</SelectItem>
                        <SelectItem value="21+">Mais de 20 profissionais</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="clinic-description">Descrição da Clínica</Label>
                  <textarea
                    id="clinic-description"
                    defaultValue={clinic?.description || ""}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Descreva os serviços e especialidades da clínica..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Endereço Completo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="address-street">Logradouro</Label>
                    <Input
                      id="address-street"
                      defaultValue={clinic?.address_street || ""}
                      className="mt-1"
                      placeholder="Rua, Avenida, Praça..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="address-number">Número</Label>
                    <Input
                      id="address-number"
                      defaultValue={clinic?.address_number || ""}
                      className="mt-1"
                      placeholder="123"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address-complement">Complemento</Label>
                    <Input
                      id="address-complement"
                      defaultValue={clinic?.address_complement || ""}
                      className="mt-1"
                      placeholder="Sala, Andar, Bloco... (opcional)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address-neighborhood">Bairro</Label>
                    <Input
                      id="address-neighborhood"
                      defaultValue={clinic?.address_neighborhood || ""}
                      className="mt-1"
                      placeholder="Nome do bairro"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="address-city">Cidade</Label>
                    <Input
                      id="address-city"
                      defaultValue={clinic?.address_city || ""}
                      className="mt-1"
                      placeholder="Nome da cidade"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address-state">Estado/UF</Label>
                    <Select defaultValue={clinic?.address_state || "SP"}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AC">Acre</SelectItem>
                        <SelectItem value="AL">Alagoas</SelectItem>
                        <SelectItem value="AP">Amapá</SelectItem>
                        <SelectItem value="AM">Amazonas</SelectItem>
                        <SelectItem value="BA">Bahia</SelectItem>
                        <SelectItem value="CE">Ceará</SelectItem>
                        <SelectItem value="DF">Distrito Federal</SelectItem>
                        <SelectItem value="ES">Espírito Santo</SelectItem>
                        <SelectItem value="GO">Goiás</SelectItem>
                        <SelectItem value="MA">Maranhão</SelectItem>
                        <SelectItem value="MT">Mato Grosso</SelectItem>
                        <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                        <SelectItem value="MG">Minas Gerais</SelectItem>
                        <SelectItem value="PA">Pará</SelectItem>
                        <SelectItem value="PB">Paraíba</SelectItem>
                        <SelectItem value="PR">Paraná</SelectItem>
                        <SelectItem value="PE">Pernambuco</SelectItem>
                        <SelectItem value="PI">Piauí</SelectItem>
                        <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                        <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                        <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                        <SelectItem value="RO">Rondônia</SelectItem>
                        <SelectItem value="RR">Roraima</SelectItem>
                        <SelectItem value="SC">Santa Catarina</SelectItem>
                        <SelectItem value="SP">São Paulo</SelectItem>
                        <SelectItem value="SE">Sergipe</SelectItem>
                        <SelectItem value="TO">Tocantins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="address-zip">CEP</Label>
                    <Input
                      id="address-zip"
                      defaultValue={clinic?.address_zip || ""}
                      className="mt-1"
                      placeholder="00000-000"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address-country">País</Label>
                  <div className="mt-1">
                    <CountrySelector
                      value={clinicConfig.address_country || "BR"}
                      onChange={(value) => setClinicConfig(prev => ({ ...prev, address_country: value }))}
                      placeholder="Selecione o país"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Horários de Funcionamento</CardTitle>
                <p className="text-sm text-slate-600">Configure os dias e horários de atendimento da clínica</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-slate-700">Dias de Funcionamento</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: 'monday', label: 'Segunda', defaultChecked: true },
                      { id: 'tuesday', label: 'Terça', defaultChecked: true },
                      { id: 'wednesday', label: 'Quarta', defaultChecked: true },
                      { id: 'thursday', label: 'Quinta', defaultChecked: true },
                      { id: 'friday', label: 'Sexta', defaultChecked: true },
                      { id: 'saturday', label: 'Sábado', defaultChecked: false },
                      { id: 'sunday', label: 'Domingo', defaultChecked: false }
                    ].map((day) => (
                      <div key={day.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={day.id} 
                          checked={workingDays.includes(day.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setWorkingDays([...workingDays, day.id]);
                            } else {
                              setWorkingDays(workingDays.filter(d => d !== day.id));
                            }
                          }}
                        />
                        <Label htmlFor={day.id} className="text-sm">{day.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-slate-700">Horário de Atendimento</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="work-start">Início</Label>
                        <Input
                          id="work-start"
                          type="time"
                          defaultValue="08:00"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="work-end">Fim</Label>
                        <Input
                          id="work-end"
                          type="time"
                          defaultValue="18:00"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="lunch-break" 
                        checked={hasLunchBreak}
                        onCheckedChange={(checked) => setHasLunchBreak(checked === true)}
                      />
                      <Label htmlFor="lunch-break" className="text-sm font-medium text-slate-700">
                        Intervalo para Almoço
                      </Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="lunch-start" className={!hasLunchBreak ? "text-slate-400" : ""}>
                          Início do Almoço
                        </Label>
                        <Input
                          id="lunch-start"
                          type="time"
                          defaultValue="12:00"
                          className="mt-1"
                          disabled={!hasLunchBreak}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lunch-end" className={!hasLunchBreak ? "text-slate-400" : ""}>
                          Fim do Almoço
                        </Label>
                        <Input
                          id="lunch-end"
                          type="time"
                          defaultValue="13:00"
                          className="mt-1"
                          disabled={!hasLunchBreak}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select defaultValue="america-sao-paulo">
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o fuso horário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="america-sao-paulo">America/São_Paulo (UTC-3)</SelectItem>
                      <SelectItem value="america-manaus">America/Manaus (UTC-4)</SelectItem>
                      <SelectItem value="america-rio-branco">America/Rio_Branco (UTC-5)</SelectItem>
                      <SelectItem value="america-noronha">America/Noronha (UTC-2)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => refetchClinic()}>
                Cancelar
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSaveConfiguration}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Todas as Configurações
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement clinicId={1} />
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            {/* WhatsApp Evolution API Configuration */}
            <WhatsAppIntegration />
            
            {/* WhatsApp Number Management */}
            <WhatsAppManager clinicId={1} userId="default-user-id" />

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
                                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-medium text-sm">Calendário Vinculado</p>
                                        <p className="text-xs text-slate-600">Sincronizar agendamentos com seu calendário vinculado</p>
                                        {integration.calendar_id && (
                                          <div className="mt-1 space-y-1">
                                            <div className="flex items-center space-x-2">
                                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                              <span className="text-xs font-medium text-blue-700">{integration.email}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              <Calendar className="w-3 h-3 text-slate-500" />
                                              <span className="text-xs text-slate-600">Calendário Principal</span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {integration.calendar_id && (
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                          Calendário Vinculado
                                        </Badge>
                                      )}
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleOpenLinkedCalendarDialog(integration.id)}
                                      >
                                        {integration.calendar_id ? "Editar" : "Configurar"}
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                        <AlertCircle className="w-5 h-5 text-orange-600" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-medium text-sm">Calendários de Conflito</p>
                                        <p className="text-xs text-slate-600">Adicionar calendários adicionais para verificar conflitos de agendamento duplo</p>
                                        {integration.calendar_id && (
                                          <div className="mt-1 flex items-center space-x-2">
                                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                            <span className="text-xs font-medium text-blue-700">{integration.email}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {integration.calendar_id && (
                                        <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
                                          Detectando Conflitos
                                        </Badge>
                                      )}
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleOpenConflictCalendarDialog(integration.id)}
                                      >
                                        Editar
                                      </Button>
                                    </div>
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

                                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                    <div className="flex items-center space-x-3">
                                      <RefreshCw className="w-5 h-5 text-green-600" />
                                      <div>
                                        <p className="font-medium text-sm">Atualizar Eventos</p>
                                        <p className="text-xs text-slate-600">Forçar sincronização imediata com Google Calendar</p>
                                      </div>
                                    </div>
                                    <div className="flex space-x-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => syncFromGoogleMutation.mutate()}
                                        disabled={syncFromGoogleMutation.isPending}
                                      >
                                        {syncFromGoogleMutation.isPending ? (
                                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                          <RefreshCw className="w-4 h-4 mr-2" />
                                        )}
                                        Sincronizar
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => forceRefreshMutation.mutate()}
                                        disabled={forceRefreshMutation.isPending}
                                      >
                                        {forceRefreshMutation.isPending ? (
                                          <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <RefreshCw className="w-4 h-4" />
                                        )}
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Calendário Vinculado</DialogTitle>
              <DialogDescription>
                Todos os novos eventos criados no sistema serão adicionados ao seu calendário vinculado e todos os eventos criados no calendário vinculado serão sincronizados com o sistema.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {isLoadingCalendars ? (
                <div className="text-center py-4">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-sm text-slate-600 mt-2">Carregando agendas...</p>
                </div>
              ) : (userCalendars as any[]).length > 0 ? (
                <>
                  {/* Bidirectional sync visualization */}
                  <div className="bg-slate-50 rounded-lg p-6">
                    <div className="flex items-center justify-center space-x-8">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Calendar className="w-8 h-8 text-slate-600" />
                          <Plus className="w-4 h-4 text-blue-600 ml-1" />
                        </div>
                        <p className="text-sm font-medium text-slate-800">Sistema</p>
                        <p className="text-xs text-blue-600 mt-1">Agendamentos do Sistema</p>
                      </div>
                      
                      <div className="flex flex-col items-center space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-12 h-0.5 bg-blue-400"></div>
                          <div className="w-0 h-0 border-l-4 border-l-blue-400 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-0 h-0 border-r-4 border-r-blue-400 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                          <div className="w-12 h-0.5 bg-blue-400"></div>
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Calendar className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-sm font-medium text-slate-800">Calendário vinculado</p>
                        <p className="text-xs text-blue-600 mt-1">Eventos do Calendário Vinculado</p>
                      </div>
                    </div>
                  </div>

                  {/* Calendar selection options */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-slate-800 mb-3">Em qual calendário terceirizado devemos adicionar novos eventos?</h4>
                      
                      <div className="space-y-3">
                        {/* Google account option */}
                        {(userCalendars as any[]).length > 0 && (
                          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50">
                            <input
                              type="radio"
                              id="google-account"
                              name="add-events-calendar"
                              value="google-account"
                              checked={addEventsToCalendar === "google-account"}
                              className="w-4 h-4 text-blue-600"
                              onChange={() => setAddEventsToCalendar("google-account")}
                            />
                            <div className="flex items-center space-x-2 flex-1">
                              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-blue-600" />
                              </div>
                              <Label htmlFor="google-account" className="cursor-pointer flex-1">
                                <span className="font-medium text-slate-700">
                                  {(userCalendars as any[])[0]?.email || 'caio@avanttocrm.com'}
                                </span>
                              </Label>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50">
                          <input
                            type="radio"
                            id="no-add-events"
                            name="add-events-calendar"
                            value="none"
                            checked={addEventsToCalendar === "none"}
                            className="w-4 h-4 text-blue-600"
                            onChange={() => setAddEventsToCalendar("none")}
                          />
                          <div className="flex items-center space-x-2 flex-1">
                            <X className="w-4 h-4 text-slate-400" />
                            <Label htmlFor="no-add-events" className="cursor-pointer">
                              <span className="font-medium text-slate-700">Não adicionar novos eventos a nenhum calendário</span>
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {addEventsToCalendar === "google-account" && (
                      <div>
                        <h4 className="font-medium text-slate-800 mb-3">Selecione o Google Calendar onde você gostaria de adicionar novos eventos</h4>
                        
                        <Select value={linkedCalendarId} onValueChange={setLinkedCalendarId}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione um calendário" />
                          </SelectTrigger>
                          <SelectContent>
                            {(userCalendars as any[]).map((calendar: any) => (
                              <SelectItem key={calendar.id} value={calendar.id}>
                                <div className="flex items-center space-x-2">
                                  <div 
                                    className="w-3 h-3 rounded-full border"
                                    style={{ backgroundColor: calendar.backgroundColor || '#4285f4' }}
                                  />
                                  <span>{calendar.summary}</span>
                                  {calendar.primary && (
                                    <Badge variant="secondary" className="text-xs ml-2">Principal</Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {linkedCalendarId && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-blue-800">Calendário selecionado anteriormente</p>
                            <p className="text-xs text-blue-700 mt-1">
                              O calendário {(userCalendars as any[]).find(cal => cal.id === linkedCalendarId)?.summary} será removido dos calendários vinculado e de conflito.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
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
              <Button 
                onClick={() => {
                  if (selectedIntegrationId && (linkedCalendarId || addEventsToCalendar)) {
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
                }`}>
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
                }`}>
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
    </div>
  );
}