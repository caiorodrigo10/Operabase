
import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AppointmentForm } from "@/components/AppointmentForm";
import { FindTimeSlots } from "@/components/FindTimeSlots";
import { useAvailabilityCheck } from "@/hooks/useAvailability";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Contact } from "../../../server/domains/contacts/contacts.schema";

// Schema exatamente igual ao usado em /consultas
const appointmentFormSchema = z.object({
  contact_id: z.string().min(1, "Paciente é obrigatório"),
  user_id: z.string().min(1, "Profissional é obrigatório"),
  type: z.string().min(1, "Tipo de consulta é obrigatório"),
  scheduled_date: z.string().min(1, "Data é obrigatória"),
  scheduled_time: z.string().min(1, "Horário é obrigatório"),
  duration: z.string().min(1, "Duração é obrigatória"),
  tag_id: z.string().optional(),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentFormSchema>;

// Schema para novo paciente (exatamente igual ao de /consultas)
const patientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  age: z.string().optional(),
  gender: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface AppointmentEditorProps {
  appointmentId?: number;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (appointment: any) => void;
  preselectedContact?: Contact;
}

export function AppointmentEditor({ appointmentId, isOpen, onClose, onSave, preselectedContact }: AppointmentEditorProps) {
  const { toast } = useToast();
  const [showNewPatientDialog, setShowNewPatientDialog] = useState(false);
  const [findTimeSlotsOpen, setFindTimeSlotsOpen] = useState(false);
  const [availabilityConflict, setAvailabilityConflict] = useState<any>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [workingHoursWarning, setWorkingHoursWarning] = useState<any>(null);

  // Form principal (exatamente igual ao de /consultas)
  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      contact_id: "",
      user_id: "",
      type: "consulta",
      scheduled_date: "",
      scheduled_time: "",
      duration: "60",
      tag_id: "",
      notes: "",
    },
  });

  // Form de paciente (exatamente igual ao de /consultas)
  const patientForm = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      age: "",
      gender: "",
    },
  });

  // Hook de verificação de disponibilidade (igual ao de /consultas)
  const availabilityCheck = useAvailabilityCheck();

  // Fetch contacts (igual ao de /consultas)
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
    queryFn: async () => {
      const response = await fetch('/api/contacts?clinic_id=1');
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json();
    },
  });

  // Fetch clinic users (igual ao de /consultas)
  const { data: clinicUsers = [] } = useQuery({
    queryKey: ['/api/clinic/1/users/management'],
    queryFn: async () => {
      const response = await fetch('/api/clinic/1/users/management');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  // Fetch clinic config (igual ao de /consultas)
  const { data: clinicConfig } = useQuery({
    queryKey: ["/api/clinic/1/config"],
    queryFn: async () => {
      const response = await fetch('/api/clinic/1/config');
      if (!response.ok) throw new Error('Failed to fetch clinic config');
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    select: (data: any) => ({
      working_days: data.working_days || ['monday','tuesday','wednesday','thursday','friday'],
      work_start: data.work_start || "08:00",
      work_end: data.work_end || "18:00", 
      lunch_start: data.lunch_start || "12:00",
      lunch_end: data.lunch_end || "13:00",
      has_lunch_break: data.has_lunch_break
    })
  });

  // Mutation para criar paciente (igual ao de /consultas)
  const createPatientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      const contactData = {
        clinic_id: 1,
        name: data.name,
        phone: data.phone,
        email: data.email || '',
        status: 'novo',
        source: 'cadastro',
        gender: data.gender || null,
      };
      
      const response = await apiRequest("POST", "/api/contacts", contactData);
      return await response.json();
    },
    onSuccess: (newPatient: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      setShowNewPatientDialog(false);
      patientForm.reset();
      
      if (newPatient && newPatient.id) {
        form.setValue("contact_id", newPatient.id.toString());
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Não foi possível cadastrar o paciente. ${error?.message || 'Erro desconhecido'}`,
        variant: "destructive",
      });
    },
  });

  // Mutation para criar agendamento (igual ao de /consultas)
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      const selectedContact = contacts.find((contact: Contact) => contact.id.toString() === data.contact_id);
      const patientName = selectedContact?.name || "Paciente";
      
      const appointmentData = {
        contact_id: parseInt(data.contact_id),
        user_id: parseInt(data.user_id),
        clinic_id: 1,
        type: data.type,
        scheduled_date: data.scheduled_date,
        scheduled_time: data.scheduled_time,
        duration: parseInt(data.duration),
        status: "agendada",
        payment_status: "pendente",
        notes: data.notes || null,
        tag_id: data.tag_id ? parseInt(data.tag_id) : null,
        doctor_name: patientName,
        specialty: data.type,
        appointment_type: data.type,
        duration_minutes: parseInt(data.duration),
        payment_amount: 0,
        session_notes: data.notes || null
      };
      
      const res = await apiRequest("POST", "/api/appointments", appointmentData);
      return await res.json();
    },
    onSuccess: (appointment) => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Consulta agendada",
        description: "A consulta foi agendada com sucesso.",
      });
      if (onSave) onSave(appointment);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao agendar",
        description: error.message || "Ocorreu um erro ao agendar a consulta.",
        variant: "destructive",
      });
    },
  });

  // Watch form fields (igual ao de /consultas)
  const watchedDate = form.watch("scheduled_date");
  const watchedTime = form.watch("scheduled_time");
  const watchedDuration = form.watch("duration");
  const watchedProfessionalId = form.watch("user_id");

  // Helper function para obter nome do profissional (igual ao de /consultas)
  const getProfessionalNameById = React.useCallback((userId: string | number) => {
    if (!userId) return null;
    const user = clinicUsers.find((u: any) => (u.id || u.user_id)?.toString() === userId.toString());
    return user?.name || null;
  }, [clinicUsers]);

  // Função de verificação de horário de trabalho (igual ao de /consultas)
  const getDayOfWeekKey = (date: Date): string => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  const isWorkingDay = (date: Date, config: any): boolean => {
    if (!config?.working_days) return true;
    const dayKey = getDayOfWeekKey(date);
    return config.working_days.includes(dayKey);
  };

  const isWorkingHour = (time: string, config: any): boolean => {
    if (!config?.work_start || !config?.work_end) return true;
    return time >= config.work_start && time <= config.work_end;
  };

  const isLunchTime = (time: string, config: any): boolean => {
    if (!config?.has_lunch_break) return false;
    if (!config?.lunch_start || !config?.lunch_end) return false;
    return time >= config.lunch_start && time < config.lunch_end;
  };

  const checkWorkingHours = React.useCallback((date: string, time: string) => {
    if (!date || !time || !clinicConfig) {
      setWorkingHoursWarning(null);
      return;
    }

    const [year, month, day] = date.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    
    const dayOfWeek = format(selectedDate, 'EEEE', { locale: ptBR });
    
    if (!isWorkingDay(selectedDate, clinicConfig)) {
      const workingDaysNames = clinicConfig.working_days?.map((day: string) => {
        const dayNames: { [key: string]: string } = {
          'monday': 'Segunda', 'tuesday': 'Terça', 'wednesday': 'Quarta',
          'thursday': 'Quinta', 'friday': 'Sexta', 'saturday': 'Sábado', 'sunday': 'Domingo'
        };
        return dayNames[day];
      }).join(', ') || 'Dias úteis não configurados';

      setWorkingHoursWarning({
        hasWarning: true,
        message: `é ${dayOfWeek.toLowerCase()}`,
        type: 'non_working_day',
        details: `Funcionamento: ${workingDaysNames}`
      });
      return;
    }
    
    if (!isWorkingHour(time, clinicConfig)) {
      setWorkingHoursWarning({
        hasWarning: true,
        message: `é fora do horário`,
        type: 'outside_hours',
        details: `Funcionamento: ${clinicConfig.work_start} às ${clinicConfig.work_end}`
      });
      return;
    }
    
    if (isLunchTime(time, clinicConfig)) {
      setWorkingHoursWarning({
        hasWarning: true,
        message: `é horário de almoço`,
        type: 'lunch_time',
        details: `Almoço: ${clinicConfig.lunch_start} às ${clinicConfig.lunch_end}`
      });
      return;
    }

    setWorkingHoursWarning(null);
  }, [clinicConfig]);

  // Função de verificação de disponibilidade (igual ao de /consultas)
  const checkAvailability = React.useCallback(async (date: string, time: string, duration: string, professionalName?: string) => {
    if (!date || !time || !duration) {
      setAvailabilityConflict(null);
      setIsCheckingAvailability(false);
      return;
    }

    setIsCheckingAvailability(true);
    const startDateTime = new Date(`${date}T${time}`);
    const durationMinutes = parseInt(duration);
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

    try {
      const result = await availabilityCheck.mutateAsync({
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        professionalName: professionalName
      });

      if (result.conflict) {
        setAvailabilityConflict({
          hasConflict: true,
          message: `Conflito detectado: ${result.conflictType}`,
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
    } finally {
      setIsCheckingAvailability(false);
    }
  }, [availabilityCheck]);

  // Set preselected contact (igual ao de /consultas)
  useEffect(() => {
    if (preselectedContact) {
      form.setValue('contact_id', preselectedContact.id.toString());
    }
  }, [preselectedContact, form]);

  // Effect para seleção de profissional (igual ao de /consultas)
  useEffect(() => {
    const professionalName = getProfessionalNameById(watchedProfessionalId);
    
    if (!watchedProfessionalId || !professionalName) {
      setAvailabilityConflict({
        hasConflict: true,
        message: "Selecione um profissional antes de verificar disponibilidade",
        conflictType: "no_professional"
      });
    } else {
      if (availabilityConflict?.conflictType === "no_professional") {
        setAvailabilityConflict(null);
      }
    }
  }, [watchedProfessionalId]);

  // Effect para mudanças de data/hora (igual ao de /consultas)
  useEffect(() => {
    if (!watchedProfessionalId) return;
    
    const professionalName = getProfessionalNameById(watchedProfessionalId);
    if (!professionalName) return;

    const timeoutId = setTimeout(() => {
      if (watchedDate && watchedTime && watchedDuration) {
        checkAvailability(watchedDate, watchedTime, watchedDuration, professionalName);
        checkWorkingHours(watchedDate, watchedTime);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watchedDate, watchedTime, watchedDuration, watchedProfessionalId]);

  // Handle form submission (igual ao de /consultas)
  const handleSubmit = (data: AppointmentFormData) => {
    createAppointmentMutation.mutate(data);
  };

  // Handle find time click (igual ao de /consultas)
  const handleFindTimeClick = () => {
    setFindTimeSlotsOpen(true);
  };

  return (
    <>
      {/* Main Appointment Dialog */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agendar Nova Consulta</DialogTitle>
            <DialogDescription>
              Preencha os dados para agendar uma nova consulta. O sistema verificará automaticamente a disponibilidade.
            </DialogDescription>
          </DialogHeader>

          <AppointmentForm
            form={form}
            onSubmit={handleSubmit}
            isSubmitting={createAppointmentMutation.isPending}
            submitButtonText="Agendar Consulta"
            cancelButtonText="Cancelar"
            onCancel={onClose}
            preselectedContact={preselectedContact}
            showCancelButton={true}
            showFindTimeButton={true}
            onFindTimeClick={handleFindTimeClick}
            patientForm={patientForm}
            setShowNewPatientDialog={setShowNewPatientDialog}
            setFindTimeSlotsOpen={setFindTimeSlotsOpen}
            availabilityConflict={availabilityConflict}
            isCheckingAvailability={isCheckingAvailability}
            workingHoursWarning={workingHoursWarning}
          />
        </DialogContent>
      </Dialog>

      {/* New Patient Dialog (igual ao de /consultas) */}
      <Dialog open={showNewPatientDialog} onOpenChange={setShowNewPatientDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Paciente</DialogTitle>
            <DialogDescription>
              Cadastre um novo paciente no sistema.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={patientForm.handleSubmit((data) => createPatientMutation.mutate(data))} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome *</label>
              <input
                {...patientForm.register("name")}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome completo"
              />
              {patientForm.formState.errors.name && (
                <p className="text-red-500 text-xs mt-1">{patientForm.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Telefone *</label>
              <input
                {...patientForm.register("phone")}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="(00) 00000-0000"
              />
              {patientForm.formState.errors.phone && (
                <p className="text-red-500 text-xs mt-1">{patientForm.formState.errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                {...patientForm.register("email")}
                type="email"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@exemplo.com"
              />
              {patientForm.formState.errors.email && (
                <p className="text-red-500 text-xs mt-1">{patientForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Idade</label>
                <input
                  {...patientForm.register("age")}
                  type="number"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Idade"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Gênero</label>
                <select
                  {...patientForm.register("gender")}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={() => setShowNewPatientDialog(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={createPatientMutation.isPending}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={createPatientMutation.isPending}
              >
                {createPatientMutation.isPending ? "Cadastrando..." : "Cadastrar"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Find Time Slots Dialog (igual ao de /consultas) */}
      <Dialog open={findTimeSlotsOpen} onOpenChange={setFindTimeSlotsOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto z-[60]">
          <FindTimeSlots
            selectedDate={watchedDate || ''}
            duration={parseInt(watchedDuration) || 30}
            professionalName={getProfessionalNameById(watchedProfessionalId)}
            onTimeSelect={(time, date) => {
              form.setValue("scheduled_time", time);
              form.setValue("scheduled_date", date);
              setFindTimeSlotsOpen(false);
              toast({
                title: "Horário selecionado",
                description: `${format(new Date(date), 'dd/MM/yyyy')} às ${time}`,
              });
            }}
            onClose={() => setFindTimeSlotsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
