import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  MessageCircle, 
  FileText, 
  Activity,
  Edit,
  Save,
  Camera,
  User,
  Clock,
  Stethoscope,
  Heart,
  Pill,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Contact, Appointment, PipelineOpportunity, PipelineActivity } from "@/../../shared/schema";

const statusLabels = {
  novo: { label: "Novo", color: "bg-blue-100 text-blue-800" },
  em_conversa: { label: "Em Conversa", color: "bg-yellow-100 text-yellow-800" },
  agendado: { label: "Agendado", color: "bg-green-100 text-green-800" },
  pos_atendimento: { label: "Pós Atendimento", color: "bg-purple-100 text-purple-800" },
  perdido: { label: "Perdido", color: "bg-red-100 text-red-800" },
};

export function ContatoDetalhes() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const contactId = parseInt(params.id!);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Contact>>({});
  const [maraMessage, setMaraMessage] = useState("");
  const [maraConversation, setMaraConversation] = useState<Array<{role: 'user' | 'assistant', content: string, timestamp: Date}>>([
    {
      role: 'assistant',
      content: 'Olá! Sou a Mara, sua assistente inteligente. Posso ajudar com informações sobre este paciente, sugestões de tratamento, análise do histórico médico e muito mais. Como posso ajudar?',
      timestamp: new Date()
    }
  ]);

  // Buscar dados do contato
  const { data: contact, isLoading: contactLoading } = useQuery<Contact>({
    queryKey: ["/api/contacts", contactId],
    queryFn: async () => {
      const response = await fetch(`/api/contacts/${contactId}`);
      if (!response.ok) throw new Error('Failed to fetch contact');
      return response.json();
    },
  });

  // Buscar consultas do contato
  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/contacts", contactId, "appointments"],
    queryFn: async () => {
      const response = await fetch(`/api/contacts/${contactId}/appointments`);
      if (!response.ok) throw new Error('Failed to fetch appointments');
      return response.json();
    },
  });

  // Buscar oportunidades do pipeline
  const { data: opportunities = [] } = useQuery<PipelineOpportunity[]>({
    queryKey: ["/api/pipeline/opportunities", { contact_id: contactId }],
    queryFn: async () => {
      const response = await fetch(`/api/pipeline/opportunities?contact_id=${contactId}`);
      if (!response.ok) return []; // Se não houver dados do pipeline, retorna array vazio
      return response.json();
    },
  });

  useEffect(() => {
    if (contact) {
      setEditData(contact);
    }
  }, [contact]);

  const updateContactMutation = useMutation({
    mutationFn: async (data: Partial<Contact>) => {
      const res = await apiRequest("PUT", `/api/contacts/${contactId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", contactId] });
      toast({
        title: "Contato atualizado",
        description: "As informações foram salvas com sucesso.",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendMaraMessage = async () => {
    if (!maraMessage.trim()) return;
    
    const userMessage = {
      role: 'user' as const,
      content: maraMessage,
      timestamp: new Date()
    };
    
    setMaraConversation(prev => [...prev, userMessage]);
    setMaraMessage("");
    
    // Simulated AI response (in real implementation, this would call your AI API)
    setTimeout(() => {
      const aiResponse = {
        role: 'assistant' as const,
        content: `Baseado no perfil de ${contact?.name}, posso observar que se trata de um paciente de ${contact?.age} anos, ${contact?.profession}. Precisa de mais informações específicas sobre algum aspecto do histórico médico ou gostaria de sugestões de abordagem terapêutica?`,
        timestamp: new Date()
      };
      setMaraConversation(prev => [...prev, aiResponse]);
    }, 1000);
  };

  if (contactLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="h-96 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-4 lg:p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Contato não encontrado</h1>
          <Button onClick={() => setLocation("/contatos")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Contatos
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = statusLabels[contact.status as keyof typeof statusLabels];

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setLocation("/contatos")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{contact.name}</h1>
            <p className="text-slate-600">Detalhes do paciente</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusInfo.color}>
            {statusInfo.label}
          </Badge>
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={() => {
              if (isEditing) {
                updateContactMutation.mutate(editData);
              } else {
                setIsEditing(true);
              }
            }}
            disabled={updateContactMutation.isPending}
          >
            {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
            {isEditing ? "Salvar" : "Editar"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="relative inline-block">
                <Avatar className="w-24 h-24 mx-auto">
                  <AvatarImage src="" alt={contact.name} />
                  <AvatarFallback className="text-2xl">
                    {contact.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              <CardTitle className="mt-4">{contact.name}</CardTitle>
              <p className="text-slate-600">{contact.profession}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-500" />
                <span>{contact.phone}</span>
              </div>
              {contact.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span>{contact.email}</span>
                </div>
              )}
              {contact.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span className="text-sm">{contact.address}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                <span>{contact.age} anos</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-sm">
                  Desde {format(new Date(contact.first_contact!), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="prontuario" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="prontuario">Prontuário</TabsTrigger>
              <TabsTrigger value="consultas">Consultas</TabsTrigger>
              <TabsTrigger value="mara">Mara IA</TabsTrigger>
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            </TabsList>

            <TabsContent value="prontuario" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Informações Médicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      <Heart className="w-4 h-4" />
                      Histórico Médico
                    </label>
                    {isEditing ? (
                      <Textarea
                        value={editData.medical_history || ""}
                        onChange={(e) => setEditData({...editData, medical_history: e.target.value})}
                        placeholder="Histórico médico do paciente..."
                        rows={4}
                      />
                    ) : (
                      <p className="text-slate-600 bg-slate-50 p-3 rounded">
                        {contact.medical_history || "Nenhum histórico médico registrado"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      <Pill className="w-4 h-4" />
                      Medicações Atuais
                    </label>
                    {isEditing ? (
                      <Textarea
                        value={Array.isArray(editData.current_medications) 
                          ? editData.current_medications.join('\n') 
                          : editData.current_medications || ""}
                        onChange={(e) => setEditData({
                          ...editData, 
                          current_medications: e.target.value.split('\n').filter(med => med.trim())
                        })}
                        placeholder="Uma medicação por linha..."
                        rows={3}
                      />
                    ) : (
                      <p className="text-slate-600 bg-slate-50 p-3 rounded">
                        {Array.isArray(contact.current_medications) && contact.current_medications.length > 0
                          ? contact.current_medications.join(', ')
                          : "Nenhuma medicação registrada"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      Alergias
                    </label>
                    {isEditing ? (
                      <Textarea
                        value={Array.isArray(editData.allergies) 
                          ? editData.allergies.join('\n') 
                          : editData.allergies || ""}
                        onChange={(e) => setEditData({
                          ...editData, 
                          allergies: e.target.value.split('\n').filter(allergy => allergy.trim()) as any
                        })}
                        placeholder="Uma alergia por linha..."
                        rows={2}
                      />
                    ) : (
                      <p className="text-slate-600 bg-slate-50 p-3 rounded">
                        {Array.isArray(contact.allergies) && contact.allergies.length > 0
                          ? contact.allergies.join(', ')
                          : "Nenhuma alergia registrada"}
                      </p>
                    )}
                  </div>

                  {contact.emergency_contact && (
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        Contato de Emergência
                      </label>
                      <p className="text-slate-600 bg-slate-50 p-3 rounded">
                        {contact.emergency_contact}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="consultas" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5" />
                    Histórico de Consultas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {appointments.length > 0 ? (
                    <div className="space-y-4">
                      {appointments.map((appointment) => (
                        <div key={appointment.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold">{appointment.appointment_type}</h4>
                              <p className="text-sm text-slate-600">
                                {format(new Date(appointment.scheduled_date!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            <Badge className={
                              appointment.status === 'realizado' ? 'bg-green-100 text-green-800' :
                              appointment.status === 'agendado' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {appointment.status}
                            </Badge>
                          </div>
                          {appointment.doctor_name && (
                            <p className="text-sm text-slate-600 mb-2">
                              Dr(a). {appointment.doctor_name} - {appointment.specialty}
                            </p>
                          )}
                          {appointment.session_notes && (
                            <p className="text-sm bg-slate-50 p-2 rounded">
                              {appointment.session_notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-center py-8">
                      Nenhuma consulta registrada para este paciente.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mara" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Conversa com Mara IA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96 border rounded-lg p-4 overflow-y-auto mb-4 bg-slate-50">
                    {maraConversation.map((message, index) => (
                      <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                        <div className={`inline-block p-3 rounded-lg max-w-[80%] ${
                          message.role === 'user' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white border'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.role === 'user' ? 'text-blue-100' : 'text-slate-500'
                          }`}>
                            {format(message.timestamp, "HH:mm")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={maraMessage}
                      onChange={(e) => setMaraMessage(e.target.value)}
                      placeholder="Pergunte algo sobre o paciente..."
                      onKeyPress={(e) => e.key === 'Enter' && sendMaraMessage()}
                    />
                    <Button onClick={sendMaraMessage}>
                      Enviar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pipeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Histórico do Pipeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {opportunities.length > 0 ? (
                    <div className="space-y-4">
                      {opportunities.map((opportunity) => (
                        <div key={opportunity.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold">{opportunity.title}</h4>
                              <p className="text-sm text-slate-600">{opportunity.description}</p>
                            </div>
                            <Badge>{opportunity.status}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span>Valor: R$ {(opportunity.value || 0) / 100}</span>
                            <span>Estágio: {opportunity.stage_id}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-center py-8">
                      Nenhuma movimentação no pipeline para este contato.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}