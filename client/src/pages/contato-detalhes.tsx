import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { ContactAvatar } from "@/components/ContactAvatar";
import EvolucaoEditor from "@/components/EvolucaoEditor";
import { ContactPipelineHistory } from "@/components/ContactPipelineHistory";
import ProntuarioMedico from "@/components/ProntuarioMedico";
import { AppointmentEditor } from "@/components/AppointmentEditor";

interface Contact {
  id: number;
  clinic_id: number;
  name: string;
  phone: string;
  email?: string;
  age?: number;
  gender?: string;
  profession?: string;
  address?: string;
  emergency_contact?: string;
  medical_history?: string;
  current_medications?: string[];
  allergies?: string[];
  profile_picture?: string;
  status: string;
  priority?: string;
  source?: string;
  notes?: string;
  first_contact?: Date;
  last_interaction?: Date;
  observations?: string;
  medications?: string;
}

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
  const queryClient = useQueryClient();

  // Mara AI conversation state
  const [maraConversation, setMaraConversation] = useState<Array<{role: 'user' | 'assistant', content: string, timestamp: Date}>>([
    {role: 'assistant', content: 'Olá! Sou a Mara, sua assistente de IA especializada em análise de pacientes. Como posso ajudar você com as informações deste paciente?', timestamp: new Date()}
  ]);
  const [maraMessage, setMaraMessage] = useState('');
  const [isMaraLoading, setIsMaraLoading] = useState(false);
  const [showEvolucaoEditor, setShowEvolucaoEditor] = useState(false);
  const [showAppointmentEditor, setShowAppointmentEditor] = useState(false);
  const [isTabsSticky, setIsTabsSticky] = useState(false);
  const [activeTab, setActiveTab] = useState('visao-geral');
  const tabsRef = useRef<HTMLDivElement>(null);
  const stickyTabsRef = useRef<HTMLDivElement>(null);

  // Fetch contact data
  const { data: contact, isLoading: contactLoading, error: contactError } = useQuery<Contact>({
    queryKey: ['/api/contacts', contactId],
    queryFn: async () => {
      const response = await fetch(`/api/contacts/${contactId}?clinic_id=1`);
      if (!response.ok) {
        throw new Error('Contact not found');
      }
      return response.json();
    },
    enabled: !!contactId
  });

  // Fetch appointments for this contact
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments', { contact_id: contactId }],
    queryFn: async () => {
      const response = await fetch(`/api/appointments?contact_id=${contactId}&clinic_id=1`);
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
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

  // Sticky tabs scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (tabsRef.current) {
        const tabsRect = tabsRef.current.getBoundingClientRect();
        const shouldBeSticky = tabsRect.top <= 0;
        setIsTabsSticky(shouldBeSticky);
      }
    };

    // Initial check
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
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
      {/* Header with Patient Info */}
      <div className="bg-white border-b border-slate-200">
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
                  name={contact?.name || 'Usuário'}
                  profilePicture={contact?.profile_picture}
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
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Clean design matching reference */}
      <div ref={tabsRef} className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8 overflow-x-auto">
            <button
              className={`py-4 px-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'visao-geral'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => handleTabChange('visao-geral')}
            >
              Visão Geral
            </button>
            <button
              className={`py-4 px-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'anamneses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => handleTabChange('anamneses')}
            >
              Anamneses
            </button>
            <button
              className={`py-4 px-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'orcamentos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => handleTabChange('orcamentos')}
            >
              Orçamentos
            </button>
            <button
              className={`py-4 px-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'tratamentos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => handleTabChange('tratamentos')}
            >
              Tratamentos
            </button>
            <button
              className={`py-4 px-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'pagamentos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => handleTabChange('pagamentos')}
            >
              Pagamentos
            </button>
            <button
              className={`py-4 px-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'evolucoes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => handleTabChange('evolucoes')}
            >
              Evoluções
            </button>
            <button
              className={`py-4 px-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'documentos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => handleTabChange('documentos')}
            >
              Documentos
            </button>
            <button
              className={`py-4 px-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'arquivos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => handleTabChange('arquivos')}
            >
              Arquivos
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
<div className={`container mx-auto px-6 py-6 ${isTabsSticky ? 'pt-16' : ''}`}>
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'visao-geral' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Patient Information (narrower) */}
              <div className="lg:col-span-1 space-y-6">
                {/* Patient Info Section */}
                <Card className="bg-white border border-slate-200">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Informações</h2>
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm font-medium text-slate-700">Código do paciente</span>
                        <p className="text-slate-600">{contact.id}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-slate-700">Preferência de lembretes</span>
                        <p className="text-slate-600">{contact.source || 'WhatsApp'}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-slate-700">Celular</span>
                        <p className="text-slate-600">{contact.phone || 'Não informado'}</p>
                      </div>
                      
                      {contact.gender && (
                        <div>
                          <span className="text-sm font-medium text-slate-700">Gênero</span>
                          <p className="text-slate-600">{contact.gender}</p>
                        </div>
                      )}
                      
                      {contact.profession && (
                        <div>
                          <span className="text-sm font-medium text-slate-700">Convênio</span>
                          <p className="text-slate-600">{contact.profession}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Health Information */}
                {(contact.medical_history || contact.allergies || contact.medications) && (
                  <Card className="border border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-base font-medium">Informações de Saúde</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {contact.medical_history && (
                        <div>
                          <span className="text-sm font-medium text-slate-700">Histórico Médico</span>
                          <p className="text-sm text-slate-600 mt-1">{contact.medical_history}</p>
                        </div>
                      )}
                      {contact.allergies && (
                        <div>
                          <span className="text-sm font-medium text-slate-700">Alergias</span>
                          <p className="text-sm text-slate-600 mt-1">{contact.allergies}</p>
                        </div>
                      )}
                      {contact.medications && (
                        <div>
                          <span className="text-sm font-medium text-slate-700">Medicações</span>
                          <p className="text-sm text-slate-600 mt-1">{contact.medications}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Additional Services */}
                <Card className="border border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-base font-medium flex items-center justify-between">
                      Consulta no Serasa
                      <Button variant="outline" size="sm">
                        Consultar
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <div className="text-blue-600 text-2xl font-bold">$</div>
                        </div>
                        <p className="text-sm text-slate-500 mb-2">
                          Consulte o score e pendências que constam no CPF do seu paciente
                        </p>
                        <Button variant="link" className="text-blue-600 p-0 h-auto text-sm">
                          Comprar créditos
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Satisfaction Survey */}
                <Card className="border border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-base font-medium flex items-center justify-between">
                      Pesquisa de satisfação
                      <Button variant="outline" size="sm">
                        Ativar
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <div className="text-yellow-600 text-2xl">💡</div>
                        </div>
                        <p className="text-sm text-slate-500">
                          Configure a pesquisa de satisfação para este paciente
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Appointments and Messages (wider) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Latest Evolutions */}
                <Card className="bg-white border border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-slate-900">Últimas Evoluções</h2>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleTabChange('evolucoes')}
                        >
                          Ver todas
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowEvolucaoEditor(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Nova Evolução
                        </Button>
                      </div>
                    </div>
                    
                    {appointments?.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Edit className="w-8 h-8 text-blue-500" />
                        </div>
                        <p className="text-slate-500 mb-2">
                          Nenhuma evolução registrada ainda
                        </p>
                        <p className="text-slate-400 text-sm mb-3">
                          Registre a primeira evolução deste paciente
                        </p>
                        <Button 
                          size="sm" 
                          className="bg-medical-blue hover:bg-blue-700"
                          onClick={() => setShowEvolucaoEditor(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Criar primeira evolução
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {appointments.slice(0, 3).map((appointment) => (
                          <div key={appointment.id} className="p-3 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-medical-blue rounded-full"></div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-900">
                                      {appointment.scheduled_date && format(new Date(appointment.scheduled_date), "dd/MM/yyyy", { locale: ptBR })}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      {appointment.scheduled_date && format(new Date(appointment.scheduled_date), "HH:mm", { locale: ptBR })}
                                    </span>
                                  </div>
                                  {appointment.doctor_name && (
                                    <p className="text-xs text-slate-600 mt-1">{appointment.doctor_name}</p>
                                  )}
                                </div>
                              </div>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                            {appointment.notes && (
                              <div className="mt-2 ml-5">
                                <p className="text-xs text-slate-600 line-clamp-2">
                                  {appointment.notes.length > 80 ? 
                                    appointment.notes.substring(0, 80) + '...' : 
                                    appointment.notes
                                  }
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                        {appointments.length > 3 && (
                          <div className="text-center pt-2">
                            <Button 
                              variant="link" 
                              size="sm"
                              className="text-medical-blue"
                              onClick={() => handleTabChange('evolucoes')}
                            >
                              Ver todas as {appointments.length} evoluções
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Appointment History */}
                <Card className="bg-white border border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-slate-900">Histórico de consultas</h2>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowAppointmentEditor(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {appointments
                        .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
                        .slice(0, 4)
                        .map((appointment) => (
                        <div key={appointment.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-900">
                              {appointment.scheduled_date && format(new Date(appointment.scheduled_date), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                            <span className="text-sm text-slate-500">
                              {appointment.scheduled_date && format(new Date(appointment.scheduled_date), "HH:mm", { locale: ptBR })}
                            </span>
                            <span className="text-sm text-slate-600">{appointment.doctor_name}</span>
                            {getStatusBadge(appointment.status)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Info className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {appointments.length > 4 && (
                        <div className="pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleTabChange('evolucoes')}
                          >
                            Ver mais ({appointments.length - 4} consultas)
                          </Button>
                        </div>
                      )}
                      
                      {appointments.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-slate-500 text-sm">Nenhuma consulta registrada ainda</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Messages Section */}
                <Card className="bg-white border border-slate-200">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Mensagens</h2>
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-8 h-8 text-blue-500" />
                      </div>
                      <p className="text-slate-500 mb-2">
                        Nenhuma mensagem foi trocada com esse paciente ainda
                      </p>
                      <p className="text-slate-400 text-sm mb-4">
                        Só é possível enviar mensagens a pacientes que entraram em contato nas últimas 24 horas
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Anamneses Tab */}
          {activeTab === 'anamneses' && (
            <div className="p-6">
              <Card className="border border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Anamneses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500">Funcionalidade de anamneses será implementada em breve.</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Orçamentos Tab */}
          {activeTab === 'orcamentos' && (
            <div className="p-6">
              <Card className="border border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Orçamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500">Funcionalidade de orçamentos será implementada em breve.</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tratamentos Tab */}
          {activeTab === 'tratamentos' && (
            <div className="p-6">
              <Card className="border border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Tratamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500">Funcionalidade de tratamentos será implementada em breve.</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pagamentos Tab */}
          {activeTab === 'pagamentos' && (
            <div className="p-6">
              <Card className="border border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Pagamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500">Funcionalidade de pagamentos será implementada em breve.</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Evoluções Tab */}
          {activeTab === 'evolucoes' && (
            <div className="p-6">
              <ProntuarioMedico contactId={contactId!} appointments={appointments} />
            </div>
          )}

          {/* Documentos Tab */}
          {activeTab === 'documentos' && (
            <div className="p-6">
              <Card className="border border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Documentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500">Funcionalidade de documentos será implementada em breve.</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Files Tab */}
          {activeTab === 'arquivos' && (
            <div className="p-6">
              <Card className="border border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Arquivos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500">Funcionalidade de arquivos será implementada em breve.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Tabs Overlay */}
      {isTabsSticky && (
        <div className="fixed top-16 left-0 right-0 z-30 bg-white border-b border-slate-200 shadow-sm transition-all duration-200">
          <div className="container mx-auto px-6">
            <div className="flex space-x-8 overflow-x-auto">
              <button
                className={`py-4 px-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === 'visao-geral'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
                onClick={() => handleTabChange('visao-geral')}
              >
                Visão Geral
              </button>
              <button
                className={`py-4 px-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === 'anamneses'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
                onClick={() => handleTabChange('anamneses')}
              >
                Anamneses
              </button>
              <button
                className={`py-4 px-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === 'orcamentos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
                onClick={() => handleTabChange('orcamentos')}
              >
                Orçamentos
              </button>
              <button
                className={`py-4 px-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === 'tratamentos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
                onClick={() => handleTabChange('tratamentos')}
              >
                Tratamentos
              </button>
              <button
                className={`py-4 px-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === 'pagamentos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
                onClick={() => handleTabChange('pagamentos')}
              >
                Pagamentos
              </button>
              <button
                className={`py-4 px-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === 'evolucoes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
                onClick={() => handleTabChange('evolucoes')}
              >
                Evoluções
              </button>
              <button
                className={`py-4 px-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === 'documentos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
                onClick={() => handleTabChange('documentos')}
              >
                Documentos
              </button>
              <button
                className={`py-4 px-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === 'arquivos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
                onClick={() => handleTabChange('arquivos')}
              >
                Arquivos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor de Evolução */}
      {showEvolucaoEditor && (
        <EvolucaoEditor
          contactId={contactId!.toString()}
          contactName={contact?.name || 'Paciente'}
          appointments={appointments}
          onClose={() => setShowEvolucaoEditor(false)}
        />
      )}

      {/* Editor de Agendamento */}
      <AppointmentEditor
        isOpen={showAppointmentEditor}
        onClose={() => setShowAppointmentEditor(false)}
        preselectedContact={contact}
        onSave={() => {
          // Refresh appointments data after saving
          queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
          setShowAppointmentEditor(false);
        }}
      />
    </div>
  );
}
