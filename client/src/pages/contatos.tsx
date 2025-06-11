import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContactSchema } from "@/../../shared/schema";
import { mockAppointments, mockMessages } from "@/lib/mock-data";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Phone, 
  MessageCircle, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  Activity,
  Heart,
  Brain,
  Edit3,
  Save,
  Plus,
  UserPlus
} from "lucide-react";
import type { Contact, InsertContact } from "@/../../shared/schema";

const statusLabels = {
  novo: { label: "Novo", color: "bg-slate-100 text-slate-800" },
  em_conversa: { label: "Em conversa", color: "bg-blue-100 text-blue-800" },
  agendado: { label: "Agendado", color: "bg-green-100 text-green-800" },
  realizado: { label: "Realizado", color: "bg-purple-100 text-purple-800" },
  pos_atendimento: { label: "Pós-atendimento", color: "bg-emerald-100 text-emerald-800" },
};

export function Contatos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch contacts from API
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['/api/contacts', { clinic_id: 1 }],
    queryFn: async () => {
      const response = await fetch('/api/contacts?clinic_id=1');
      if (!response.ok) throw new Error('Erro ao carregar contatos');
      return response.json();
    }
  });

  // Form for adding new contact
  const form = useForm<InsertContact>({
    resolver: zodResolver(insertContactSchema.extend({
      age: insertContactSchema.shape.age.optional(),
      profession: insertContactSchema.shape.profession.optional()
    })),
    defaultValues: {
      clinic_id: 1,
      name: "",
      phone: "",
      email: "",
      age: undefined,
      profession: "",
      status: "novo",
      priority: "normal",
      source: "whatsapp"
    }
  });

  // Mutation for creating contact
  const createContactMutation = useMutation({
    mutationFn: async (contactData: InsertContact) => {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      });
      if (!response.ok) throw new Error('Erro ao criar contato');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      setIsAddContactOpen(false);
      form.reset();
      toast({
        title: "Contato adicionado",
        description: "O novo contato foi criado com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar contato",
        description: "Não foi possível criar o contato. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const filteredContacts = contacts.filter((contact: Contact) => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || contact.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const onSubmitContact = (data: InsertContact) => {
    createContactMutation.mutate(data);
  };

  const handleContactClick = (contact: Contact) => {
    setLocation(`/contatos/${contact.id}`);
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
    <div className="p-4 lg:p-6">
      <Card>
        <CardHeader className="border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Contatos</h2>
              <p className="text-slate-600">Gerencie todos os contatos da clínica</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => setIsAddContactOpen(true)}
                className="bg-medical-blue hover:bg-blue-700 flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Adicionar Contato
              </Button>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="agendado">Agendou</SelectItem>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="pos_atendimento">Pós-atendimento</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Buscar contato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Primeiro Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status Atual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredContacts.map((contact: Contact) => {
                  const status = statusLabels[contact.status as keyof typeof statusLabels];
                  const initials = contact.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
                  const timeAgo = formatDistanceToNow(contact.first_contact!, { 
                    addSuffix: true, 
                    locale: ptBR 
                  });

                  return (
                    <tr key={contact.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">{initials}</span>
                          </div>
                          <div className="ml-3">
                            <button 
                              onClick={() => handleContactClick(contact)}
                              className="text-sm font-medium text-medical-blue hover:text-blue-700 hover:underline cursor-pointer"
                            >
                              {contact.name}
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {contact.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {timeAgo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button variant="link" className="text-medical-blue hover:text-blue-700 p-0">
                          Ver conversa
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">
                Mostrando 1-{filteredContacts.length} de {contacts.length} contatos
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" disabled>
                  Anterior
                </Button>
                <Button size="sm">
                  1
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Próximo
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Details Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-medical-blue" />
              Perfil do Paciente
            </DialogTitle>
            <DialogDescription>
              Informações completas e visão geral do paciente
            </DialogDescription>
          </DialogHeader>
          
          {selectedContact && (
            <div className="space-y-6">
              {/* Patient Basic Info */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Informações Básicas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Nome Completo</p>
                    <p className="font-medium">{selectedContact.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Telefone</p>
                    <p className="font-medium flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {selectedContact.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Status Atual</p>
                    <Badge className={statusLabels[selectedContact.status as keyof typeof statusLabels].color}>
                      {statusLabels[selectedContact.status as keyof typeof statusLabels].label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Primeiro Contato</p>
                    <p className="font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {selectedContact.first_contact ? format(selectedContact.first_contact, "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Última Interação</p>
                    <p className="font-medium flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {selectedContact.last_interaction ? formatDistanceToNow(selectedContact.last_interaction, { addSuffix: true, locale: ptBR }) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">WhatsApp</p>
                    <p className="font-medium flex items-center gap-1">
                      <MessageCircle className="w-3 h-3 text-green-600" />
                      Ativo
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Overview Section */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-medical-blue" />
                    Visão Geral da IA Livia
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingOverview(!isEditingOverview)}
                    className="flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    {isEditingOverview ? 'Cancelar' : 'Editar'}
                  </Button>
                </div>
                
                {isEditingOverview ? (
                  <div className="space-y-3">
                    <Textarea
                      value={overviewText}
                      onChange={(e) => setOverviewText(e.target.value)}
                      placeholder="Digite a visão geral do paciente..."
                      className="min-h-24"
                    />
                    <Button onClick={handleSaveOverview} className="bg-medical-blue hover:bg-blue-700">
                      <Save className="w-3 h-3 mr-1" />
                      Salvar Visão Geral
                    </Button>
                  </div>
                ) : (
                  <div className="text-slate-700 leading-relaxed">
                    {overviewText || 'Nenhuma visão geral disponível. Clique em "Editar" para adicionar informações.'}
                  </div>
                )}
              </div>

              {/* Appointments History */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Histórico de Consultas
                </h3>
                {(() => {
                  const appointments = getContactAppointments(selectedContact.id);
                  return appointments.length > 0 ? (
                    <div className="space-y-2">
                      {appointments.slice(0, 3).map((appointment) => (
                        <div key={appointment.id} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div>
                            <p className="font-medium text-sm">{appointment.specialty}</p>
                            <p className="text-xs text-slate-600">Dr. {appointment.doctor_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">{appointment.scheduled_date ? format(new Date(appointment.scheduled_date), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}</p>
                            <Badge className={statusLabels[appointment.status as keyof typeof statusLabels]?.color || 'bg-gray-100 text-gray-800'}>
                              {statusLabels[appointment.status as keyof typeof statusLabels]?.label || appointment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {appointments.length > 3 && (
                        <p className="text-sm text-slate-500 text-center">
                          +{appointments.length - 3} consultas anteriores
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">Nenhuma consulta registrada</p>
                  );
                })()}
              </div>

              {/* Recent Activity */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Atividade Recente
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-slate-600">Última mensagem WhatsApp: há 2 horas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-slate-600">Interação com IA Livia: há 3 horas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-slate-600">Status atualizado para: {statusLabels[selectedContact.status as keyof typeof statusLabels].label}</span>
                  </div>
                </div>
              </div>

              {/* Health Indicators */}
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Indicadores de Saúde Mental
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded border">
                    <p className="text-sm font-medium text-slate-700">Urgência</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Média</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <p className="text-sm font-medium text-slate-700">Engajamento</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Alto</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <p className="text-sm font-medium text-slate-700">Risco</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Baixo</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <p className="text-sm font-medium text-slate-700">Adesão</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Boa</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Fechar
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Abrir WhatsApp
                </Button>
                <Button className="bg-medical-blue hover:bg-blue-700">
                  <Calendar className="w-3 h-3 mr-1" />
                  Agendar Consulta
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Contact Modal */}
      <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-medical-blue" />
              Adicionar Novo Contato
            </DialogTitle>
            <DialogDescription>
              Preencha as informações básicas do novo contato
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitContact)} className="space-y-6">
              {/* Basic Information */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Informações Básicas
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone *</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Idade</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Ex: 35" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="profession"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profissão</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Engenheiro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gênero</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o gênero" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="feminino">Feminino</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                            <SelectItem value="nao_informado">Não informar</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Contact Details */}
              <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Configurações do Contato
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status Inicial</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="novo">Novo</SelectItem>
                            <SelectItem value="em_conversa">Em conversa</SelectItem>
                            <SelectItem value="agendado">Agendado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridade</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a prioridade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="baixa">Baixa</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="urgente">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origem do Contato</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Como chegou até nós?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            <SelectItem value="telefone">Telefone</SelectItem>
                            <SelectItem value="indicacao">Indicação</SelectItem>
                            <SelectItem value="site">Site</SelectItem>
                            <SelectItem value="redes_sociais">Redes Sociais</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-green-50 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Informações Adicionais
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input placeholder="Endereço completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="emergency_contact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contato de Emergência</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome e telefone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Adicione observações importantes sobre o contato..."
                          className="min-h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddContactOpen(false)}
                  disabled={createContactMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-medical-blue hover:bg-blue-700"
                  disabled={createContactMutation.isPending}
                >
                  {createContactMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Contato
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
