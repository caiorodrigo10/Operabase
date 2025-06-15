import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar, List, Clock, User, Stethoscope, CalendarDays, ChevronLeft, ChevronRight, Phone, MessageCircle, MapPin, Plus, Check, ChevronsUpDown, Edit, Trash2, X, Eye, MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAvailabilityCheck, formatConflictMessage } from "@/hooks/useAvailability";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { mockAppointments, mockContacts } from "@/lib/mock-data";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EventTooltip } from "@/components/EventTooltip";
import { AppointmentEditor } from "@/components/AppointmentEditor";
import type { Appointment, Contact } from "@/../../shared/schema";

// Status configuration with proper colors and ordering
const statusConfig = {
  pendente: { 
    label: "Pendente", 
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    badgeColor: "bg-yellow-500",
    order: 0
  },
  agendada: { 
    label: "Agendado", 
    color: "bg-blue-100 text-blue-800 border-blue-200",
    badgeColor: "bg-blue-500",
    order: 1
  },
  confirmada: { 
    label: "Confirmado", 
    color: "bg-green-100 text-green-800 border-green-200",
    badgeColor: "bg-green-500",
    order: 2
  },
  realizada: { 
    label: "Realizado", 
    color: "bg-purple-100 text-purple-800 border-purple-200",
    badgeColor: "bg-purple-500",
    order: 3
  },
  faltou: { 
    label: "Faltou", 
    color: "bg-orange-100 text-orange-800 border-orange-200",
    badgeColor: "bg-orange-500",
    order: 4
  },
  cancelada: { 
    label: "Cancelado", 
    color: "bg-red-100 text-red-800 border-red-200",
    badgeColor: "bg-red-500",
    order: 5
  }
} as const;

// Legacy status mapping - only for display purposes
const legacyStatusMapping: Record<string, keyof typeof statusConfig> = {
  scheduled: "agendada",
  confirmed: "confirmada", 
  completed: "realizada",
  cancelled: "cancelada",
  no_show: "faltou",
  pending: "pendente"
};

// Main status list for dropdowns (no duplicates)
const mainStatusList = [
  'pendente',
  'agendada', 
  'confirmada',
  'realizada',
  'faltou',
  'cancelada'
] as const;

// Helper function to get status config (including legacy mapping)
const getStatusConfig = (status: string) => {
  const mappedStatus = legacyStatusMapping[status] || status;
  return statusConfig[mappedStatus as keyof typeof statusConfig];
};

