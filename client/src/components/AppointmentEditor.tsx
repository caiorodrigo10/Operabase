import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, User, UserPlus, Search, Plus, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { FindTimeSlots } from "@/components/FindTimeSlots";
import type { Contact } from "@/../../shared/schema";

const appointmentFormSchema = z.object({
  contact_id: z.number().min(1, "Paciente é obrigatório"),
  doctor_name: z.string().min(1, "Profissional é obrigatório"),
  specialty: z.string().optional(),
  scheduled_date: z.string().min(1, "Data é obrigatória"),
  scheduled_time: z.string().min(1, "Horário é obrigatório"),
  duration_minutes: z.number().min(15, "Duração mínima é 15 minutos"),
  status: z.string().min(1, "Status é obrigatório"),
  appointment_type: z.string().optional(),
  session_notes: z.string().optional(),
  observations: z.string().optional(),
  how_found_clinic: z.string().optional(),
  return_period: z.string().optional(),
  receive_reminders: z.boolean().default(true),
});

type AppointmentFormData = z.infer<typeof appointmentFormSchema>;

const statusOptions = [
  { value: 'pendente', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'agendada', label: 'Agendado', color: 'bg-blue-100 text-blue-800' },
  { value: 'confirmada', label: 'Confirmado', color: 'bg-green-100 text-green-800' },
  { value: 'realizada', label: 'Realizado', color: 'bg-purple-100 text-purple-800' },
  { value: 'faltou', label: 'Faltou', color: 'bg-orange-100 text-orange-800' },
  { value: 'cancelada', label: 'Cancelado', color: 'bg-red-100 text-red-800' },
];

const howFoundOptions = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'google', label: 'Google' },
  { value: 'indicacao_familiar', label: 'Indicação familiar' },
  { value: 'indicacao_amigo', label: 'Indicação de amigo' },
  { value: 'indicacao_dentista', label: 'Indicação de profissional' },
  { value: 'marketing', label: 'Marketing' },
];

const returnPeriodOptions = [
  { value: 'sem_retorno', label: 'Sem retorno' },
  { value: '15_dias', label: '15 dias' },
  { value: '1_mes', label: '1 mês' },
  { value: '6_meses', label: '6 meses' },
  { value: '12_meses', label: '12 meses' },
  { value: 'outro', label: 'Outro' },
];

const availableTags = [
  { name: 'Primeira consulta', color: 'bg-blue-100 text-blue-800' },
  { name: 'Retorno', color: 'bg-green-100 text-green-800' },
  { name: 'Emergência', color: 'bg-red-100 text-red-800' },
  { name: 'Avaliação', color: 'bg-purple-100 text-purple-800' },
  { name: 'Limpeza', color: 'bg-cyan-100 text-cyan-800' },
  { name: 'Procedimento', color: 'bg-orange-100 text-orange-800' },
];

interface AppointmentEditorProps {
  appointmentId?: number;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (appointment: any) => void;
}

