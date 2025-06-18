import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarDays, Plus, Search, Filter, Clock, User, Calendar, ChevronLeft, ChevronRight, Eye, Edit, Trash2, Phone, Mail, FileText, MapPin, Heart, AlertCircle, CheckCircle, XCircle, UserPlus, Users, Settings, Tag, Stethoscope, Building2, CreditCard, UserCheck, Clock3, Calendar as CalendarIcon, UserX, PhoneCall, MessageSquare, Star, MoreVertical, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";

import { useAuth } from "@/hooks/useAuth";


import type { Appointment } from "../../../server/domains/appointments/appointments.schema";
import type { Contact } from "../../../server/domains/contacts/contacts.schema";

// Schema for appointment creation form
const appointmentSchema = z.object({
  contact_id: z.string().min(1, "Paciente é obrigatório"),
  scheduled_date: z.string().min(1, "Data é obrigatória"),
  scheduled_time: z.string().min(1, "Horário é obrigatório"),
  duration_minutes: z.number().min(15, "Duração mínima de 15 minutos").max(480, "Duração máxima de 8 horas"),
  appointment_type: z.string().optional(),
  specialty: z.string().optional(),
  doctor_name: z.string().optional(),
  status: z.enum(["pendente", "agendada", "confirmada", "realizada", "faltou", "cancelada"]),
  session_notes: z.string().optional(),
  payment_amount: z.number().optional(),
  payment_status: z.enum(["pendente", "pago", "cancelado"]).optional(),
  tag_id: z.number().optional(),
});

// Schema for patient creation form
const patientSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  birth_date: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  gender: z.string().optional(),
  marital_status: z.string().optional(),
  profession: z.string().optional(),
  notes: z.string().optional(),
  medical_history: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  emergency_contact: z.string().optional(),
  responsible_name: z.string().optional(),
  responsible_cpf: z.string().optional(),
  responsible_birth_date: z.string().optional(),
  insurance_type: z.string().optional(),
  insurance_holder: z.string().optional(),
  insurance_number: z.string().optional(),
  insurance_responsible_cpf: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  reminder_preference: z.string().optional(),
  how_found_clinic: z.string().optional(),
});

type AppointmentForm = z.infer<typeof appointmentSchema>;
type PatientForm = z.infer<typeof patientSchema>;

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
  agendado: "agendada", // Portuguese variant
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
  agendado: { label: "Agendado", color: "bg-blue-100 text-blue-800" }, // Portuguese variant
  confirmed: { label: "Confirmado", color: "bg-green-100 text-green-800" },
  completed: { label: "Realizado", color: "bg-purple-100 text-purple-800" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
  no_show: { label: "Faltou", color: "bg-orange-100 text-orange-800" },
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
};

