import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar, List, Clock, User, Stethoscope, CalendarDays, ChevronLeft, ChevronRight, Phone, MessageCircle, MapPin, Plus, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { mockAppointments, mockContacts } from "@/lib/mock-data";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Appointment, Contact } from "@/../../shared/schema";

const statusLabels = {
  scheduled: { label: "Agendado", color: "bg-green-100 text-green-800" },
  completed: { label: "Realizado", color: "bg-blue-100 text-blue-800" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmado", color: "bg-green-100 text-green-800" },
  agendado: { label: "Agendado", color: "bg-green-100 text-green-800" },
  realizado: { label: "Realizado", color: "bg-blue-100 text-blue-800" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800" },
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
};

const appointmentSchema = z.object({
  appointment_name: z.string().min(1, "Nome do compromisso é obrigatório"),
  contact_id: z.string().min(1, "Selecione um paciente"),
  user_id: z.string().min(1, "Selecione o usuário responsável"),
  scheduled_date: z.string().min(1, "Data é obrigatória"),
  scheduled_time: z.string().min(1, "Horário é obrigatório"),
  duration: z.string().min(1, "Duração é obrigatória"),
  type: z.string().min(1, "Tipo de consulta é obrigatório"),
  notes: z.string().optional(),
  contact_whatsapp: z.string().optional(),
  contact_email: z.string().optional(),
});

type AppointmentForm = z.infer<typeof appointmentSchema>;

export function Consultas() {
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [contactComboboxOpen, setContactComboboxOpen] = useState(false);
  const { toast } = useToast();

  // Buscar contatos reais da base de dados (usando clinic_id = 1 como padrão)
  const { data: contacts = [], isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts", { clinic_id: 1 }],
    queryFn: async () => {
      const response = await fetch(`/api/contacts?clinic_id=1`);
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json();
    },
  });

  // Buscar consultas reais da base de dados
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments", { clinic_id: 1 }],
    queryFn: async () => {
      const response = await fetch(`/api/appointments?clinic_id=1`);
      if (!response.ok) throw new Error('Failed to fetch appointments');
      return response.json();
    },
  });

  // Buscar usuários da clínica para seleção obrigatória
  const { data: clinicUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/clinic/1/users"],
    queryFn: async () => {
      const response = await fetch(`/api/clinic/1/users`);
      if (!response.ok) throw new Error('Failed to fetch clinic users');
      return response.json();
    },
  });

  const form = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      appointment_name: "",
      contact_id: "",
      user_id: "",
      scheduled_date: "",
      scheduled_time: "",
      duration: "60",
      type: "consulta",
      notes: "",
      contact_whatsapp: "",
      contact_email: "",
    },
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentForm) => {
      // Atualizar dados do contato se foram modificados
      if (data.contact_whatsapp || data.contact_email) {
        const contactUpdates: any = {};
        if (data.contact_whatsapp) contactUpdates.phone = data.contact_whatsapp;
        if (data.contact_email) contactUpdates.email = data.contact_email;
        
        if (Object.keys(contactUpdates).length > 0) {
          await apiRequest("PUT", `/api/contacts/${data.contact_id}`, contactUpdates);
        }
      }

      const appointmentData = {
        contact_id: parseInt(data.contact_id),
        user_id: parseInt(data.user_id),
        clinic_id: 1,
        doctor_name: data.appointment_name, // Usar o nome do compromisso como nome do doutor
        specialty: data.type,
        appointment_type: data.type,
        scheduled_date: new Date(`${data.scheduled_date}T${data.scheduled_time}`),
        duration_minutes: parseInt(data.duration),
        status: "scheduled",
        payment_status: "pending",
        payment_amount: 0,
        session_notes: data.notes || null,
      };
      const res = await apiRequest("POST", "/api/appointments", appointmentData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments", { clinic_id: 1 }] });
      toast({
        title: "Consulta criada",
        description: "A consulta foi agendada com sucesso.",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar consulta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update loading state based on data loading
  useEffect(() => {
    setIsLoading(contactsLoading || appointmentsLoading || usersLoading);
  }, [contactsLoading, appointmentsLoading, usersLoading]);

  const getPatientName = (contactId: number | null) => {
    if (!contactId) return "Paciente não identificado";
    const contact = contacts.find(c => c.id === contactId);
    return contact ? contact.name : "Paciente não encontrado";
  };

  const getPatientInfo = (contactId: number | null) => {
    if (!contactId) return null;
    return contacts.find(c => c.id === contactId);
  };

  const handleContactSelect = (contactId: string) => {
    form.setValue("contact_id", contactId);
    const contact = contacts.find(c => c.id === parseInt(contactId));
    if (contact) {
      form.setValue("contact_whatsapp", contact.phone || "");
      form.setValue("contact_email", contact.email || "");
    }
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(appointment => 
      appointment.scheduled_date && isSameDay(new Date(appointment.scheduled_date), date)
    );
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-2 animate-pulse"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
        </div>
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
      {/* Header Section */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Consultas</h1>
          <p className="text-slate-600">Gerencie e visualize todas as sessões agendadas</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nova Consulta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Agendar Nova Consulta</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createAppointmentMutation.mutate(data))} className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <div className="flex items-start space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Sincronização com Google Calendar</p>
                    <p className="text-xs text-blue-700 mt-1">
                      É obrigatório selecionar um paciente e um usuário responsável para identificar qual conta Google Calendar receberá este agendamento.
                    </p>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="appointment_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do compromisso *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Consulta com João Silva"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_id">Paciente *</Label>
                  <Popover open={contactComboboxOpen} onOpenChange={setContactComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={contactComboboxOpen}
                        className="w-full justify-between"
                      >
                        {form.watch("contact_id")
                          ? contacts.find((contact) => contact.id.toString() === form.watch("contact_id"))?.name
                          : "Buscar paciente..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Digite o nome do paciente..." />
                        <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                        <CommandGroup>
                          {contacts.map((contact) => (
                            <CommandItem
                              key={contact.id}
                              value={contact.name}
                              onSelect={() => {
                                handleContactSelect(contact.id.toString());
                                setContactComboboxOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  form.watch("contact_id") === contact.id.toString()
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              {contact.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.contact_id && (
                    <p className="text-sm text-red-600">{form.formState.errors.contact_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_id">Usuário Responsável *</Label>
                  <Select
                    value={form.watch("user_id")}
                    onValueChange={(value) => form.setValue("user_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {clinicUsers.map((user: any) => (
                        <SelectItem key={user.user_id} value={user.user_id.toString()}>
                          {user.user?.name || user.user?.email || `Usuário ${user.user_id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.user_id && (
                    <p className="text-sm text-red-600">{form.formState.errors.user_id.message}</p>
                  )}
                </div>
              </div>

              {/* Informações de Contato do Paciente */}
              {form.watch("contact_id") && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">Informações de Contato</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contact_whatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(11) 99999-9999"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contact_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="email@exemplo.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Consulta</Label>
                  <Select
                    value={form.watch("type")}
                    onValueChange={(value) => form.setValue("type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consulta">Consulta</SelectItem>
                      <SelectItem value="retorno">Retorno</SelectItem>
                      <SelectItem value="avaliacao">Avaliação</SelectItem>
                      <SelectItem value="procedimento">Procedimento</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.type && (
                    <p className="text-sm text-red-600">{form.formState.errors.type.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled_date">Data</Label>
                  <Input
                    type="date"
                    {...form.register("scheduled_date")}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {form.formState.errors.scheduled_date && (
                    <p className="text-sm text-red-600">{form.formState.errors.scheduled_date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled_time">Horário</Label>
                  <Input
                    type="time"
                    {...form.register("scheduled_time")}
                  />
                  {form.formState.errors.scheduled_time && (
                    <p className="text-sm text-red-600">{form.formState.errors.scheduled_time.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duração (minutos)</Label>
                <Select
                  value={form.watch("duration")}
                  onValueChange={(value) => form.setValue("duration", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a duração" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1h 30min</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.duration && (
                  <p className="text-sm text-red-600">{form.formState.errors.duration.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  {...form.register("notes")}
                  placeholder="Observações sobre a consulta..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createAppointmentMutation.isPending}
                >
                  {createAppointmentMutation.isPending ? "Agendando..." : "Agendar Consulta"}
                </Button>
              </div>
            </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
            className="flex items-center gap-2"
          >
            <List className="w-4 h-4" />
            Lista
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            onClick={() => setViewMode("calendar")}
            className="flex items-center gap-2"
          >
            <CalendarDays className="w-4 h-4" />
            Calendário
          </Button>
        </div>

        {viewMode === "calendar" && (
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold text-slate-800">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {viewMode === "list" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Próximas Consultas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments
                .sort((a, b) => new Date(a.scheduled_date!).getTime() - new Date(b.scheduled_date!).getTime())
                .map((appointment) => {
                  const patientName = getPatientName(appointment.contact_id);
                  const status = statusLabels[appointment.status as keyof typeof statusLabels] || statusLabels.pending;
                  const appointmentDate = new Date(appointment.scheduled_date!);
                  const isToday = isSameDay(appointmentDate, new Date());
                  const isPast = appointmentDate < new Date();

                  return (
                    <div
                      key={appointment.id}
                      className={`p-4 rounded-lg border transition-colors hover:bg-slate-50 ${
                        isToday ? "border-medical-blue bg-blue-50" : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-10 h-10 bg-medical-blue rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {patientName.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-800">{patientName}</h3>
                              <p className="text-sm text-slate-600">{appointment.specialty}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-slate-600 ml-13">
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>{appointment.doctor_name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{format(appointmentDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {isToday && (
                            <Badge variant="outline" className="text-medical-blue border-medical-blue">
                              Hoje
                            </Badge>
                          )}
                          <Badge className={status.color}>
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Calendário de Consultas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                <div key={day} className="p-2 text-center font-medium text-slate-600 text-sm">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dayAppointments = getAppointmentsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-24 p-1 border border-slate-200 ${
                      !isCurrentMonth ? "bg-slate-50 text-slate-400" : "bg-white"
                    } ${isToday ? "border-medical-blue bg-blue-50" : ""}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? "text-medical-blue" : ""}`}>
                      {format(day, "d")}
                    </div>
                    
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map((appointment) => {
                        const patientName = getPatientName(appointment.contact_id);
                        const time = format(new Date(appointment.scheduled_date!), "HH:mm");
                        
                        return (
                          <div
                            key={appointment.id}
                            className="text-xs p-1 bg-medical-blue text-white rounded truncate cursor-pointer hover:bg-blue-700 transition-colors"
                            title={`${time} - ${patientName} - ${appointment.specialty}`}
                            onClick={() => handleAppointmentClick(appointment)}
                          >
                            {time} {patientName.split(' ')[0]}
                          </div>
                        );
                      })}
                      
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-slate-500 font-medium">
                          +{dayAppointments.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointment Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-medical-blue" />
              Detalhes da Consulta
            </DialogTitle>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-6">
              {/* Patient Information */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Informações do Paciente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Nome</p>
                    <p className="font-medium">{getPatientName(selectedAppointment.contact_id)}</p>
                  </div>
                  {getPatientInfo(selectedAppointment.contact_id) && (
                    <>
                      <div>
                        <p className="text-sm text-slate-600">Telefone</p>
                        <p className="font-medium flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {getPatientInfo(selectedAppointment.contact_id)?.phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Email</p>
                        <p className="font-medium flex items-center gap-1">
                          <MessageCircle className="w-3 h-3 text-blue-600" />
                          {getPatientInfo(selectedAppointment.contact_id)?.email || 'Não informado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Endereço</p>
                        <p className="font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {getPatientInfo(selectedAppointment.contact_id)?.address || 'Não informado'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Appointment Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  Informações da Consulta
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Data e Hora</p>
                    <p className="font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(selectedAppointment.scheduled_date!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Especialidade</p>
                    <p className="font-medium">{selectedAppointment.specialty}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Profissional</p>
                    <p className="font-medium flex items-center gap-1">
                      <Stethoscope className="w-3 h-3" />
                      {selectedAppointment.doctor_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Status</p>
                    <Badge className={statusLabels[selectedAppointment.status as keyof typeof statusLabels].color}>
                      {statusLabels[selectedAppointment.status as keyof typeof statusLabels].label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedAppointment.session_notes && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-slate-800 mb-3">Observações</h3>
                  <p className="text-slate-700">{selectedAppointment.session_notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Fechar
                </Button>
                <Button className="bg-medical-blue hover:bg-blue-700">
                  Editar Consulta
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}