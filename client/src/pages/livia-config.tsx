import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Bot, 
  Clock, 
  Building, 
  MessageSquare, 
  Users, 
  Phone,
  Calendar,
  Bell,
  Shield,
  Zap,
  Brain,
  Heart,
  Stethoscope,
  Save,
  RefreshCw
} from "lucide-react";

const voiceTones = [
  { value: "professional", label: "Profissional" },
  { value: "friendly", label: "Amigável" },
  { value: "empathetic", label: "Empática" },
  { value: "caring", label: "Cuidadosa" },
  { value: "formal", label: "Formal" },
];

const specialties = [
  { value: "psychology", label: "Psicologia" },
  { value: "psychiatry", label: "Psiquiatria" },
  { value: "pediatrics", label: "Pediatria" },
  { value: "cardiology", label: "Cardiologia" },
  { value: "neurology", label: "Neurologia" },
  { value: "general", label: "Clínica Geral" },
  { value: "dermatology", label: "Dermatologia" },
  { value: "orthopedics", label: "Ortopedia" },
];

export function LiviaConfig() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState({
    // Company Information
    clinicName: "Clínica Bem-Estar",
    specialty: "psychology",
    description: "Clínica especializada em saúde mental com foco em TDAH infantil e adulto",
    
    // Operating Hours
    operatingHours: {
      monday: { start: "08:00", end: "18:00", active: true },
      tuesday: { start: "08:00", end: "18:00", active: true },
      wednesday: { start: "08:00", end: "18:00", active: true },
      thursday: { start: "08:00", end: "18:00", active: true },
      friday: { start: "08:00", end: "17:00", active: true },
      saturday: { start: "09:00", end: "13:00", active: true },
      sunday: { start: "", end: "", active: false },
    },
    
    // AI Behavior
    voiceTone: "empathetic",
    responseTime: "immediate",
    maxResponseLength: 200,
    useEmojis: true,
    personalizedGreeting: true,
    
    // Follow-up Settings
    followUpSettings: {
      inactivityTime: 24, // hours
      maxFollowUps: 3,
      followUpInterval: 48, // hours
      enableSmartFollowUp: true,
    },
    
    // Emergency Settings
    emergencyKeywords: ["urgente", "emergência", "crise", "ajuda", "socorro"],
    emergencyResponse: "Entendo que você precisa de ajuda urgente. Nossa equipe será notificada imediatamente. Em caso de emergência médica, ligue para 192 ou procure o hospital mais próximo.",
    
    // Appointment Settings
    appointmentSettings: {
      allowOnlineBooking: true,
      confirmationRequired: true,
      reminderTime: 24, // hours before appointment
      maxAdvanceBooking: 30, // days
    },
    
    // Data & Privacy
    dataRetention: 365, // days
    privacyMode: true,
    shareDataWithTeam: true,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
  };

  const dayNames = {
    monday: "Segunda-feira",
    tuesday: "Terça-feira", 
    wednesday: "Quarta-feira",
    thursday: "Quinta-feira",
    friday: "Sexta-feira",
    saturday: "Sábado",
    sunday: "Domingo",
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-96 bg-slate-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-medical-blue rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Configurações da Livia IA</h1>
            <p className="text-slate-600">Personalize o comportamento da assistente virtual</p>
          </div>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-medical-blue hover:bg-blue-700"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Informações da Clínica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="clinicName">Nome da Clínica</Label>
              <Input
                id="clinicName"
                value={config.clinicName}
                onChange={(e) => setConfig({...config, clinicName: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="specialty">Especialidade Principal</Label>
              <Select value={config.specialty} onValueChange={(value) => setConfig({...config, specialty: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((specialty) => (
                    <SelectItem key={specialty.value} value={specialty.value}>
                      {specialty.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="description">Descrição da Clínica</Label>
              <Textarea
                id="description"
                value={config.description}
                onChange={(e) => setConfig({...config, description: e.target.value})}
                placeholder="Descreva os serviços e especialidades da clínica..."
                className="min-h-20"
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Behavior */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Comportamento da IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="voiceTone">Tom de Voz</Label>
              <Select value={config.voiceTone} onValueChange={(value) => setConfig({...config, voiceTone: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {voiceTones.map((tone) => (
                    <SelectItem key={tone.value} value={tone.value}>
                      {tone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="maxResponseLength">Tamanho Máximo de Resposta (caracteres)</Label>
              <Input
                id="maxResponseLength"
                type="number"
                value={config.maxResponseLength}
                onChange={(e) => setConfig({...config, maxResponseLength: parseInt(e.target.value)})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="useEmojis">Usar Emojis nas Respostas</Label>
              <Switch
                id="useEmojis"
                checked={config.useEmojis}
                onCheckedChange={(checked) => setConfig({...config, useEmojis: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="personalizedGreeting">Saudação Personalizada</Label>
              <Switch
                id="personalizedGreeting"
                checked={config.personalizedGreeting}
                onCheckedChange={(checked) => setConfig({...config, personalizedGreeting: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Operating Hours */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Horário de Funcionamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(config.operatingHours).map(([day, hours]) => (
                <div key={day} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-medium">{dayNames[day as keyof typeof dayNames]}</Label>
                    <Switch
                      checked={hours.active}
                      onCheckedChange={(checked) => 
                        setConfig({
                          ...config,
                          operatingHours: {
                            ...config.operatingHours,
                            [day]: { ...hours, active: checked }
                          }
                        })
                      }
                    />
                  </div>
                  {hours.active && (
                    <div className="flex gap-2">
                      <Input
                        type="time"
                        value={hours.start}
                        onChange={(e) => 
                          setConfig({
                            ...config,
                            operatingHours: {
                              ...config.operatingHours,
                              [day]: { ...hours, start: e.target.value }
                            }
                          })
                        }
                        className="flex-1"
                      />
                      <Input
                        type="time"
                        value={hours.end}
                        onChange={(e) => 
                          setConfig({
                            ...config,
                            operatingHours: {
                              ...config.operatingHours,
                              [day]: { ...hours, end: e.target.value }
                            }
                          })
                        }
                        className="flex-1"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Follow-up Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Configurações de Follow-up
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="inactivityTime">Tempo de Inatividade (horas)</Label>
              <Input
                id="inactivityTime"
                type="number"
                value={config.followUpSettings.inactivityTime}
                onChange={(e) => setConfig({
                  ...config,
                  followUpSettings: {
                    ...config.followUpSettings,
                    inactivityTime: parseInt(e.target.value)
                  }
                })}
              />
              <p className="text-xs text-slate-500 mt-1">
                Tempo sem resposta antes de enviar follow-up
              </p>
            </div>
            
            <div>
              <Label htmlFor="maxFollowUps">Máximo de Follow-ups</Label>
              <Input
                id="maxFollowUps"
                type="number"
                value={config.followUpSettings.maxFollowUps}
                onChange={(e) => setConfig({
                  ...config,
                  followUpSettings: {
                    ...config.followUpSettings,
                    maxFollowUps: parseInt(e.target.value)
                  }
                })}
              />
            </div>
            
            <div>
              <Label htmlFor="followUpInterval">Intervalo entre Follow-ups (horas)</Label>
              <Input
                id="followUpInterval"
                type="number"
                value={config.followUpSettings.followUpInterval}
                onChange={(e) => setConfig({
                  ...config,
                  followUpSettings: {
                    ...config.followUpSettings,
                    followUpInterval: parseInt(e.target.value)
                  }
                })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="enableSmartFollowUp">Follow-up Inteligente</Label>
              <Switch
                id="enableSmartFollowUp"
                checked={config.followUpSettings.enableSmartFollowUp}
                onCheckedChange={(checked) => setConfig({
                  ...config,
                  followUpSettings: {
                    ...config.followUpSettings,
                    enableSmartFollowUp: checked
                  }
                })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appointment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Configurações de Agendamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="allowOnlineBooking">Permitir Agendamento Online</Label>
              <Switch
                id="allowOnlineBooking"
                checked={config.appointmentSettings.allowOnlineBooking}
                onCheckedChange={(checked) => setConfig({
                  ...config,
                  appointmentSettings: {
                    ...config.appointmentSettings,
                    allowOnlineBooking: checked
                  }
                })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="confirmationRequired">Confirmação Obrigatória</Label>
              <Switch
                id="confirmationRequired"
                checked={config.appointmentSettings.confirmationRequired}
                onCheckedChange={(checked) => setConfig({
                  ...config,
                  appointmentSettings: {
                    ...config.appointmentSettings,
                    confirmationRequired: checked
                  }
                })}
              />
            </div>
            
            <div>
              <Label htmlFor="reminderTime">Lembrete (horas antes)</Label>
              <Input
                id="reminderTime"
                type="number"
                value={config.appointmentSettings.reminderTime}
                onChange={(e) => setConfig({
                  ...config,
                  appointmentSettings: {
                    ...config.appointmentSettings,
                    reminderTime: parseInt(e.target.value)
                  }
                })}
              />
            </div>
            
            <div>
              <Label htmlFor="maxAdvanceBooking">Antecedência Máxima (dias)</Label>
              <Input
                id="maxAdvanceBooking"
                type="number"
                value={config.appointmentSettings.maxAdvanceBooking}
                onChange={(e) => setConfig({
                  ...config,
                  appointmentSettings: {
                    ...config.appointmentSettings,
                    maxAdvanceBooking: parseInt(e.target.value)
                  }
                })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Configurações de Emergência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="emergencyKeywords">Palavras-chave de Emergência</Label>
              <Input
                id="emergencyKeywords"
                value={config.emergencyKeywords.join(", ")}
                onChange={(e) => setConfig({
                  ...config,
                  emergencyKeywords: e.target.value.split(", ").filter(word => word.trim())
                })}
                placeholder="Separar por vírgula"
              />
              <p className="text-xs text-slate-500 mt-1">
                Palavras que ativam o protocolo de emergência
              </p>
            </div>
            
            <div>
              <Label htmlFor="emergencyResponse">Resposta Automática de Emergência</Label>
              <Textarea
                id="emergencyResponse"
                value={config.emergencyResponse}
                onChange={(e) => setConfig({...config, emergencyResponse: e.target.value})}
                className="min-h-20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Dados e Privacidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="dataRetention">Retenção de Dados (dias)</Label>
              <Input
                id="dataRetention"
                type="number"
                value={config.dataRetention}
                onChange={(e) => setConfig({...config, dataRetention: parseInt(e.target.value)})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="privacyMode">Modo Privacidade</Label>
              <Switch
                id="privacyMode"
                checked={config.privacyMode}
                onCheckedChange={(checked) => setConfig({...config, privacyMode: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="shareDataWithTeam">Compartilhar com Equipe</Label>
              <Switch
                id="shareDataWithTeam"
                checked={config.shareDataWithTeam}
                onCheckedChange={(checked) => setConfig({...config, shareDataWithTeam: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Status da IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-green-800">Livia Online</span>
              </div>
              <Badge className="bg-green-100 text-green-800">Ativa</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2 bg-slate-50 rounded">
                <p className="text-slate-600">Conversas Hoje</p>
                <p className="font-semibold">127</p>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <p className="text-slate-600">Tempo Resposta</p>
                <p className="font-semibold">0.8s</p>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <p className="text-slate-600">Taxa Resolução</p>
                <p className="font-semibold">94%</p>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <p className="text-slate-600">Satisfação</p>
                <p className="font-semibold">4.8/5</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}