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
  AlertTriangle,
  Plus,
  Search,
  Eye,
  EyeOff,
  Info
} from "lucide-react";
import { ContactPipelineHistory } from "@/components/ContactPipelineHistory";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ProntuarioMedico from "@/components/ProntuarioMedico";
import type { Contact } from "../../../server/domains/contacts/contacts.schema";
import type { Appointment } from "../../../server/domains/appointments/appointments.schema";
import type { PipelineOpportunity, PipelineActivity } from "../../../shared/schema";

const statusLabels = {
  novo: { label: "Novo", color: "bg-blue-100 text-blue-800" },
  em_conversa: { label: "Em Conversa", color: "bg-yellow-100 text-yellow-800" },
  agendado: { label: "Agendado", color: "bg-green-100 text-green-800" },
  pos_atendimento: { label: "Pós Atendimento", color: "bg-purple-100 text-purple-800" },
  perdido: { label: "Perdido", color: "bg-red-100 text-red-800" },
  ativo: { label: "Ativo", color: "bg-green-100 text-green-800" },
  inativo: { label: "Inativo", color: "bg-slate-100 text-slate-800" },
  arquivado: { label: "Arquivado", color: "bg-gray-100 text-gray-800" },
  realizado: { label: "Realizado", color: "bg-purple-100 text-purple-800" },
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

  const statusInfo = statusLabels[contact.status as keyof typeof statusLabels] || 
                   { label: "Ativo", color: "bg-green-100 text-green-800" };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Modern Header - Codental Style */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src="" alt={contact.name} />
              <AvatarFallback className="text-xl font-medium bg-blue-100 text-blue-700">
                {contact.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{contact.name}</h1>
              <p className="text-slate-600 flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {contact.phone}
              </p>
            </div>
          </div>
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
            className="px-6"
          >
            {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
            {isEditing ? "Salvar" : "Editar"}
          </Button>
        </div>
      </div>

      {/* Horizontal Tabs - Codental Style */}
      <Tabs defaultValue="visao-geral" className="w-full">
        <TabsList className="border-b border-slate-200 w-full bg-transparent h-auto p-0 rounded-none justify-start">
          <TabsTrigger 
            value="visao-geral" 
            className="border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-6 py-3"
          >
            Visão Geral
          </TabsTrigger>
          <TabsTrigger 
            value="anamneses" 
            className="border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-6 py-3"
          >
            Anamneses
          </TabsTrigger>
          <TabsTrigger 
            value="prontuario" 
            className="border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-6 py-3"
          >
            Evoluções
          </TabsTrigger>
          <TabsTrigger 
            value="consultas" 
            className="border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-6 py-3"
          >
            Consultas
          </TabsTrigger>
          <TabsTrigger 
            value="mara" 
            className="border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-6 py-3"
          >
            Mara IA
          </TabsTrigger>
          <TabsTrigger 
            value="pipeline" 
            className="border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-6 py-3"
          >
            Pipeline
          </TabsTrigger>
          <TabsTrigger 
            value="documentos" 
            className="border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-6 py-3"
          >
            Documentos
          </TabsTrigger>
          <TabsTrigger 
            value="arquivos" 
            className="border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-6 py-3"
          >
            Arquivos
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral Tab - Three Column Layout */}
        <TabsContent value="visao-geral" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
            
            {/* Left Column - Patient Info */}
            <div className="lg:col-span-3 space-y-4">
              <Card className="border border-slate-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Nome</label>
                        <Input
                          value={editData.name}
                          onChange={(e) => setEditData({...editData, name: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Telefone</label>
                        <Input
                          value={editData.phone}
                          onChange={(e) => setEditData({...editData, phone: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Email</label>
                        <Input
                          value={editData.email || ""}
                          onChange={(e) => setEditData({...editData, email: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-slate-500" />
                        <span className="text-sm">{contact.phone}</span>
                      </div>
                      {contact.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-slate-500" />
                          <span className="text-sm">{contact.email}</span>
                        </div>
                      )}
                      {contact.address && (
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          <span className="text-sm">{contact.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="text-sm">{contact.age} anos</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-slate-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={`${statusInfo.color} text-sm px-3 py-1`}>
                    {statusInfo.label}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Center Column - Main Content */}
            <div className="lg:col-span-6 space-y-4">
              <Card className="border border-slate-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    Últimas Consultas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {appointmentsLoading ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
                    </div>
                  ) : appointments && appointments.length > 0 ? (
                    <div className="space-y-3">
                      {appointments.slice(0, 3).map((appointment: any) => (
                        <div key={appointment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{appointment.doctor_name || 'Não informado'}</p>
                            <p className="text-xs text-slate-600">{appointment.specialty || 'Especialidade não informada'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {appointment.scheduled_date ? 
                                format(new Date(appointment.scheduled_date), "dd/MM/yyyy", { locale: ptBR }) :
                                'Data não informada'
                              }
                            </p>
                            <Badge className="text-xs">
                              {appointment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        Ver todas as consultas
                      </Button>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">Nenhuma consulta encontrada</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-slate-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-red-600" />
                    Resumo Médico
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Observações Gerais</label>
                      <p className="text-sm text-slate-600 mt-1">
                        {contact.notes || "Nenhuma observação registrada"}
                      </p>
                    </div>
                    {contact.profession && (
                      <div>
                        <label className="text-sm font-medium text-slate-700">Profissão</label>
                        <p className="text-sm text-slate-600 mt-1">{contact.profession}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Quick Actions */}
            <div className="lg:col-span-3 space-y-4">
              <Card className="border border-slate-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                    Ações Rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Consulta
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Enviar WhatsApp
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Gerar Relatório
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-slate-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="w-5 h-5 text-purple-600" />
                    Informações Extras
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <span className="font-medium text-slate-700">Criado em:</span>
                    <p className="text-slate-600">
                      {contact.created_at ? 
                        format(new Date(contact.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) :
                        'Data não disponível'
                      }
                    </p>
                  </div>
                  {contact.updated_at && (
                    <div className="text-sm">
                      <span className="font-medium text-slate-700">Última atualização:</span>
                      <p className="text-slate-600">
                        {format(new Date(contact.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Anamneses Tab */}
        <TabsContent value="anamneses" className="mt-0">
          <div className="p-6">
            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Anamneses do Paciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-500">Funcionalidade de anamneses será implementada em breve.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Prontuário Tab */}
        <TabsContent value="prontuario" className="mt-0">
          <div className="p-6">
            <ProntuarioMedico 
              contactId={contact.id} 
              appointments={appointments}
            />
          </div>
        </TabsContent>

        {/* Consultas Tab */}
        <TabsContent value="consultas" className="mt-0">
          <div className="p-6">
            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-green-600" />
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
                    <div key={index} className={`${message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}>
                      <div className={`max-w-[85%] ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white border border-slate-200'
                      } rounded-lg p-3 shadow-sm`}>
                        {message.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              M
                            </div>
                            <span className="text-xs font-medium text-slate-600">Mara AI</span>
                          </div>
                        )}
                        <p className={`text-sm ${message.role === 'user' ? 'text-white' : 'text-slate-800'}`}>
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite sua pergunta sobre o paciente..."
                    value={maraMessage}
                    onChange={(e) => setMaraMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMaraMessage()}
                    disabled={isMaraLoading}
                  />
                  <Button 
                    onClick={sendMaraMessage}
                    disabled={isMaraLoading || !maraMessage.trim()}
                  >
                    {isMaraLoading ? 'Enviando...' : 'Enviar'}
                  </Button>
                </div>
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
                  Pipeline de Vendas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ContactPipelineHistory contactId={contact.id} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documentos Tab */}
        <TabsContent value="documentos" className="mt-0">
          <div className="p-6">
            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Documentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-500">Funcionalidade de documentos será implementada em breve.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Arquivos Tab */}
        <TabsContent value="arquivos" className="mt-0">
          <div className="p-6">
            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-pink-600" />
                  Arquivos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-500">Funcionalidade de arquivos será implementada em breve.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
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