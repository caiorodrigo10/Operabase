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
  User,
  Clock,
  MessageCircle,
  FileText,
  Activity,
  Heart,
  Users,
  Briefcase,
  Info,
  Edit,
  Star,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SelectContact } from "../../shared/schema";
import { ContactAvatar } from "@/components/ContactAvatar";
import { ContactPipelineHistory } from "@/components/ContactPipelineHistory";

interface Appointment {
  id: number;
  scheduled_date: string;
  status: string;
  doctor_name?: string;
  specialty?: string;
  notes?: string;
}

export function ContatoDetalhes() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const contactId = parseInt(params.id || '0');

  // Mara AI conversation state
  const [maraConversation, setMaraConversation] = useState<Array<{role: 'user' | 'assistant', content: string, timestamp: Date}>>([
    {role: 'assistant', content: 'Olá! Sou a Mara, sua assistente de IA especializada em análise de pacientes. Como posso ajudar você com as informações deste paciente?', timestamp: new Date()}
  ]);
  const [maraMessage, setMaraMessage] = useState('');
  const [isMaraLoading, setIsMaraLoading] = useState(false);

  // Fetch contact data
  const { data: contact, isLoading: contactLoading, error: contactError } = useQuery<SelectContact>({
    queryKey: ['/api/contacts', contactId],
    enabled: !!contactId
  });

  // Fetch appointments for this contact
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments', { contact_id: contactId }],
    enabled: !!contactId
  });

  // Mara AI mutation
  const maraMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await fetch(`/api/contacts/${contactId}/mara/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao conversar com Mara IA');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setMaraConversation(prev => [
        ...prev,
        { role: 'assistant', content: data.response, timestamp: new Date() }
      ]);
      setIsMaraLoading(false);
    },
    onError: (error: Error) => {
      console.error('Erro na conversa com Mara:', error);
      setIsMaraLoading(false);
    }
  });

  const sendMaraMessage = () => {
    if (!maraMessage.trim()) return;
    
    // Add user message to conversation
    const userMessage = { role: 'user' as const, content: maraMessage, timestamp: new Date() };
    setMaraConversation(prev => [...prev, userMessage]);
    
    setIsMaraLoading(true);
    maraMutation.mutate(maraMessage);
    setMaraMessage('');
  };

  if (contactLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (contactError || !contact) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Contato não encontrado</h1>
          <p className="text-slate-600 mb-6">O contato solicitado não foi encontrado ou você não tem permissão para visualizá-lo.</p>
          <Button onClick={() => setLocation('/contatos')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Contatos
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      agendada: { color: 'bg-blue-100 text-blue-800', label: 'Agendada' },
      confirmada: { color: 'bg-green-100 text-green-800', label: 'Confirmada' },
      realizada: { color: 'bg-purple-100 text-purple-800', label: 'Realizada' },
      faltou: { color: 'bg-red-100 text-red-800', label: 'Faltou' },
      cancelada: { color: 'bg-gray-100 text-gray-800', label: 'Cancelada' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { color: 'bg-gray-100 text-gray-800', label: status };
    
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/contatos')}
                className="text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div className="h-6 w-px bg-slate-300"></div>
              <div className="flex items-center gap-3">
                <ContactAvatar 
                  contact={contact} 
                  size="md"
                />
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">{contact.name}</h1>
                  <p className="text-sm text-slate-500">Detalhes do Paciente</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button size="sm" className="bg-medical-blue hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Nova Consulta
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-6">
        <Tabs defaultValue="visao-geral" className="space-y-6">
          {/* Horizontal Tabs */}
          <TabsList className="grid w-full grid-cols-4 bg-white border border-slate-200 rounded-lg p-1">
            <TabsTrigger 
              value="visao-geral" 
              className="data-[state=active]:bg-medical-blue data-[state=active]:text-white"
            >
              <User className="w-4 h-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger 
              value="mara"
              className="data-[state=active]:bg-medical-blue data-[state=active]:text-white"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Mara IA
            </TabsTrigger>
            <TabsTrigger 
              value="arquivos"
              className="data-[state=active]:bg-medical-blue data-[state=active]:text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              Arquivos
            </TabsTrigger>
            <TabsTrigger 
              value="pipeline"
              className="data-[state=active]:bg-medical-blue data-[state=active]:text-white"
            >
              <Activity className="w-4 h-4 mr-2" />
              Pipeline
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="visao-geral" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Contact Info */}
              <div className="lg:col-span-1 space-y-6">
                {/* Basic Information Card */}
                <Card className="border border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Informações Básicas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-slate-500" />
                        <span className="font-medium text-slate-700">Telefone:</span>
                        <span className="text-slate-600">{contact.phone || 'Não informado'}</span>
                      </div>
                      {contact.email && (
                        <div className="flex items-center gap-3 text-sm">
                          <Mail className="w-4 h-4 text-slate-500" />
                          <span className="font-medium text-slate-700">Email:</span>
                          <span className="text-slate-600">{contact.email}</span>
                        </div>
                      )}
                      {contact.address && (
                        <div className="flex items-center gap-3 text-sm">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          <span className="font-medium text-slate-700">Endereço:</span>
                          <span className="text-slate-600">{contact.address}</span>
                        </div>
                      )}
                      {contact.age && (
                        <div className="flex items-center gap-3 text-sm">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span className="font-medium text-slate-700">Idade:</span>
                          <span className="text-slate-600">{contact.age} anos</span>
                        </div>
                      )}
                      {contact.gender && (
                        <div className="flex items-center gap-3 text-sm">
                          <Users className="w-4 h-4 text-slate-500" />
                          <span className="font-medium text-slate-700">Gênero:</span>
                          <span className="text-slate-600">{contact.gender}</span>
                        </div>
                      )}
                      {contact.profession && (
                        <div className="flex items-center gap-3 text-sm">
                          <Briefcase className="w-4 h-4 text-slate-500" />
                          <span className="font-medium text-slate-700">Profissão:</span>
                          <span className="text-slate-600">{contact.profession}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Health Information Card */}
                <Card className="border border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-600" />
                      Informações de Saúde
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {contact.medical_history && (
                      <div className="text-sm">
                        <span className="font-medium text-slate-700">Histórico Médico:</span>
                        <p className="text-slate-600 mt-1">{contact.medical_history}</p>
                      </div>
                    )}
                    {contact.allergies && (
                      <div className="text-sm">
                        <span className="font-medium text-slate-700">Alergias:</span>
                        <p className="text-slate-600 mt-1">{contact.allergies}</p>
                      </div>
                    )}
                    {contact.medications && (
                      <div className="text-sm">
                        <span className="font-medium text-slate-700">Medicações:</span>
                        <p className="text-slate-600 mt-1">{contact.medications}</p>
                      </div>
                    )}
                    {!contact.medical_history && !contact.allergies && !contact.medications && (
                      <p className="text-slate-500 italic">Nenhuma informação de saúde registrada</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Center Column - Appointments */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="border border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-green-600" />
                      Últimas Consultas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {appointments?.length === 0 ? (
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                        <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
                      </div>
                    ) : appointments?.length === 0 ? (
                      <p className="text-slate-500">Nenhuma consulta encontrada</p>
                    ) : (
                      <div className="space-y-4">
                        {appointments.slice(0, 5).map((appointment) => (
                          <div key={appointment.id} className="flex items-start justify-between p-3 border border-slate-100 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getStatusBadge(appointment.status)}
                                <span className="text-xs text-slate-500">
                                  {appointment.scheduled_date && format(new Date(appointment.scheduled_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </span>
                              </div>
                              {appointment.doctor_name && (
                                <p className="text-sm font-medium text-slate-700">{appointment.doctor_name}</p>
                              )}
                              {appointment.specialty && (
                                <p className="text-xs text-slate-500">{appointment.specialty}</p>
                              )}
                              {appointment.notes && (
                                <p className="text-xs text-slate-600 mt-1">{appointment.notes}</p>
                              )}
                            </div>
                          </div>
                        ))}
                        {appointments.length > 5 && (
                          <Button variant="outline" size="sm" className="w-full">
                            Ver todas as consultas ({appointments.length})
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Additional Info */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="border border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Info className="w-5 h-5 text-blue-600" />
                      Informações Gerais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <span className="font-medium text-slate-700">Criado em:</span>
                      <p className="text-slate-600">
                        {contact.first_contact ? 
                          format(new Date(contact.first_contact), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) :
                          'Data não disponível'
                        }
                      </p>
                    </div>
                    {contact.last_interaction && (
                      <div className="text-sm">
                        <span className="font-medium text-slate-700">Última interação:</span>
                        <p className="text-slate-600">
                          {format(new Date(contact.last_interaction), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    )}
                    {contact.source && (
                      <div className="text-sm">
                        <span className="font-medium text-slate-700">Origem:</span>
                        <p className="text-slate-600">{contact.source}</p>
                      </div>
                    )}
                    {contact.observations && (
                      <div className="text-sm">
                        <span className="font-medium text-slate-700">Observações:</span>
                        <p className="text-slate-600">{contact.observations}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="w-5 h-5 text-orange-600" />
                      Pipeline de Vendas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ContactPipelineHistory contactId={contact.id} contactName={contact.name} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Mara IA Tab */}
          <TabsContent value="mara" className="mt-0">
            <div className="p-6">
              <Card className="border border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                    Conversa com Mara IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Chat Area */}
                  <div className="h-96 border rounded-lg p-4 overflow-y-auto bg-slate-50 space-y-4">
                    {maraConversation.map((message, index) => (
                      <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.role === 'user' 
                            ? 'bg-medical-blue text-white' 
                            : 'bg-white border border-slate-200 text-slate-800'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {format(message.timestamp, "HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isMaraLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 text-slate-800 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                            <span className="text-xs text-slate-500">Mara está pensando...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Input Area */}
                  <div className="space-y-2">
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
            </div>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="arquivos" className="mt-0">
            <div className="p-6">
              <Card className="border border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-600" />
                    Arquivos e Documentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500">Funcionalidade de arquivos será implementada em breve.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pipeline Tab */}
          <TabsContent value="pipeline" className="mt-0">
            <div className="p-6">
              <Card className="border border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-orange-600" />
                    Histórico do Pipeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ContactPipelineHistory contactId={contact.id} contactName={contact.name} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}