export function Consultas() {
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calendarView, setCalendarView] = useState<"month" | "week" | "day">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProfessional, setSelectedProfessional] = useState<number | null>(null);
  
  // Create a stable reference for "today" to avoid timezone issues
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  
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
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [workingHoursWarning, setWorkingHoursWarning] = useState<{
    hasWarning: boolean;
    message: string;
    type: 'non_working_day' | 'outside_hours' | 'lunch_time' | null;
    details?: string;
  } | null>(null);
  const [suggestedSlots, setSuggestedSlots] = useState<Array<{
    date: string;
    time: string;
    datetime: Date;
  }>>([]);
  const [findTimeSlotsOpen, setFindTimeSlotsOpen] = useState(false);
  const [showNewPatientDialog, setShowNewPatientDialog] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [patientFormTab, setPatientFormTab] = useState("basic");
  const [quickCreateHover, setQuickCreateHover] = useState<{
    show: boolean;
    date: Date | null;
    hour: number | null;
    x: number;
    y: number;
  }>({
    show: false,
    date: null,
    hour: null,
    x: 0,
    y: 0
  });
  
  // Add missing selectedTagId state
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  
  // Initialize selectedTagId if not defined for backward compatibility
  useEffect(() => {
    if (typeof selectedTagId === 'undefined') {
      setSelectedTagId(null);
    }
  }, []);

  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch appointments
  const { data: appointments = [], refetch: refetchAppointments } = useQuery({
    queryKey: ['/api/appointments'],
    enabled: !!user,
  });

  // Fetch contacts
  const { data: contacts = [] } = useQuery({
    queryKey: ['/api/contacts'],
    enabled: !!user,
  });

  // Fetch appointment tags
  const { data: appointmentTags = [] } = useQuery({
    queryKey: ['/api/appointment-tags'],
    enabled: !!user,
  });

  // Fetch clinic settings
  const { data: clinicSettings } = useQuery({
    queryKey: ['/api/clinic-settings'],
    enabled: !!user,
  });

  // Fetch professionals
  const { data: professionals = [] } = useQuery({
    queryKey: ['/api/professionals'],
    enabled: !!user,
  });

  // Create patient mutation
  const createPatientMutation = useMutation({
    mutationFn: async (data: PatientForm) => {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao criar paciente');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      setShowNewPatientDialog(false);
      toast({ title: "Paciente criado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar paciente", description: error.message, variant: "destructive" });
    },
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentForm) => {
      const contactsArray = contacts as Contact[];
      const selectedContact = contactsArray.find((contact: Contact) => contact.id.toString() === data.contact_id);
      
      const appointmentData = {
        ...data,
        contact_id: parseInt(data.contact_id),
        scheduled_date: `${data.scheduled_date} ${data.scheduled_time}:00`,
        doctor_name: selectedContact?.name || data.doctor_name,
      };
      
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData),
      });
      
      if (!response.ok) throw new Error('Erro ao criar consulta');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      setIsCreateDialogOpen(false);
      toast({ title: "Consulta criada com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar consulta", description: error.message, variant: "destructive" });
    },
  });

  // Delete appointment mutation
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao deletar consulta');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      setIsDialogOpen(false);
      toast({ title: "Consulta deletada com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao deletar consulta", description: error.message, variant: "destructive" });
    },
  });

  // Calendar navigation functions
  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get day of week key for clinic settings
  const getDayOfWeekKey = (date: Date): string => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  // Check if a date is a working day
  const isWorkingDay = (date: Date, config: any): boolean => {
    if (!config || !config.working_days) return true;
    const dayKey = getDayOfWeekKey(date);
    return config.working_days[dayKey]?.enabled === true;
  };

  // Check if a date is marked as unavailable
  const isUnavailableDay = (date: Date): boolean => {
    const settings = clinicSettings as any;
    if (!settings?.unavailable_dates) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    return settings.unavailable_dates.includes(dateStr);
  };

  // Analyze time slot for conflicts and availability
  const analyzeTimeSlot = (date: Date, hour: number, minute: number = 0) => {
    const dayAppointments = getAppointmentsForDate(date);
    const targetStart = new Date(date);
    targetStart.setHours(hour, minute, 0, 0);
    const targetEnd = new Date(targetStart.getTime() + 30 * 60000); // Default 30 min duration

    const hasConflict = dayAppointments.some((apt: Appointment) => {
      if (!apt.scheduled_date) return false;
      const aptStart = new Date(apt.scheduled_date);
      const aptEnd = new Date(aptStart.getTime() + (apt.duration_minutes || 30) * 60000);
      return (targetStart < aptEnd && targetEnd > aptStart);
    });

    return {
      hasConflict,
      isWorkingHours: hour >= 8 && hour <= 18,
      isValidSlot: hour >= 7 && hour <= 22
    };
  };

  // Check if a time slot is available
  const isTimeSlotAvailable = (date: Date, hour: number, minute: number = 0): boolean => {
    const analysis = analyzeTimeSlot(date, hour, minute);
    return !analysis.hasConflict && analysis.isValidSlot;
  };

  // Handle quick appointment creation
  const handleQuickCreateAppointment = (date: Date, hour: number, minute: number = 0) => {
    const form = document.getElementById('appointment-form') as HTMLFormElement;
    if (form) {
      const dateInput = form.querySelector('[name="scheduled_date"]') as HTMLInputElement;
      const timeInput = form.querySelector('[name="scheduled_time"]') as HTMLInputElement;
      
      if (dateInput) dateInput.value = format(date, 'yyyy-MM-dd');
      if (timeInput) timeInput.value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }
    
    setIsCreateDialogOpen(true);
  };

  // Get background class for calendar cells
  const getCalendarCellBackgroundClass = (date: Date, hour?: number): string => {
    const baseClass = "hover:bg-gray-50 transition-colors duration-200";
    
    if (isUnavailableDay(date)) {
      return `${baseClass} bg-red-50 opacity-50`;
    }
    
    if (!isWorkingDay(date, clinicSettings)) {
      return `${baseClass} bg-gray-100 opacity-75`;
    }
    
    if (hour !== undefined) {
      const analysis = analyzeTimeSlot(date, hour);
      if (analysis.hasConflict) {
        return `${baseClass} bg-red-100`;
      }
      if (!analysis.isWorkingHours) {
        return `${baseClass} bg-yellow-50`;
      }
    }
    
    return baseClass;
  };

  // Get patient name from contact ID
  const getPatientName = (contactId: number, appointment?: Appointment) => {
    const contactsArray = contacts as Contact[];
    const contact = contactsArray.find((c: Contact) => c.id === contactId);
    return contact?.name || appointment?.doctor_name || "Paciente não encontrado";
  };

  // Get appointment duration
  const getAppointmentDuration = (appointment: Appointment): number => {
    return appointment.duration_minutes || 30;
  };

  // Check if two appointments overlap
  const checkEventsOverlap = (event1: Appointment, event2: Appointment): boolean => {
    if (!event1.scheduled_date || !event2.scheduled_date) return false;
    
    const start1 = new Date(event1.scheduled_date);
    const end1 = new Date(start1.getTime() + getAppointmentDuration(event1) * 60000);
    
    const start2 = new Date(event2.scheduled_date);
    const end2 = new Date(start2.getTime() + getAppointmentDuration(event2) * 60000);
    
    return start1 < end2 && end1 > start2;
  };

  // Calculate event layout for overlapping appointments
  const calculateEventLayout = (appointments: Appointment[], targetDate: Date) => {
    const dateKey = format(targetDate, 'yyyy-MM-dd');
    const processedEvents = new Set<string>();
    const collisionGroups: Appointment[][] = [];

    appointments.forEach(appointment => {
      if (processedEvents.has(appointment.id.toString())) return;
      
      const collisionGroup = [appointment];
      processedEvents.add(appointment.id.toString());
      
      let foundNewOverlaps = true;
      while (foundNewOverlaps) {
        foundNewOverlaps = false;
        
        appointments.forEach(otherAppointment => {
          if (processedEvents.has(otherAppointment.id.toString())) return;
          
          const overlapsWithGroup = collisionGroup.some(groupEvent => 
            checkEventsOverlap(groupEvent, otherAppointment)
          );

          if (overlapsWithGroup) {
            collisionGroup.push(otherAppointment);
            processedEvents.add(otherAppointment.id.toString());
            foundNewOverlaps = true;
          }
        });
      }

      if (collisionGroup.length > 0) {
        collisionGroups.push(collisionGroup);
      }
    });

    // Calculate layout for each event based on collision groups
    const layoutMap = new Map<string, { width: number; left: number; group: number }>();

    collisionGroups.forEach((group, groupIndex) => {
      const groupSize = group.length;
      
      if (groupSize === 1) {
        // No collision, use full width
        layoutMap.set(group[0].id.toString(), {
          width: 100,
          left: 0,
          group: groupIndex
        });
      } else {
        // Multiple events, distribute horizontally
        const eventWidth = (100 / groupSize) - 0.5; // Small gap between events
        
        // Sort events by start time for consistent ordering
        const sortedGroup = [...group].sort((a, b) => {
          const timeA = new Date(a.scheduled_date!).getTime();
          const timeB = new Date(b.scheduled_date!).getTime();
          return timeA - timeB;
        });
        
        sortedGroup.forEach((appointment, index) => {
          const leftPosition = (index * (100 / groupSize)) + 0.25; // Small margin
          layoutMap.set(appointment.id.toString(), {
            width: eventWidth,
            left: leftPosition,
            group: groupIndex
          });
        });
      }
    });

    return layoutMap;
  };

  // Get appointment end hour
  const getAppointmentEndHour = (appointment: Appointment): number => {
    if (!appointment.scheduled_date) return 0;
    const startDate = new Date(appointment.scheduled_date);
    const duration = getAppointmentDuration(appointment);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    return endDate.getHours();
  };

  // Get patient info
  const getPatientInfo = (contactId: number) => {
    const contactsArray = contacts as Contact[];
    return contactsArray.find((c: Contact) => c.id === contactId);
  };

  // Get event color based on status
  const getEventColor = (status: string, isGoogleCalendarEvent?: boolean) => {
    // For Google Calendar events, always use gray background
    if (isGoogleCalendarEvent) {
      return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', dot: 'bg-gray-500' };
    }

    // For system appointments, use white background with colored borders
    const config = getStatusConfig(status);
    if (!config) {
      return { bg: 'bg-white', text: 'text-gray-700', border: 'border-gray-300', dot: 'bg-gray-500' };
    }

    // Convert config colors to event colors - white background with colored borders
    const colorMap: Record<string, { bg: string; text: string; border: string; dot: string }> = {
      'bg-yellow-100 text-yellow-800 border-yellow-200': { bg: 'bg-white', text: 'text-yellow-700', border: 'border-yellow-400', dot: 'bg-yellow-500' },
      'bg-blue-100 text-blue-800 border-blue-200': { bg: 'bg-white', text: 'text-blue-700', border: 'border-blue-400', dot: 'bg-blue-500' },
      'bg-green-100 text-green-800 border-green-200': { bg: 'bg-white', text: 'text-green-700', border: 'border-green-400', dot: 'bg-green-500' },
      'bg-purple-100 text-purple-800 border-purple-200': { bg: 'bg-white', text: 'text-purple-700', border: 'border-purple-400', dot: 'bg-purple-500' },
      'bg-orange-100 text-orange-800 border-orange-200': { bg: 'bg-white', text: 'text-orange-700', border: 'border-orange-400', dot: 'bg-orange-500' },
      'bg-red-100 text-red-800 border-red-200': { bg: 'bg-white', text: 'text-red-700', border: 'border-red-400', dot: 'bg-red-500' },
    };

    return colorMap[config.color] || { bg: 'bg-white', text: 'text-gray-700', border: 'border-gray-300', dot: 'bg-gray-500' };
  };

  // Handle appointment click
  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };

  // Handle edit appointment
  const handleEditAppointment = (appointmentId: number) => {
    setEditingAppointmentId(appointmentId);
    setAppointmentEditorOpen(true);
  };

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    const appointmentsArray = appointments as Appointment[];
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Filter appointments for the specific date
    const dayAppointments = appointmentsArray.filter((appointment: Appointment) => {
      if (!appointment.scheduled_date) return false;
      const appointmentDate = format(new Date(appointment.scheduled_date), 'yyyy-MM-dd');
      return appointmentDate === dateStr;
    });

    // Filter by selected professional if one is selected
    const validAppointments = dayAppointments.filter((appointment: Appointment) => {
      if (!selectedProfessional) return true;
      return appointment.user_id === selectedProfessional;
    });

    // Filter by selected tag if one is selected
    const filteredAppointments = validAppointments.filter((appointment: Appointment) => {
      if (!selectedTagId) return true;
      return appointment.tag_id === selectedTagId;
    });

    return filteredAppointments;
  };

  // Show day events in dialog
  const showDayEvents = (date: Date, events: Appointment[]) => {
    setDayEventsDialog({
      open: true,
      date: date,
      events: events
    });
  };

  // Generate time slots for calendar
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 7; hour <= 22; hour++) {
      slots.push(hour);
    }
    return slots;
  }, []);

  // Generate week days
  const weekDays = useMemo(() => {
    const startDate = startOfWeek(currentDate, { locale: ptBR });
    return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
  }, [currentDate]);

  // Forms
  const appointmentForm = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      status: "agendada",
      duration_minutes: 30,
      payment_status: "pendente",
    },
  });

  const patientForm = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  // Form handlers
  const onSubmitAppointment = (data: AppointmentForm) => {
    createAppointmentMutation.mutate(data);
  };

  const onSubmitPatient = (data: PatientForm) => {
    createPatientMutation.mutate(data);
  };

  // Set loading state
  useEffect(() => {
    setIsLoading(false);
  }, [appointments, contacts]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consultas</h1>
          <p className="text-muted-foreground">
            Gerencie suas consultas e compromissos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Hoje
          </Button>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova consulta
          </Button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            Lista
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
          >
            Calendário
          </Button>
        </div>

        {viewMode === "calendar" && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Professional Filter */}
      {(professionals as any[]).length > 0 && (
        <div className="flex items-center gap-2">
          <Label htmlFor="professional-filter" className="text-sm font-medium">
            Profissional:
          </Label>
          <Select
            value={selectedProfessional?.toString() || "all"}
            onValueChange={(value) => setSelectedProfessional(value === "all" ? null : parseInt(value))}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os profissionais" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os profissionais</SelectItem>
              {(professionals as any[]).map((professional: any) => (
                <SelectItem key={professional.id} value={professional.id.toString()}>
                  {professional.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Main Content */}
      {viewMode === "list" ? (
        <div className="space-y-4">
          {(appointments as Appointment[]).filter((app: Appointment) => {
            const today = new Date();
            const appointmentDate = new Date(app.scheduled_date || '');
            return appointmentDate >= today;
          })
          .filter((app: Appointment) => {
            if (!selectedProfessional) return true;
            return app.user_id === selectedProfessional;
          })
          .sort((a: Appointment, b: Appointment) => {
            const dateA = new Date(a.scheduled_date || '');
            const dateB = new Date(b.scheduled_date || '');
            return dateA.getTime() - dateB.getTime();
          })
          .map((appointment: Appointment) => {
            const patient = getPatientInfo(appointment.contact_id);
            const eventColor = getEventColor(appointment.status || 'pendente');
            
            return (
              <Card 
                key={appointment.id} 
                className={`cursor-pointer hover:shadow-md transition-shadow ${eventColor.border} border-l-4`}
                onClick={() => handleAppointmentClick(appointment)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${eventColor.dot}`} />
                      <div>
                        <h3 className="font-semibold">
                          {patient?.name || appointment.doctor_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {appointment.scheduled_date ? 
                            format(new Date(appointment.scheduled_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                            : 'Data não definida'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getStatusConfig(appointment.status || 'pendente')?.color}>
                        {getStatusConfig(appointment.status || 'pendente')?.label}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAppointment(appointment.id);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="border rounded-lg">
          {/* Calendar Header */}
          <div className="grid grid-cols-8 border-b bg-gray-50">
            <div className="p-2 text-sm font-medium text-center border-r">
              Horário
            </div>
            {weekDays.map((day, index) => (
              <div
                key={index}
                className={`p-2 text-sm font-medium text-center border-r last:border-r-0 ${
                  isToday(day) ? 'bg-blue-50 text-blue-600' : ''
                }`}
              >
                <div>{format(day, 'EEE', { locale: ptBR })}</div>
                <div className="text-xs opacity-70">
                  {format(day, 'dd/MM')}
                </div>
              </div>
            ))}
          </div>

          {/* Calendar Body */}
          <div className="relative">
            {timeSlots.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b last:border-b-0 min-h-[60px]">
                <div className="p-2 text-sm text-center border-r bg-gray-50 flex items-center justify-center">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {weekDays.map((day, dayIndex) => {
                  const dayAppointments = getAppointmentsForDate(day);
                  const hourAppointments = dayAppointments.filter((apt: Appointment) => {
                    if (!apt.scheduled_date) return false;
                    const aptHour = new Date(apt.scheduled_date).getHours();
                    return aptHour === hour;
                  });

                  return (
                    <div
                      key={dayIndex}
                      className={`relative border-r last:border-r-0 min-h-[60px] ${getCalendarCellBackgroundClass(day, hour)}`}
                      onClick={() => handleQuickCreateAppointment(day, hour)}
                    >
                      {hourAppointments.map((appointment: Appointment) => {
                        const eventColor = getEventColor(appointment.status || 'pendente');
                        const patient = getPatientInfo(appointment.contact_id);
                        const duration = getAppointmentDuration(appointment);
                        const heightPercent = Math.min((duration / 60) * 100, 100);

                        return (
                          <div
                            key={appointment.id}
                            className={`absolute left-0 right-0 mx-1 my-1 p-1 rounded text-xs cursor-pointer 
                              ${eventColor.bg} ${eventColor.text} ${eventColor.border} border shadow-sm
                              hover:shadow-md transition-shadow`}
                            style={{ height: `${heightPercent}%` }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAppointmentClick(appointment);
                            }}
                          >
                            <div className="font-medium truncate">
                              {patient?.name || appointment.doctor_name}
                            </div>
                            <div className="text-xs opacity-75">
                              {appointment.scheduled_date ? 
                                format(new Date(appointment.scheduled_date), 'HH:mm')
                                : ''
                              }
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appointment Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Consulta</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Paciente</Label>
                  <p className="text-sm">
                    {getPatientName(selectedAppointment.contact_id, selectedAppointment)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Data e Horário</Label>
                  <p className="text-sm">
                    {selectedAppointment.scheduled_date ? 
                      format(new Date(selectedAppointment.scheduled_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                      : 'Data não definida'
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant="outline" className={getStatusConfig(selectedAppointment.status || 'pendente')?.color}>
                    {getStatusConfig(selectedAppointment.status || 'pendente')?.label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Duração</Label>
                  <p className="text-sm">{selectedAppointment.duration_minutes || 30} minutos</p>
                </div>
              </div>
              
              {selectedAppointment.session_notes && (
                <div>
                  <Label className="text-sm font-medium">Observações</Label>
                  <p className="text-sm mt-1">{selectedAppointment.session_notes}</p>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleEditAppointment(selectedAppointment.id)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteAppointmentMutation.mutate(selectedAppointment.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Appointment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Consulta</DialogTitle>
          </DialogHeader>
          <Form {...appointmentForm}>
            <form id="appointment-form" onSubmit={appointmentForm.handleSubmit(onSubmitAppointment)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={appointmentForm.control}
                  name="contact_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paciente</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um paciente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(contacts as Contact[]).map((contact: Contact) => (
                            <SelectItem key={contact.id} value={contact.id.toString()}>
                              {contact.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={appointmentForm.control}
                  name="scheduled_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={appointmentForm.control}
                  name="scheduled_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={appointmentForm.control}
                  name="duration_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração (minutos)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={appointmentForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mainStatusList.map((status) => (
                            <SelectItem key={status} value={status}>
                              {statusConfig[status].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={appointmentForm.control}
                  name="specialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especialidade</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={appointmentForm.control}
                name="session_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createAppointmentMutation.isPending}>
                  {createAppointmentMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Consulta'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Simple Edit Dialog - Replace complex AppointmentEditor */}
      <Dialog open={appointmentEditorOpen} onOpenChange={setAppointmentEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Consulta</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Funcionalidade de edição em desenvolvimento.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAppointmentEditorOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}