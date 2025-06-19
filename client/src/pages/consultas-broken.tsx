import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar, List, Clock, User, Stethoscope, CalendarDays, ChevronLeft, ChevronRight, Phone, MessageCircle, MapPin, Plus, Check, ChevronsUpDown, Edit, Trash2, X, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAvailabilityCheck, formatConflictMessage } from "@/hooks/useAvailability";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { mockAppointments, mockContacts } from "@/lib/mock-data";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EventTooltip } from "@/components/EventTooltip";
import { AppointmentEditor } from "@/components/AppointmentEditor";
import type { Appointment, Contact } from "@/../../shared/schema";
import React from "react";

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
  const [calendarView, setCalendarView] = useState<"month" | "week" | "day">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [appointmentEditorOpen, setAppointmentEditorOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<number | undefined>(undefined);
  const [contactComboboxOpen, setContactComboboxOpen] = useState(false);
  const [dayEventsDialog, setDayEventsDialog] = useState<{ open: boolean; date: Date; events: Appointment[] }>({
    open: false,
    date: new Date(),
    events: []
  });
  const [availabilityConflict, setAvailabilityConflict] = useState<{
    hasConflict: boolean;
    message: string;
    conflictType?: string;
  } | null>(null);
  const { toast } = useToast();
  const availabilityCheck = useAvailabilityCheck();

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

  // Função para verificar disponibilidade quando data/hora mudarem
  const checkAvailability = async (date: string, time: string, duration: string) => {
    if (!date || !time || !duration) {
      setAvailabilityConflict(null);
      return;
    }

    const startDateTime = new Date(`${date}T${time}`);
    const durationMinutes = parseInt(duration);
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

    try {
      const result = await availabilityCheck.mutateAsync({
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString()
      });

      if (result.conflict) {
        setAvailabilityConflict({
          hasConflict: true,
          message: formatConflictMessage(result.conflictType!, result.conflictDetails!),
          conflictType: result.conflictType
        });
      } else {
        setAvailabilityConflict({
          hasConflict: false,
          message: "Horário disponível",
          conflictType: undefined
        });
      }
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      setAvailabilityConflict(null);
    }
  };

  // Watch dos campos do formulário para verificar disponibilidade
  const watchedDate = form.watch("scheduled_date");
  const watchedTime = form.watch("scheduled_time");
  const watchedDuration = form.watch("duration");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (watchedDate && watchedTime && watchedDuration) {
        checkAvailability(watchedDate, watchedTime, watchedDuration);
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [watchedDate, watchedTime, watchedDuration]);

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

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentForm) => {
      // Atualizar dados do contato se foram modificados
      if (data.contact_whatsapp || data.contact_email) {
        const contactUpdates: any = {};
        if (data.contact_whatsapp) contactUpdates.phone = data.contact_whatsapp;
        if (data.contact_email) contactUpdates.email = data.contact_email;
        
        if (Object.keys(contactUpdates).length > 0) {
          await apiRequest(`/api/contacts/${data.contact_id}`, "PUT", contactUpdates);
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
      const res = await apiRequest("/api/appointments", "POST", appointmentData);
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

  const deleteAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      const response = await apiRequest("DELETE", `/api/appointments/${appointmentId}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Consulta excluída",
        description: "A consulta foi excluída com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments", { clinic_id: 1 }] });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir consulta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteAppointment = (appointmentId: number) => {
    if (confirm("Tem certeza que deseja excluir esta consulta?")) {
      deleteAppointmentMutation.mutate(appointmentId);
    }
  };

  // Update loading state based on data loading
  useEffect(() => {
    setIsLoading(contactsLoading || appointmentsLoading || usersLoading);
  }, [contactsLoading, appointmentsLoading, usersLoading]);

  const getPatientName = (contactId: number | null, appointment?: any) => {
    // For Google Calendar events, show the event title instead of patient name
    if (appointment?.is_google_calendar_event && appointment?.doctor_name) {
      return appointment.doctor_name;
    }
    
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

  // Calendar calculations based on view mode
  const getCalendarPeriod = () => {
    switch (calendarView) {
      case 'day':
        return {
          start: startOfDay(currentDate),
          end: endOfDay(currentDate),
          days: [currentDate]
        };
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
        return {
          start: weekStart,
          end: weekEnd,
          days: eachDayOfInterval({ start: weekStart, end: weekEnd })
        };
      case 'month':
      default:
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
        return {
          start: calendarStart,
          end: calendarEnd,
          days: eachDayOfInterval({ start: calendarStart, end: calendarEnd })
        };
    }
  };

  const { start: periodStart, end: periodEnd, days: calendarDays } = getCalendarPeriod();

  // Navigation functions
  const navigateCalendar = (direction: 'prev' | 'next') => {
    switch (calendarView) {
      case 'day':
        setCurrentDate(direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
        break;
    }
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(appointment => 
      appointment.scheduled_date && isSameDay(new Date(appointment.scheduled_date), date)
    );
  };

  // Get event color based on source and sync preference
  const getEventColor = (appointment: any) => {
    if (appointment.is_google_calendar_event) {
      // Different colors based on sync preference
      if (appointment.sync_preference === 'bidirectional') {
        return {
          bg: 'bg-green-100',
          border: 'border-green-300',
          text: 'text-green-800',
          dot: 'bg-green-500'
        };
      } else {
        return {
          bg: 'bg-purple-100',
          border: 'border-purple-300',
          text: 'text-purple-800',
          dot: 'bg-purple-500'
        };
      }
    }
    return {
      bg: 'bg-blue-100',
      border: 'border-blue-300', 
      text: 'text-blue-800',
      dot: 'bg-blue-500'
    };
  };

  // Show day events dialog
  const showDayEvents = (date: Date, events: any[]) => {
    setDayEventsDialog({
      open: true,
      date,
      events
    });
  };

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
        <Button 
          className="flex items-center gap-2"
          onClick={() => {
            setEditingAppointmentId(undefined);
            setAppointmentEditorOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Nova Consulta
        </Button>
      </div>

      {/* Comprehensive Appointment Editor */}
      <AppointmentEditor
        appointmentId={editingAppointmentId}
        isOpen={appointmentEditorOpen}
        onClose={() => {
          setAppointmentEditorOpen(false);
          setEditingAppointmentId(undefined);
        }}
        onSave={() => {
          // Refresh appointments list
          queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
        }}
      />

      <div className="bg-white rounded-lg shadow-sm border">
        {/* View Mode Toggle */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <div className="flex space-x-1 bg-slate-100 rounded-lg p-1">
                    <FormItem>
                      <FormLabel>Paciente *</FormLabel>
                      <FormControl>
                        <Popover open={contactComboboxOpen} onOpenChange={setContactComboboxOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={contactComboboxOpen}
                              className="w-full justify-between"
                            >
                              {field.value
                                ? contacts.find((contact) => contact.id.toString() === field.value)?.name
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
                                      field.onChange(contact.id.toString());
                                      handleContactSelect(contact.id.toString());
                                      setContactComboboxOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        field.value === contact.id.toString()
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="user_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuário Responsável *</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Consulta *</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="scheduled_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduled_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário *</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (minutos) *</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Availability Check Display */}
              {availabilityConflict && (
                <div className={`p-3 rounded-lg border ${
                  availabilityConflict.hasConflict 
                    ? 'bg-red-50 border-red-200 text-red-800' 
                    : 'bg-green-50 border-green-200 text-green-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {availabilityConflict.hasConflict ? (
                      <X className="w-4 h-4 text-red-600" />
                    ) : (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                    <span className="text-sm font-medium">
                      {availabilityConflict.hasConflict ? 'Conflito detectado' : 'Horário disponível'}
                    </span>
                  </div>
                  <p className="text-sm mt-1 ml-6">{availabilityConflict.message}</p>
                </div>
              )}

              {availabilityCheck.isPending && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-800">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">Verificando disponibilidade...</span>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações sobre a consulta..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  disabled={createAppointmentMutation.isPending || (availabilityConflict?.hasConflict === true)}
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
            {/* Calendar View Selector */}
            <div className="flex space-x-1 bg-slate-100 rounded-lg p-1">
              <Button
                variant={calendarView === "day" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCalendarView("day")}
                className="text-xs"
              >
                Dia
              </Button>
              <Button
                variant={calendarView === "week" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCalendarView("week")}
                className="text-xs"
              >
                Semana
              </Button>
              <Button
                variant={calendarView === "month" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCalendarView("month")}
                className="text-xs"
              >
                Mês
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateCalendar('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-lg font-semibold text-slate-800 min-w-[200px] text-center">
                {calendarView === 'day' && format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                {calendarView === 'week' && `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), "dd/MM", { locale: ptBR })} - ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), "dd/MM/yyyy", { locale: ptBR })}`}
                {calendarView === 'month' && format(currentDate, "MMMM yyyy", { locale: ptBR })}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateCalendar('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Today button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="text-xs"
            >
              Hoje
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
                .filter(appointment => !appointment.google_calendar_event_id) // Only show system appointments in the list
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
                                {patientName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
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
            {/* Legend for event colors */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Sistema</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Google Calendar (Unidirecional)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Google Calendar (Bidirecional)</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Month View */}
            {calendarView === 'month' && (
              <>
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
                        } ${isToday ? "border-blue-500 bg-blue-50" : ""}`}
                      >
                        <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : ""}`}>
                          {format(day, "d")}
                        </div>
                        
                        <div className="space-y-1">
                          {dayAppointments.slice(0, 2).map((appointment) => {
                            const patientName = getPatientName(appointment.contact_id, appointment);
                            const time = appointment.scheduled_date ? format(new Date(appointment.scheduled_date), "HH:mm") : "";
                            const colors = getEventColor(appointment);
                            
                            return (
                              <EventTooltip 
                                key={appointment.id}
                                appointment={appointment} 
                                patientName={patientName}
                              >
                                <div
                                  className={`text-xs p-1 ${colors.bg} ${colors.text} rounded truncate cursor-pointer hover:opacity-80 transition-opacity border ${colors.border}`}
                                  onClick={() => handleAppointmentClick(appointment)}
                                >
                                  <div className="flex items-center gap-1">
                                    <div className={`w-2 h-2 ${colors.dot} rounded-full flex-shrink-0`}></div>
                                    <span className="truncate">{time} {patientName.split(' ')[0]}</span>
                                  </div>
                                </div>
                              </EventTooltip>
                            );
                          })}
                          
                          {dayAppointments.length > 2 && (
                            <div 
                              className="text-xs text-slate-600 font-medium cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => showDayEvents(day, dayAppointments)}
                            >
                              +{dayAppointments.length - 2} mais
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Week View */}
            {calendarView === 'week' && (
              <>
                <div className="grid grid-cols-8 gap-1 mb-2">
                  <div className="p-2 text-center font-medium text-slate-600 text-sm"></div>
                  {calendarDays.map((day) => (
                    <div key={day.toISOString()} className="p-2 text-center font-medium text-slate-600 text-sm">
                      <div>{format(day, "EEE", { locale: ptBR })}</div>
                      <div className={`text-lg ${isSameDay(day, new Date()) ? "text-blue-600 font-bold" : ""}`}>
                        {format(day, "d")}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-8 gap-1 min-h-96">
                  <div className="flex flex-col">
                    {Array.from({ length: 24 }, (_, i) => (
                      <div key={i} className="h-12 border-b border-slate-200 text-xs text-slate-500 p-1">
                        {String(i).padStart(2, '0')}:00
                      </div>
                    ))}
                  </div>
                  
                  {calendarDays.map((day) => {
                    const dayAppointments = getAppointmentsForDate(day);
                    const isToday = isSameDay(day, new Date());
                    
                    return (
                      <div key={day.toISOString()} className={`border-l border-slate-200 ${isToday ? 'bg-blue-50' : ''}`}>
                        {Array.from({ length: 24 }, (_, hour) => {
                          const hourAppointments = dayAppointments.filter(apt => {
                            if (!apt.scheduled_date) return false;
                            const aptHour = new Date(apt.scheduled_date).getHours();
                            return aptHour === hour;
                          });
                          
                          return (
                            <div key={hour} className="h-12 border-b border-slate-200 p-1 relative">
                              {hourAppointments.map((appointment, idx) => {
                                const colors = getEventColor(appointment);
                                const patientName = getPatientName(appointment.contact_id, appointment);
                                const time = appointment.scheduled_date ? format(new Date(appointment.scheduled_date), "HH:mm") : "";
                                
                                return (
                                  <EventTooltip 
                                    key={appointment.id}
                                    appointment={appointment} 
                                    patientName={patientName}
                                  >
                                    <div
                                      className={`absolute left-1 right-1 text-xs p-1 ${colors.bg} ${colors.text} rounded truncate cursor-pointer border ${colors.border}`}
                                      style={{ top: `${idx * 20}px`, zIndex: 10 + idx }}
                                      onClick={() => handleAppointmentClick(appointment)}
                                    >
                                      <div className="flex items-center gap-1">
                                        <div className={`w-2 h-2 ${colors.dot} rounded-full flex-shrink-0`}></div>
                                        <span className="truncate">{time} {patientName.split(' ')[0]}</span>
                                      </div>
                                    </div>
                                  </EventTooltip>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Day View */}
            {calendarView === 'day' && (
              <>
                <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                  <h3 className="font-semibold text-slate-800">
                    {format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-slate-700">Horários</h4>
                    <div className="space-y-1">
                      {Array.from({ length: 24 }, (_, i) => (
                        <div key={i} className="h-12 border-b border-slate-200 text-sm text-slate-500 p-2 flex items-center">
                          {String(i).padStart(2, '0')}:00
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-slate-700">Compromissos</h4>
                    <div className="space-y-1 relative">
                      {Array.from({ length: 24 }, (_, hour) => {
                        const dayAppointments = getAppointmentsForDate(currentDate);
                        const hourAppointments = dayAppointments.filter(apt => {
                          if (!apt.scheduled_date) return false;
                          const aptHour = new Date(apt.scheduled_date).getHours();
                          return aptHour === hour;
                        });
                        
                        return (
                          <div key={hour} className="h-12 border-b border-slate-200 p-2 relative">
                            {hourAppointments.map((appointment, idx) => {
                              const colors = getEventColor(appointment);
                              const patientName = getPatientName(appointment.contact_id, appointment);
                              const time = appointment.scheduled_date ? format(new Date(appointment.scheduled_date), "HH:mm") : "";
                              
                              return (
                                <EventTooltip 
                                  key={appointment.id}
                                  appointment={appointment} 
                                  patientName={patientName}
                                >
                                  <div
                                    className={`absolute left-2 right-2 text-sm p-2 ${colors.bg} ${colors.text} rounded cursor-pointer border ${colors.border} shadow-sm`}
                                    style={{ top: `${idx * 25}px`, zIndex: 10 + idx }}
                                    onClick={() => handleAppointmentClick(appointment)}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-3 h-3 ${colors.dot} rounded-full flex-shrink-0`}></div>
                                      <div className="truncate">
                                        <div className="font-medium">{time} - {patientName}</div>
                                        <div className="text-xs opacity-75">{appointment.specialty || appointment.doctor_name}</div>
                                      </div>
                                    </div>
                                  </div>
                                </EventTooltip>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Appointment Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                {selectedAppointment?.google_calendar_event_id ? (
                  <>
                    <CalendarDays className="w-5 h-5 text-purple-600" />
                    Detalhes do Evento
                  </>
                ) : (
                  <>
                    <Stethoscope className="w-5 h-5 text-medical-blue" />
                    Detalhes da Consulta
                  </>
                )}
              </DialogTitle>
              
              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {!selectedAppointment?.google_calendar_event_id && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        // TODO: Implement edit functionality
                        console.log('Edit appointment:', selectedAppointment?.id);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteAppointment(selectedAppointment!.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-500 hover:text-slate-600"
                  onClick={() => setIsDialogOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <DialogDescription>
              {selectedAppointment?.google_calendar_event_id 
                ? "Visualize as informações do evento do Google Calendar"
                : "Visualize e gerencie os detalhes da consulta agendada"
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-6">
              {/* Check if it's a Google Calendar event */}
              {selectedAppointment.google_calendar_event_id ? (
                /* Google Calendar Event Layout */
                <div className="space-y-4">
                  {/* Event Header */}
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm font-medium text-purple-800">Evento do Google Calendar</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">{selectedAppointment.doctor_name}</h3>
                  </div>

                  {/* Event Details */}
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      Detalhes do Evento
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
                        <p className="text-sm text-slate-600">Duração</p>
                        <p className="font-medium">{selectedAppointment.duration_minutes || 60} minutos</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Tipo</p>
                        <p className="font-medium">{selectedAppointment.specialty || 'Evento externo'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Origem</p>
                        <p className="font-medium text-purple-700">📅 Google Calendar</p>
                      </div>
                    </div>
                  </div>

                  {/* Event Description */}
                  {selectedAppointment.session_notes && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-slate-800 mb-3">Descrição</h3>
                      <p className="text-slate-700">{selectedAppointment.session_notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                /* System Appointment Layout */
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

      {/* Day Events Dialog - Popup for multiple events */}
      <Dialog open={dayEventsDialog.open} onOpenChange={(open) => setDayEventsDialog({...dayEventsDialog, open})}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold text-slate-800">
                {format(dayEventsDialog.date, "EEEE", { locale: ptBR }).toUpperCase()}
              </DialogTitle>
              <button 
                onClick={() => setDayEventsDialog({...dayEventsDialog, open: false})}
                className="text-slate-500 hover:text-slate-700"
              >
                ×
              </button>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {format(dayEventsDialog.date, "dd", { locale: ptBR })}
            </div>
          </DialogHeader>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {dayEventsDialog.events.map((appointment) => {
              const colors = getEventColor(appointment);
              const patientName = getPatientName(appointment.contact_id, appointment);
              const time = appointment.scheduled_date ? format(new Date(appointment.scheduled_date), "HH:mm") : "";
              
              return (
                <EventTooltip 
                  key={appointment.id}
                  appointment={appointment} 
                  patientName={patientName}
                >
                  <div
                    className={`p-3 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity ${colors.bg} ${colors.border}`}
                    onClick={() => {
                      handleAppointmentClick(appointment);
                      setDayEventsDialog({...dayEventsDialog, open: false});
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 ${colors.dot} rounded-full flex-shrink-0`}></div>
                      <div className="flex-1">
                        <div className={`font-medium ${colors.text}`}>
                          {time} {patientName}
                        </div>
                        <div className={`text-sm opacity-75 ${colors.text}`}>
                          {appointment.specialty || appointment.doctor_name || 'Evento do Google Calendar'}
                        </div>
                        {appointment.google_calendar_event_id && (
                          <div className="text-xs text-purple-600 mt-1">
                            📅 Google Calendar
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </EventTooltip>
              );
            })}
            
            {dayEventsDialog.events.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                Nenhum compromisso encontrado para este dia.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}