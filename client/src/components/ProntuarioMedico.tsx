import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  Mic, 
  Sparkles, 
  Save,
  Plus,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Activity,
  Heart,
  Brain,
  Eye,
  Thermometer,
  History
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MedicalRecord {
  id: number;
  appointment_id: number;
  contact_id: number;
  clinic_id: number;
  record_type: string;
  chief_complaint?: string;
  history_present_illness?: string;
  physical_examination?: string;
  diagnosis?: string;
  treatment_plan?: string;
  prescriptions?: any;
  exam_requests?: any;
  follow_up_instructions?: string;
  observations?: string;
  vital_signs?: any;
  attachments?: string[];
  voice_transcription?: string;
  ai_summary?: string;
  templates_used?: string[];
  version: number;
  is_active: boolean;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

interface Appointment {
  id: number;
  contact_id: number;
  clinic_id: number;
  scheduled_date: string;
  appointment_type: string;
  doctor_name: string;
  specialty: string;
  status: string;
  duration_minutes: number;
  session_notes?: string;
}

interface ProntuarioMedicoProps {
  contactId: number;
  appointments: Appointment[];
}

const medicalTemplates = [
  {
    id: "nota_livre",
    name: "📝 Nota Livre",
    template: `📅 ${new Date().toLocaleDateString('pt-BR')} - ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}

`
  },
  {
    id: "consulta_geral",
    name: "🩺 Consulta Médica",
    template: `📅 ${new Date().toLocaleDateString('pt-BR')} - Consulta Médica

**Queixa Principal:**


**História da Doença Atual:**


**Exame Físico:**
• Estado geral:
• Sinais vitais: PA ___ mmHg | FC ___ bpm | T ___°C
• Específico:


**Hipótese Diagnóstica:**


**Conduta:**
• Medicações:
• Exames:
• Orientações:


**Retorno:**`
  },
  {
    id: "retorno",
    name: "🔄 Retorno",
    template: `📅 ${new Date().toLocaleDateString('pt-BR')} - Consulta de Retorno

**Evolução:**


**Adesão ao tratamento:**


**Exame físico atual:**


**Avaliação:**


**Ajustes:**


**Próximo retorno:**`
  },
  {
    id: "urgencia",
    name: "🚨 Urgência",
    template: `⏰ ${new Date().toLocaleString('pt-BR')} - Atendimento de Urgência

**Motivo:**


**Sinais vitais:**
PA: ___ mmHg | FC: ___ bpm | T: ___°C | SatO2: ___%

**Exame físico:**


**Conduta:**


**Evolução:**`
  },
  {
    id: "procedimento",
    name: "⚕️ Procedimento",
    template: `📅 ${new Date().toLocaleDateString('pt-BR')} - Procedimento

**Procedimento realizado:**


**Indicação:**


**Técnica:**


**Intercorrências:**


**Orientações pós-procedimento:**`
  }
];

export default function ProntuarioMedico({ contactId, appointments }: ProntuarioMedicoProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<number | null>(null);
  const [newRecord, setNewRecord] = useState({
    record_type: "consultation",
    content: ""
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Buscar prontuários do contato
  const { data: medicalRecords = [], isLoading } = useQuery({
    queryKey: ["/api/contacts", contactId, "medical-records"],
    enabled: !!contactId
  });

  // Buscar prontuário específico da consulta selecionada
  const { data: selectedRecord } = useQuery({
    queryKey: ["/api/appointments", selectedAppointment, "medical-record"],
    enabled: !!selectedAppointment
  });

  // Mutation para criar prontuário
  const createRecordMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/medical-records", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", contactId, "medical-records"] });
      setIsCreating(false);
      setNewRecord({
        record_type: "consultation",
        content: ""
      });
      toast({
        title: "Prontuário criado",
        description: "Prontuário médico salvo com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar prontuário.",
        variant: "destructive",
      });
    }
  });

  // Mutation para atualizar prontuário
  const updateRecordMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/medical-records/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", contactId, "medical-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments", selectedAppointment, "medical-record"] });
      toast({
        title: "Prontuário atualizado",
        description: "Alterações salvas com sucesso.",
      });
    }
  });

  const formatDateTime = (dateTime: string) => {
    return format(new Date(dateTime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const handleCreateRecord = () => {
    if (!selectedAppointment) {
      toast({
        title: "Erro",
        description: "Selecione uma consulta para criar o prontuário.",
        variant: "destructive",
      });
      return;
    }

    const appointment = appointments.find(apt => apt.id === selectedAppointment);
    if (!appointment) {
      toast({
        title: "Erro",
        description: "Consulta não encontrada.",
        variant: "destructive",
      });
      return;
    }

    createRecordMutation.mutate({
      appointment_id: selectedAppointment,
      contact_id: contactId,
      clinic_id: appointment.clinic_id,
      ...newRecord
    });
  };

  const applyTemplate = (templateId: string) => {
    const template = medicalTemplates.find(t => t.id === templateId);
    if (template) {
      setNewRecord(prev => ({
        ...prev,
        content: template.template
      }));
      setSelectedTemplate(templateId);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        // Aqui você pode implementar o upload do áudio e transcrição
        console.log('Gravação finalizada:', blob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível acessar o microfone.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAppointmentOptions = () => {
    return appointments
      .filter(apt => apt.status === 'realizado')
      .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando prontuários...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Botão Criar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Prontuário Médico</h2>
          <p className="text-gray-600">Registros médicos e evolução do paciente</p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Prontuário
        </Button>
      </div>

      {/* Modal de Criação de Prontuário */}
      {isCreating && (
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Novo Prontuário
              </DialogTitle>
              <DialogDescription>
                Crie um novo registro médico para este paciente
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Seleção de Consulta (Opcional) */}
              <div>
                <Label className="text-sm font-medium">Vincular à Consulta (Opcional)</Label>
                <Select
                  value={selectedAppointment?.toString() || ""}
                  onValueChange={(value) => setSelectedAppointment(value ? parseInt(value) : null)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione uma consulta ou deixe em branco" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAppointmentOptions().map((appointment) => (
                      <SelectItem key={appointment.id} value={appointment.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {appointment.appointment_type} - Dr(a). {appointment.doctor_name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatDateTime(appointment.scheduled_date)} - {appointment.specialty}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Templates Médicos */}
              <div>
                <Label className="text-sm font-medium">Template Médico</Label>
                <Select value={selectedTemplate} onValueChange={applyTemplate}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Escolha um template (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicalTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gravação de Voz */}
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "outline"}
                  onClick={isRecording ? stopRecording : startRecording}
                  className="flex items-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  {isRecording ? "Parar Gravação" : "Gravar Áudio"}
                </Button>
                {isRecording && (
                  <div className="flex items-center gap-2 text-red-600">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                    <span className="text-sm font-mono">{formatRecordingTime(recordingTime)}</span>
                  </div>
                )}
              </div>

              {/* Nota Livre */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Conteúdo da Nota</Label>
                <Textarea
                  value={newRecord.content}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Digite sua nota médica aqui... Use os templates acima para facilitar o preenchimento."
                  rows={20}
                  className="font-mono text-sm resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Dica: Use markdown para formatação (**, *, -, etc.)
                </p>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateRecord}
                  disabled={createRecordMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {createRecordMutation.isPending ? "Salvando..." : "Salvar Prontuário"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Timeline de Prontuários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Timeline de Prontuários
          </CardTitle>
          <CardDescription>
            Histórico completo dos registros médicos do paciente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {medicalRecords.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Nenhum prontuário registrado ainda</p>
              <p className="text-sm text-gray-400">Clique em "Novo Prontuário" para criar o primeiro registro</p>
            </div>
          ) : (
            <div className="space-y-6">
              {(medicalRecords as MedicalRecord[]).map((record, index) => {
                const appointment = appointments.find(apt => apt.id === record.appointment_id);
                const isFirst = index === 0;
                const isLast = index === medicalRecords.length - 1;
                
                return (
                  <div key={record.id} className="relative">
                    {/* Timeline Line */}
                    {!isLast && (
                      <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200"></div>
                    )}
                    
                    {/* Timeline Dot */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 text-lg">
                              {record.chief_complaint || "Prontuário Médico"}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {format(new Date(record.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            {appointment && (
                              <div className="flex items-center gap-2 mt-1">
                                <Stethoscope className="w-4 h-4 text-blue-500" />
                                <span className="text-sm text-blue-600">
                                  {appointment.appointment_type} - Dr(a). {appointment.doctor_name}
                                </span>
                              </div>
                            )}
                          </div>
                          <Badge variant={isFirst ? "default" : "secondary"}>
                            {isFirst ? "Mais Recente" : `Versão ${record.version}`}
                          </Badge>
                        </div>

                        {/* Conteúdo da Nota */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                            {record.observations || record.chief_complaint || "Nota vazia"}
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex gap-2 mt-4 pt-3 border-t">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {/* Ver detalhes completos */}}
                          >
                            Ver Completo
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {/* Editar */}}
                          >
                            Editar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}