import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, User, UserPlus, FileText, DollarSign, ArrowLeft, ArrowRight, Search, Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const appointmentSchema = z.object({
  doctor_name: z.string().min(1, "Selecione um dentista"),
  contact_id: z.number().min(1, "Selecione um paciente"),
  scheduled_date: z.string().min(1, "Data é obrigatória"),
  scheduled_time: z.string().min(1, "Horário é obrigatório"),
  duration_minutes: z.number().min(15, "Duração mínima é 15 minutos"),
  status: z.string().min(1, "Status é obrigatório"),
  observations: z.string().optional(),
  how_found_clinic: z.string().optional(),
  return_period: z.string().optional(),
  tags: z.array(z.string()).optional(),
  receive_reminders: z.boolean().default(true),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentEditorProps {
  appointmentId?: number;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (appointment: any) => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

// Status options with colors
const statusOptions = [
  { value: 'agendada', label: 'Agendada', color: 'bg-blue-100 text-blue-800' },
  { value: 'confirmada', label: 'Confirmada', color: 'bg-green-100 text-green-800' },
  { value: 'paciente_aguardando', label: 'Paciente aguardando', color: 'bg-orange-100 text-orange-800' },
  { value: 'paciente_em_atendimento', label: 'Paciente em atendimento', color: 'bg-purple-100 text-purple-800' },
  { value: 'finalizada', label: 'Finalizada', color: 'bg-gray-100 text-gray-800' },
  { value: 'faltou', label: 'Faltou', color: 'bg-red-100 text-red-800' },
  { value: 'cancelada_paciente', label: 'Cancelada pelo paciente', color: 'bg-red-100 text-red-800' },
  { value: 'cancelada_dentista', label: 'Cancelada pelo dentista', color: 'bg-red-100 text-red-800' },
];

// How found clinic options
const howFoundOptions = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'google', label: 'Google' },
  { value: 'indicacao_familiar', label: 'Indicação familiar' },
  { value: 'indicacao_amigo', label: 'Indicação de amigo' },
  { value: 'indicacao_dentista', label: 'Indicação de outro dentista' },
  { value: 'marketing', label: 'Marketing' },
];

// Return period options
const returnPeriodOptions = [
  { value: 'sem_retorno', label: 'Sem retorno' },
  { value: '15_dias', label: '15 dias' },
  { value: '1_mes', label: '1 mês' },
  { value: '6_meses', label: '6 meses' },
  { value: '12_meses', label: '12 meses' },
  { value: 'outro', label: 'Outro' },
];

// Default appointment tags
const defaultTags = [
  { id: 1, name: 'Avaliação', color: '#f8d7da' },
  { id: 2, name: 'Cirurgia', color: '#721c24' },
  { id: 3, name: 'Encaixe', color: '#fff3cd' },
  { id: 4, name: 'Ligar', color: '#d1ecf1' },
  { id: 5, name: 'Ortodontia', color: '#b6d7ff' },
  { id: 6, name: 'Prótese', color: '#d4edda' },
];

function TimeSlotPicker({ selectedDate, onTimeSelect, selectedTime }: {
  selectedDate: string;
  onTimeSelect: (time: string) => void;
  selectedTime: string;
}) {
  const [currentDate, setCurrentDate] = useState(new Date(selectedDate));
  
  // Generate time slots every 30 minutes from 8:00 to 18:00
  const generateTimeSlots = () => {
    const slots: TimeSlot[] = [];
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({ time, available: Math.random() > 0.3 }); // Mock availability
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const morningSlots = timeSlots.filter(slot => parseInt(slot.time) < 12);
  const afternoonSlots = timeSlots.filter(slot => parseInt(slot.time) >= 12 && parseInt(slot.time) < 18);
  const eveningSlots = timeSlots.filter(slot => parseInt(slot.time) >= 18);

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'prev') {
      setCurrentDate(subDays(currentDate, 1));
    } else if (direction === 'next') {
      setCurrentDate(addDays(currentDate, 1));
    } else {
      setCurrentDate(new Date());
    }
  };

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="text-center">
          <p className="font-medium">{format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
      
      <Button variant="outline" size="sm" onClick={() => navigateDate('today')} className="w-full">
        Hoje
      </Button>

      {/* Time Slots by Period */}
      <div className="grid grid-cols-3 gap-4">
        {/* Morning */}
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-2">Manhã</h4>
          <div className="space-y-1">
            {morningSlots.map((slot) => (
              <Button
                key={slot.time}
                variant={selectedTime === slot.time ? "default" : "outline"}
                size="sm"
                disabled={!slot.available}
                onClick={() => onTimeSelect(slot.time)}
                className={cn(
                  "w-full text-xs",
                  !slot.available && "opacity-50 cursor-not-allowed"
                )}
              >
                {slot.time}
              </Button>
            ))}
          </div>
        </div>

        {/* Afternoon */}
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-2">Tarde</h4>
          <div className="space-y-1">
            {afternoonSlots.map((slot) => (
              <Button
                key={slot.time}
                variant={selectedTime === slot.time ? "default" : "outline"}
                size="sm"
                disabled={!slot.available}
                onClick={() => onTimeSelect(slot.time)}
                className={cn(
                  "w-full text-xs",
                  !slot.available && "opacity-50 cursor-not-allowed"
                )}
              >
                {slot.time}
              </Button>
            ))}
          </div>
        </div>

        {/* Evening */}
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-2">Noite</h4>
          <div className="space-y-1">
            {eveningSlots.map((slot) => (
              <Button
                key={slot.time}
                variant={selectedTime === slot.time ? "default" : "outline"}
                size="sm"
                disabled={!slot.available}
                onClick={() => onTimeSelect(slot.time)}
                className={cn(
                  "w-full text-xs",
                  !slot.available && "opacity-50 cursor-not-allowed"
                )}
              >
                {slot.time}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppointmentEditor({ appointmentId, isOpen, onClose, onSave }: AppointmentEditorProps) {
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      doctor_name: '',
      contact_id: 0,
      scheduled_date: format(new Date(), 'yyyy-MM-dd'),
      scheduled_time: '',
      duration_minutes: 60,
      status: 'agendada',
      observations: '',
      how_found_clinic: '',
      return_period: 'sem_retorno',
      tags: [],
      receive_reminders: true,
    },
  });

  // Fetch contacts for patient selection
  const { data: contacts = [] } = useQuery({
    queryKey: ['/api/contacts', { clinic_id: 1 }],
    queryFn: async () => {
      const response = await fetch('/api/contacts?clinic_id=1');
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json();
    },
  });

  // Fetch users/doctors for doctor selection
  const { data: doctors = [] } = useQuery({
    queryKey: ['/api/clinic/1/users'],
    queryFn: async () => {
      const response = await fetch('/api/clinic/1/users');
      if (!response.ok) throw new Error('Failed to fetch doctors');
      return response.json();
    },
  });

  const filteredContacts = contacts.filter((contact: any) =>
    contact.name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const selectedContact = contacts.find((contact: any) => contact.id === form.watch('contact_id'));

  const saveAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      const payload = {
        ...data,
        clinic_id: 1,
        user_id: 1, // Current user ID
        tags: selectedTags,
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
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-8">
          <DialogTitle className="text-2xl font-semibold text-slate-800">
            {appointmentId ? 'Alterar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Professional Selection - Full Width */}
          <div className="space-y-3">
            <Label htmlFor="doctor_name" className="text-base font-medium text-slate-700">Profissional</Label>
            <Controller
              name="doctor_name"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-12">
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
          </div>

          {/* Patient Selection */}
          <div className="space-y-3">
            <Label htmlFor="contact_id" className="text-base font-medium text-slate-700">Paciente</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Dialog open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          {selectedContact ? selectedContact.name : "Selecione o paciente"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Selecionar Paciente</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Buscar paciente..."
                            value={patientSearch}
                            onChange={(e) => setPatientSearch(e.target.value)}
                          />
                          <div className="max-h-60 overflow-y-auto space-y-2">
                            {filteredContacts.map((contact: any) => (
                              <Button
                                key={contact.id}
                                type="button"
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() => {
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
                  <Button type="button" variant="outline" size="icon">
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Patient Quick Actions */}
                {selectedContact && (
                  <div className="flex gap-2 mt-2">
                    <Button type="button" variant="link" size="sm" className="p-0 h-auto">
                      Abrir prontuário
                    </Button>
                    <Button type="button" variant="link" size="sm" className="p-0 h-auto">
                      Ir para financeiro
                    </Button>
                    <Button type="button" variant="link" size="sm" className="p-0 h-auto">
                      Ir para agendamentos
                    </Button>
                  </div>
                )}
              </div>

              {/* Date, Time and Duration */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="scheduled_date">Data da consulta</Label>
                  <Input
                    type="date"
                    {...form.register('scheduled_date')}
                  />
                </div>
                <div>
                  <Label htmlFor="scheduled_time">Horário</Label>
                  <div className="flex gap-1">
                    <Input
                      type="time"
                      {...form.register('scheduled_time')}
                      className="flex-1"
                    />
                    <Dialog open={timePickerOpen} onOpenChange={setTimePickerOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="icon">
                          <Search className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Encontrar horário</DialogTitle>
                        </DialogHeader>
                        <TimeSlotPicker
                          selectedDate={form.watch('scheduled_date')}
                          selectedTime={form.watch('scheduled_time')}
                          onTimeSelect={handleTimeSelect}
                        />
                        <div className="flex justify-end">
                          <Button onClick={() => setTimePickerOpen(false)}>
                            Escolher horário
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div>
                  <Label htmlFor="duration_minutes">Duração (min)</Label>
                  <Input
                    type="number"
                    min="15"
                    step="15"
                    {...form.register('duration_minutes', { valueAsNumber: true })}
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <Label htmlFor="status">Status da consulta</Label>
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full", status.color.replace('text-', 'bg-').split(' ')[0])} />
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
              <div>
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  placeholder="Digite qualquer informação adicional..."
                  {...form.register('observations')}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* How found clinic */}
              <div>
                <Label htmlFor="how_found_clinic">Como conheceu a clínica</Label>
                <Controller
                  name="how_found_clinic"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma opção" />
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

              {/* Return period */}
              <div>
                <Label htmlFor="return_period">Retornar em</Label>
                <Controller
                  name="return_period"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
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
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Etiqueta da consulta</Label>
                  <Dialog open={tagManagerOpen} onOpenChange={setTagManagerOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="ghost" size="sm">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Gerenciar Etiquetas</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {defaultTags.map((tag) => (
                          <div key={tag.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: tag.color }}
                              />
                              <span>{tag.name}</span>
                            </div>
                            <div className="flex gap-1">
                              <Button type="button" variant="ghost" size="sm">
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button type="button" variant="ghost" size="sm">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button type="button" variant="outline" className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Criar nova etiqueta
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {defaultTags.map((tag) => (
                    <div
                      key={tag.id}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded cursor-pointer border",
                        selectedTags.includes(tag.name)
                          ? "bg-blue-100 border-blue-300"
                          : "bg-gray-50 border-gray-200"
                      )}
                      onClick={() => toggleTag(tag.name)}
                    >
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm">{tag.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reminders */}
              <div className="flex items-center space-x-2">
                <Controller
                  name="receive_reminders"
                  control={form.control}
                  render={({ field }) => (
                    <Checkbox
                      id="receive_reminders"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="receive_reminders">Paciente recebe lembretes</Label>
              </div>

              {!form.watch('receive_reminders') && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  O paciente não receberá lembretes da consulta pois está marcado com a opção 'Não receber'.
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveAppointmentMutation.isPending}>
              {saveAppointmentMutation.isPending ? 'Salvando...' : (appointmentId ? 'Atualizar' : 'Criar')} Agendamento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}