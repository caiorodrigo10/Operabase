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
import { ContactPipelineHistory } from "@/components/ContactPipelineHistory";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ProntuarioMedico from "@/components/ProntuarioMedico";
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

  const [isMaraLoading, setIsMaraLoading] = useState(false);
  const [maraError, setMaraError] = useState<string>("");

  const sendMaraMessage = async () => {
    if (!maraMessage.trim() || isMaraLoading) return;
    
    const userMessage = {
      role: 'user' as const,
      content: maraMessage,
      timestamp: new Date()
    };
    
    setMaraConversation(prev => [...prev, userMessage]);
    setMaraMessage("");
    setIsMaraLoading(true);
    setMaraError("");
    
    try {
      const response = await fetch(`/api/contacts/${contactId}/mara/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: userMessage.content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao processar pergunta');
      }

      const data = await response.json();
      
      const aiResponse = {
        role: 'assistant' as const,
        content: data.response,
        timestamp: new Date()
      };
      
      setMaraConversation(prev => [...prev, aiResponse]);
      
    } catch (error: any) {
      console.error('Erro na Mara AI:', error);
      setMaraError(error.message);
      
      const errorResponse = {
        role: 'assistant' as const,
        content: `Desculpe, ocorreu um erro: ${error.message}. Tente novamente.`,
        timestamp: new Date()
      };
      
      setMaraConversation(prev => [...prev, errorResponse]);
    } finally {
      setIsMaraLoading(false);
    }
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
              <ProntuarioMedico 
                contactId={contact.id} 
                appointments={appointments}
              />
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
                <CardContent className="space-y-4">


                  {/* Área de conversa */}
                  <div className="h-96 border rounded-lg p-4 overflow-y-auto bg-slate-50 space-y-4">
                    {maraConversation.map((message, index) => (
                      <div key={index} className={`${message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}>
                        <div className={`max-w-[85%] ${
                          message.role === 'user' 
                            ? 'bg-medical-blue text-white' 
                            : 'bg-white border border-slate-200'
                        } rounded-lg p-3 shadow-sm`}>
                          {/* Avatar da Mara */}
                          {message.role === 'assistant' && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                M
                              </div>
                              <span className="text-xs font-medium text-slate-600">Mara AI</span>
                              {message.confidence && (
                                <span className="text-xs text-slate-500">
                                  • {Math.round(message.confidence * 100)}% confiança
                                </span>
                              )}
                            </div>
                          )}
                          
                          <p className={`text-sm ${message.role === 'user' ? 'text-white' : 'text-slate-800'}`}>
                            {message.content}
                          </p>
                          
                          {/* Recomendações */}
                          {message.recommendations && message.recommendations.length > 0 && (
                            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                              <p className="text-xs font-medium text-green-800 mb-1 flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                Recomendações:
                              </p>
                              <ul className="text-xs text-green-700 space-y-1">
                                {message.recommendations.map((rec, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <span className="text-green-500 mt-0.5">•</span>
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Pontos de atenção */}
                          {message.attention_points && message.attention_points.length > 0 && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                              <p className="text-xs font-medium text-yellow-800 mb-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Pontos de atenção:
                              </p>
                              <ul className="text-xs text-yellow-700 space-y-1">
                                {message.attention_points.map((point, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <span className="text-yellow-500 mt-0.5">•</span>
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Fontes */}
                          {message.sources && message.sources.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-200">
                              <p className="text-xs text-slate-500">
                                <FileText className="w-3 h-3 inline mr-1" />
                                Fontes: {message.sources.join(", ")}
                              </p>
                            </div>
                          )}
                          
                          <p className={`text-xs mt-2 ${
                            message.role === 'user' ? 'text-blue-100' : 'text-slate-400'
                          }`}>
                            {format(message.timestamp, "HH:mm")}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Indicador de carregamento */}
                    {isMaraLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              M
                            </div>
                            <span className="text-xs font-medium text-slate-600">Mara AI está pensando...</span>
                          </div>
                          <div className="flex items-center space-x-1 mt-2">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Área de input */}
                  <div className="space-y-2">
                    {maraError && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                        {maraError}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        value={maraMessage}
                        onChange={(e) => setMaraMessage(e.target.value)}
                        placeholder="Pergunte algo sobre o paciente..."
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMaraMessage()}
                        disabled={isMaraLoading}
                        className="flex-1"
                      />
                      <Button 
                        onClick={sendMaraMessage}
                        disabled={isMaraLoading || !maraMessage.trim()}
                        className="bg-medical-blue hover:bg-blue-700"
                      >
                        {isMaraLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          "Enviar"
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">
                      A Mara pode analisar prontuários, histórico de consultas e dados do paciente. 
                      Pressione Enter para enviar ou Shift+Enter para quebrar linha.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pipeline" className="space-y-4">
              <ContactPipelineHistory contactId={contact.id} contactName={contact.name} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}