// Support legacy status names for display
const statusLabels: Record<string, { label: string; color: string }> = {
  ...Object.fromEntries(
    Object.entries(statusConfig).map(([key, value]) => [key, { label: value.label, color: value.color }])
  ),
  // Legacy status labels
  scheduled: { label: "Agendado", color: "bg-blue-100 text-blue-800" },
  confirmed: { label: "Confirmado", color: "bg-green-100 text-green-800" },
  completed: { label: "Realizado", color: "bg-purple-100 text-purple-800" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
  no_show: { label: "Faltou", color: "bg-orange-100 text-orange-800" },
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
};

export function Consultas() {
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calendarView, setCalendarView] = useState<"month" | "week" | "day">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [appointmentEditorOpen, setAppointmentEditorOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<number | undefined>(undefined);
  const [dayEventsDialog, setDayEventsDialog] = useState<{ open: boolean; date: Date; events: Appointment[] }>({
    open: false,
    date: new Date(),
    events: []
  });
  
  const { toast } = useToast();

  // Mutation for updating appointment status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ appointmentId, status }: { appointmentId: number; status: string }) => {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Status atualizado",
        description: "O status da consulta foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da consulta.",
        variant: "destructive",
      });
    },
  });

  // Fetch appointments
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['/api/appointments', { clinic_id: 1 }],
    queryFn: async () => {
      const response = await fetch('/api/appointments?clinic_id=1');
      if (!response.ok) throw new Error('Failed to fetch appointments');
      return response.json();
    },
  });

  // Fetch contacts for patient names
  const { data: contacts = [] } = useQuery({
    queryKey: ['/api/contacts', { clinic_id: 1 }],
    queryFn: async () => {
      const response = await fetch('/api/contacts?clinic_id=1');
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json();
    },
  });

  // Fetch users for doctor names
  const { data: clinicUsers = [] } = useQuery({
    queryKey: ['/api/clinic/1/users'],
    queryFn: async () => {
      const response = await fetch('/api/clinic/1/users');
      if (!response.ok) throw new Error('Failed to fetch clinic users');
      return response.json();
    },
  });

  useEffect(() => {
    if (!appointmentsLoading) {
      setIsLoading(false);
    }
  }, [appointmentsLoading]);

  // Helper functions
  const getPatientName = (contactId: number) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? contact.name : 'Paciente não encontrado';
  };

  const getPatientInfo = (contactId: number) => {
    return contacts.find(c => c.id === contactId);
  };

  const getEventColor = (status: string) => {
    const config = getStatusConfig(status);
    if (!config) {
      return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500' };
    }

    // Convert config colors to event colors
    const colorMap: Record<string, { bg: string; text: string; border: string; dot: string }> = {
      'bg-yellow-100 text-yellow-800 border-yellow-200': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
      'bg-blue-100 text-blue-800 border-blue-200': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
      'bg-green-100 text-green-800 border-green-200': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
      'bg-purple-100 text-purple-800 border-purple-200': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
      'bg-orange-100 text-orange-800 border-orange-200': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
      'bg-red-100 text-red-800 border-red-200': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
    };

    return colorMap[config.color] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500' };
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };

  const handleEditAppointment = (appointmentId: number) => {
    setEditingAppointmentId(appointmentId);
    setAppointmentEditorOpen(true);
  };

  const navigateCalendar = (direction: 'prev' | 'next') => {
    if (calendarView === 'month') {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else if (calendarView === 'week') {
      setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1));
    }
  };

  const getCalendarDays = () => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((appointment: Appointment) => {
      if (!appointment.scheduled_date) return false;
      const appointmentDate = new Date(appointment.scheduled_date);
      return isSameDay(appointmentDate, date);
    });
  };

  const showDayEvents = (date: Date, events: Appointment[]) => {
    setDayEventsDialog({
      open: true,
      date,
      events
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  const calendarDays = getCalendarDays();

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

              {/* Calendar Navigation */}
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => navigateCalendar('prev')}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium min-w-32 text-center">
                  {calendarView === 'month' && format(currentDate, "MMMM yyyy", { locale: ptBR })}
                  {calendarView === 'week' && `${format(startOfWeek(currentDate), "dd MMM", { locale: ptBR })} - ${format(endOfWeek(currentDate), "dd MMM yyyy", { locale: ptBR })}`}
                  {calendarView === 'day' && format(currentDate, "dd 'de' MMMM yyyy", { locale: ptBR })}
                </span>
                <Button variant="outline" size="sm" onClick={() => navigateCalendar('next')}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Hoje
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {viewMode === "list" ? (
            /* List View */
            <div className="space-y-4">
              {appointments.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Nenhuma consulta encontrada
                </div>
              ) : (
                appointments
                  .sort((a: Appointment, b: Appointment) => {
                    return new Date(a.scheduled_date || 0).getTime() - new Date(b.scheduled_date || 0).getTime();
                  })
                  .map((appointment: Appointment) => {
                    const patientName = getPatientName(appointment.contact_id);
                    const colors = getEventColor(appointment.status);
                    
                    return (
                      <Card key={appointment.id} className="border border-slate-200 bg-white cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`w-3 h-3 ${getEventColor(appointment.status).dot} rounded-full`}></div>
                              <div>
                                <h3 className="font-semibold text-slate-900">{patientName}</h3>
                                <div className="flex items-center space-x-4 text-sm text-slate-600">
                                  <span className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {appointment.scheduled_date ? format(new Date(appointment.scheduled_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data não definida'}
                                  </span>
                                  {appointment.doctor_name && (
                                    <span className="flex items-center">
                                      <Stethoscope className="w-4 h-4 mr-1" />
                                      {appointment.doctor_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {/* Clickable Status Badge with Dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <Badge 
                                      className={`${statusLabels[appointment.status]?.color || 'bg-gray-100 text-gray-800'} cursor-pointer hover:opacity-80 hover:shadow-sm transition-all duration-200 border border-opacity-20`}
                                    >
                                      {statusLabels[appointment.status]?.label || appointment.status}
                                      <span className="ml-1 text-xs opacity-60">▼</span>
                                    </Badge>
                                  </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  {/* Status Change Options */}
                                  {mainStatusList
                                    .filter((status) => status !== appointment.status)
                                    .map((status) => {
                                      const config = statusConfig[status];
                                      return (
                                        <DropdownMenuItem
                                          key={status}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateStatusMutation.mutate({
                                              appointmentId: appointment.id,
                                              status: status
                                            });
                                          }}
                                          disabled={updateStatusMutation.isPending}
                                        >
                                          <div className={`w-3 h-3 ${config.badgeColor} rounded-full mr-2`}></div>
                                          Alterar para {config.label}
                                        </DropdownMenuItem>
                                      );
                                    })}
                                </DropdownMenuContent>
                              </DropdownMenu>
                              
                              {/* Actions Menu */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAppointmentClick(appointment);
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver detalhes
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditAppointment(appointment.id);
                                    }}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar consulta
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
              )}
            </div>
          ) : (
            /* Calendar View */
            <div>
              {calendarView === "month" && (
                <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden">
                  {/* Calendar headers */}
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <div key={day} className="bg-slate-50 p-2 text-center text-sm font-medium text-slate-600">
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar days */}
                  {calendarDays.map((day) => {
                    const dayAppointments = getAppointmentsForDate(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    
                    return (
                      <div
                        key={day.toISOString()}
                        className={`bg-white p-2 min-h-24 ${!isCurrentMonth ? 'text-slate-400' : ''} ${isSameDay(day, new Date()) ? 'bg-blue-50' : ''}`}
                      >
                        <div className="text-sm font-medium mb-1">
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-1">
                          {dayAppointments.slice(0, 2).map((appointment: Appointment) => {
                            const patientName = getPatientName(appointment.contact_id);
                            const time = appointment.scheduled_date ? format(new Date(appointment.scheduled_date), 'HH:mm') : '';
                            const colors = getEventColor(appointment.status);

                            return (
                              <EventTooltip key={appointment.id} appointment={appointment} patientName={patientName}>
                                <div
                                  className="text-xs p-1 bg-slate-50 text-slate-700 rounded truncate cursor-pointer border border-slate-200 hover:bg-slate-100"
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
                              className="text-xs text-slate-600 cursor-pointer hover:text-blue-600"
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
              )}

              {calendarView === "week" && (
                <div className="grid grid-cols-8 gap-px bg-slate-200 rounded-lg overflow-hidden">
                  {/* Time column header */}
                  <div className="bg-slate-50 p-2"></div>
                  
                  {/* Day headers */}
                  {calendarDays.slice(0, 7).map((day) => (
                    <div key={day.toISOString()} className="bg-slate-50 p-2 text-center">
                      <div className="text-sm font-medium">{format(day, 'EEE', { locale: ptBR })}</div>
                      <div className={`text-lg ${isSameDay(day, new Date()) ? 'text-blue-600 font-bold' : ''}`}>
                        {format(day, 'd')}
                      </div>
                    </div>
                  ))}
                  
                  {/* Time slots */}
                  {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
                    <React.Fragment key={hour}>
                      {/* Time label */}
                      <div className="bg-white p-2 text-sm text-slate-600 border-r">
                        {hour}:00
                      </div>
                      
                      {/* Day columns */}
                      {calendarDays.slice(0, 7).map((day) => {
                        const dayAppointments = getAppointmentsForDate(day).filter((apt: Appointment) => {
                          if (!apt.scheduled_date) return false;
                          const aptHour = new Date(apt.scheduled_date).getHours();
                          return aptHour === hour;
                        });
                        
                        return (
                          <div key={`${day.toISOString()}-${hour}`} className="bg-white p-1 border-r relative min-h-16">
                            {dayAppointments.map((appointment: Appointment, idx: number) => {
                              const colors = getEventColor(appointment.status);
                              const patientName = getPatientName(appointment.contact_id);
                              const time = appointment.scheduled_date ? format(new Date(appointment.scheduled_date), 'HH:mm') : '';

                              return (
                                <EventTooltip key={appointment.id} appointment={appointment} patientName={patientName}>
                                  <div
                                    className="absolute left-1 right-1 text-xs p-1 bg-slate-50 text-slate-700 rounded truncate cursor-pointer border border-slate-200 hover:bg-slate-100"
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
                    </React.Fragment>
                  ))}
                </div>
              )}

              {calendarView === "day" && (
                <div className="space-y-4">
                  <div className="text-center text-lg font-semibold">
                    {format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => {
                      const hourAppointments = getAppointmentsForDate(currentDate).filter((apt: Appointment) => {
                        if (!apt.scheduled_date) return false;
                        const aptHour = new Date(apt.scheduled_date).getHours();
                        return aptHour === hour;
                      });
                      
                      return (
                        <div key={hour} className="flex border-b border-slate-100 pb-2">
                          <div className="w-20 text-sm text-slate-600 pt-2">
                            {hour}:00
                          </div>
                          <div className="flex-1 space-y-1">
                            {hourAppointments.map((appointment: Appointment, idx: number) => {
                              const colors = getEventColor(appointment.status);
                              const patientName = getPatientName(appointment.contact_id);
                              const time = appointment.scheduled_date ? format(new Date(appointment.scheduled_date), 'HH:mm') : '';

                              return (
                                <EventTooltip key={appointment.id} appointment={appointment} patientName={patientName}>
                                  <div
                                    className="p-2 bg-slate-50 text-slate-700 rounded cursor-pointer border border-slate-200 hover:bg-slate-100"
                                    onClick={() => handleAppointmentClick(appointment)}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-3 h-3 ${colors.dot} rounded-full flex-shrink-0`}></div>
                                      <span className="font-medium">{time} - {patientName}</span>
                                    </div>
                                    {appointment.doctor_name && (
                                      <div className="text-xs mt-1">Dr. {appointment.doctor_name}</div>
                                    )}
                                  </div>
                                </EventTooltip>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Appointment Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Detalhes da Consulta
              <div className="flex space-x-2">
                {selectedAppointment && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditAppointment(selectedAppointment.id)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDialogOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-6">
              {selectedAppointment.google_calendar_event_id ? (
                /* Google Calendar Event Layout */
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm font-medium text-purple-800">Evento do Google Calendar</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">{selectedAppointment.doctor_name || 'Consulta'}</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Data e Hora</p>
                      <p className="font-medium">
                        {selectedAppointment.scheduled_date 
                          ? format(new Date(selectedAppointment.scheduled_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                          : 'Não definido'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Duração</p>
                      <p className="font-medium">{selectedAppointment.duration_minutes || 60} minutos</p>
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
                            <p className="font-medium flex items-center gap-2">
                              <Phone className="w-3 h-3" />
                              {getPatientInfo(selectedAppointment.contact_id)?.phone}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600">Email</p>
                            <p className="font-medium">{getPatientInfo(selectedAppointment.contact_id)?.email || 'Não informado'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600">Idade</p>
                            <p className="font-medium">{getPatientInfo(selectedAppointment.contact_id)?.age || 'Não informado'} anos</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Appointment Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-slate-600">Data e Hora</p>
                      <p className="font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {selectedAppointment.scheduled_date 
                          ? format(new Date(selectedAppointment.scheduled_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                          : 'Não definido'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Status</p>
                      <Badge className={statusLabels[selectedAppointment.status]?.color || 'bg-gray-100 text-gray-800'}>
                        {statusLabels[selectedAppointment.status]?.label || selectedAppointment.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Duração</p>
                      <p className="font-medium">{selectedAppointment.duration_minutes || 60} minutos</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Especialidade</p>
                      <p className="font-medium">{selectedAppointment.specialty || 'Não especificado'}</p>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedAppointment.session_notes && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-slate-800 mb-3">Observações</h3>
                      <p className="text-slate-700">{selectedAppointment.session_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Day Events Dialog */}
      <Dialog open={dayEventsDialog.open} onOpenChange={(open) => setDayEventsDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Consultas - {format(dayEventsDialog.date, "dd 'de' MMMM", { locale: ptBR })}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4"
              onClick={() => setDayEventsDialog(prev => ({ ...prev, open: false }))}
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {dayEventsDialog.events.map((appointment: any) => {
              const colors = getEventColor(appointment.status);
              const patientName = getPatientName(appointment.contact_id);
              const time = appointment.scheduled_date ? format(new Date(appointment.scheduled_date), 'HH:mm') : '';
              
              return (
                <div
                  key={appointment.id}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:shadow-sm hover:bg-slate-100"
                  onClick={() => {
                    handleAppointmentClick(appointment);
                    setDayEventsDialog(prev => ({ ...prev, open: false }));
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 ${colors.dot} rounded-full`}></div>
                      <div>
                        <p className="font-medium">{time} - {patientName}</p>
                        {appointment.doctor_name && (
                          <p className="text-sm text-slate-600">Dr. {appointment.doctor_name}</p>
                        )}
                      </div>
                    </div>
                    <Badge className={statusLabels[appointment.status]?.color || 'bg-gray-100 text-gray-800'}>
                      {statusLabels[appointment.status]?.label || appointment.status}
                    </Badge>
                  </div>
                </div>
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