export function AppointmentEditor({ appointmentId, isOpen, onClose, onSave }: AppointmentEditorProps) {
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [findTimeOpen, setFindTimeOpen] = useState(false);
  
  const { toast } = useToast();

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      contact_id: 0,
      doctor_name: '',
      specialty: '',
      scheduled_date: '',
      scheduled_time: '',
      duration_minutes: 60,
      status: 'agendada',
      appointment_type: '',
      session_notes: '',
      observations: '',
      how_found_clinic: '',
      return_period: '',
      receive_reminders: true,
    },
  });

  // Fetch contacts for patient search
  const { data: contacts = [] } = useQuery({
    queryKey: ['/api/contacts', { clinic_id: 1 }],
    queryFn: async () => {
      const response = await fetch('/api/contacts?clinic_id=1');
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json();
    },
  });

  // Fetch doctors for the clinic
  const { data: doctors = [] } = useQuery({
    queryKey: ['/api/clinic/1/users'],
    queryFn: async () => {
      const response = await fetch('/api/clinic/1/users');
      if (!response.ok) throw new Error('Failed to fetch clinic users');
      return response.json();
    },
  });

  // Fetch appointment data when editing
  const { data: appointment } = useQuery({
    queryKey: ['/api/appointments', appointmentId],
    queryFn: async () => {
      if (!appointmentId) return null;
      const response = await fetch(`/api/appointments/${appointmentId}`);
      if (!response.ok) throw new Error('Failed to fetch appointment');
      return response.json();
    },
    enabled: !!appointmentId,
  });

  // Load appointment data into form when editing
  useEffect(() => {
    if (appointment) {
      const scheduledDate = appointment.scheduled_date ? new Date(appointment.scheduled_date) : null;
      
      form.reset({
        contact_id: appointment.contact_id,
        doctor_name: appointment.doctor_name || '',
        specialty: appointment.specialty || '',
        scheduled_date: scheduledDate ? scheduledDate.toISOString().split('T')[0] : '',
        scheduled_time: scheduledDate ? scheduledDate.toTimeString().slice(0, 5) : '',
        duration_minutes: appointment.duration_minutes || 60,
        status: appointment.status || 'agendada',
        appointment_type: appointment.appointment_type || '',
        session_notes: appointment.session_notes || '',
        observations: appointment.observations || '',
        how_found_clinic: appointment.how_found_clinic || '',
        return_period: appointment.return_period || '',
        receive_reminders: appointment.receive_reminders ?? true,
      });

      // Set selected contact
      const contact = contacts.find((c: Contact) => c.id === appointment.contact_id);
      if (contact) {
        setSelectedContact(contact);
      }

      // Set selected tags
      if (appointment.tags) {
        setSelectedTags(appointment.tags);
      }
    }
  }, [appointment, contacts, form]);

  // Filter contacts based on search
  const filteredContacts = contacts.filter((contact: Contact) =>
    contact.name.toLowerCase().includes(patientSearch.toLowerCase())
  ).slice(0, 10);

  // Save appointment mutation
  const saveAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      const scheduledDateTime = new Date(`${data.scheduled_date}T${data.scheduled_time}`);
      
      const payload = {
        ...data,
        scheduled_date: scheduledDateTime.toISOString(),
        tags: selectedTags,
        clinic_id: 1,
        user_id: 1,
      };

      if (appointmentId) {
        const response = await fetch(`/api/appointments/${appointmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to update appointment');
        return response.json();
      } else {
        const response = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to create appointment');
        return response.json();
      }
    },
    onSuccess: (appointment) => {
      toast({
        title: appointmentId ? "Agendamento atualizado" : "Agendamento criado",
        description: appointmentId ? "As alterações foram salvas com sucesso." : "O novo agendamento foi criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      onSave?.(appointment);
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao salvar agendamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AppointmentFormData) => {
    saveAppointmentMutation.mutate(data);
  };

  const handleTimeSelect = (time: string) => {
    form.setValue('scheduled_time', time);
    setTimePickerOpen(false);
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev => 
      prev.includes(tagName) 
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  const getStatusColor = (status: string) => {
    return statusOptions.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-semibold text-slate-800">
            {appointmentId ? 'Alterar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Professional Selection */}
          <div className="space-y-3">
            <Label htmlFor="doctor_name" className="text-base font-medium text-slate-700">
              Profissional
            </Label>
            <Controller
              name="doctor_name"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor: any) => (
                      <SelectItem key={doctor.id} value={doctor.name}>
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.doctor_name && (
              <p className="text-sm text-red-600">{form.formState.errors.doctor_name.message}</p>
            )}
          </div>

          {/* Patient Selection */}
          <div className="space-y-3">
            <Label htmlFor="contact_id" className="text-base font-medium text-slate-700">
              Paciente
            </Label>
            <div className="flex gap-3">
              <div className="flex-1">
                <Dialog open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 justify-start text-left font-normal text-base"
                    >
                      {selectedContact ? selectedContact.name : "Selecione o paciente"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Selecionar Paciente</DialogTitle>
                      <DialogDescription>
                        Busque e selecione um paciente da lista
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Digite o nome do paciente..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        className="w-full"
                      />
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {filteredContacts.map((contact: Contact) => (
                          <Button
                            key={contact.id}
                            type="button"
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                              setSelectedContact(contact);
                              form.setValue('contact_id', contact.id);
                              setPatientSearchOpen(false);
                              setPatientSearch('');
                            }}
                          >
                            <User className="w-4 h-4 mr-2" />
                            {contact.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Button type="button" variant="outline" size="icon" className="h-12 w-12">
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>

            {/* Patient Quick Actions */}
            {selectedContact && (
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="link" size="sm" className="p-0 h-auto text-blue-600">
                  📋 Abrir prontuário
                </Button>
                <Button type="button" variant="link" size="sm" className="p-0 h-auto text-green-600">
                  💰 Ir para financeiro
                </Button>
              </div>
            )}
            {form.formState.errors.contact_id && (
              <p className="text-sm text-red-600">{form.formState.errors.contact_id.message}</p>
            )}
          </div>

          {/* Date, Time and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_date" className="text-base font-medium text-slate-700">
                Data da consulta
              </Label>
              <Input
                type="date"
                {...form.register('scheduled_date')}
                className="h-12 text-base"
              />
              {form.formState.errors.scheduled_date && (
                <p className="text-sm text-red-600">{form.formState.errors.scheduled_date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled_time" className="text-base font-medium text-slate-700">
                Horário
              </Label>
              <Input
                type="time"
                {...form.register('scheduled_time')}
                className="h-12 text-base"
              />
              {form.formState.errors.scheduled_time && (
                <p className="text-sm text-red-600">{form.formState.errors.scheduled_time.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration_minutes" className="text-base font-medium text-slate-700">
                Duração
              </Label>
              <Controller
                name="duration_minutes"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Duração" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">60 min</SelectItem>
                      <SelectItem value="90">90 min</SelectItem>
                      <SelectItem value="120">120 min</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-medium text-slate-700">Encontrar horário</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-blue-600"
                onClick={() => setFindTimeOpen(true)}
              >
                <Clock className="w-4 h-4 mr-2" />
                Encontrar horário
              </Button>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-3">
            <Label htmlFor="status" className="text-base font-medium text-slate-700">
              Status
            </Label>
            <Controller
              name="status"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${status.color.includes('blue') ? 'bg-blue-500' : 
                            status.color.includes('green') ? 'bg-green-500' :
                            status.color.includes('yellow') ? 'bg-yellow-500' :
                            status.color.includes('orange') ? 'bg-orange-500' :
                            status.color.includes('red') ? 'bg-red-500' : 'bg-gray-500'}`}>
                          </div>
                          {status.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Observations */}
          <div className="space-y-3">
            <Label htmlFor="observations" className="text-base font-medium text-slate-700">
              Observações
            </Label>
            <Textarea
              {...form.register('observations')}
              placeholder="Primeira consulta"
              className="min-h-[100px] text-base"
            />
          </div>

          {/* How Found Clinic */}
          <div className="space-y-3">
            <Label htmlFor="how_found_clinic" className="text-base font-medium text-slate-700">
              Como conheceu a clínica
            </Label>
            <Controller
              name="how_found_clinic"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {howFoundOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Return Period */}
          <div className="space-y-3">
            <Label htmlFor="return_period" className="text-base font-medium text-slate-700">
              Retornar em
            </Label>
            <Controller
              name="return_period"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Selecionar período" />
                  </SelectTrigger>
                  <SelectContent>
                    {returnPeriodOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label className="text-base font-medium text-slate-700">Etiquetas</Label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <Badge
                  key={tag.name}
                  variant="outline"
                  className={`cursor-pointer transition-colors ${
                    selectedTags.includes(tag.name) ? tag.color : 'hover:bg-slate-100'
                  }`}
                  onClick={() => toggleTag(tag.name)}
                >
                  {tag.name}
                  {selectedTags.includes(tag.name) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Receive Reminders */}
          <div className="space-y-3">
            <Controller
              name="receive_reminders"
              control={form.control}
              render={({ field }) => (
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="receive_reminders"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label htmlFor="receive_reminders" className="text-base font-medium text-slate-700">
                    Receber lembretes
                  </Label>
                  {!field.value && (
                    <div className="flex items-center text-red-600">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      <span className="text-sm">Lembretes desabilitados</span>
                    </div>
                  )}
                </div>
              )}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="h-12 px-6">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="h-12 px-8"
              disabled={saveAppointmentMutation.isPending}
            >
              {saveAppointmentMutation.isPending ? 'Salvando...' : (appointmentId ? 'Atualizar' : 'Criar')} Agendamento
            </Button>
          </div>
        </form>

        {/* Find Time Dialog */}
        <Dialog open={findTimeOpen} onOpenChange={setFindTimeOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <FindTimeSlots
              selectedDate={form.watch('scheduled_date')}
              onTimeSelect={(time: string) => {
                form.setValue('scheduled_time', time);
                setFindTimeOpen(false);
              }}
              onClose={() => setFindTimeOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}