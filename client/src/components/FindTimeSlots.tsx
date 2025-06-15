import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Clock, AlertTriangle } from "lucide-react";
import { format, addDays, subDays, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";

interface FindTimeSlotsProps {
  selectedDate?: string;
  duration: number;
  onTimeSelect: (time: string) => void;
  onClose: () => void;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  label: string;
  available: boolean;
  reason?: string; // Reason for unavailability
}

interface ClinicConfig {
  working_days: string[];
  work_start: string;
  work_end: string;
  has_lunch_break: boolean;
  lunch_start: string;
  lunch_end: string;
}

export function FindTimeSlots({ selectedDate, duration, onTimeSelect, onClose }: FindTimeSlotsProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    if (selectedDate) {
      return new Date(selectedDate);
    }
    return new Date();
  });
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [timeSlots, setTimeSlots] = useState<{
    morning: TimeSlot[];
    afternoon: TimeSlot[];
    evening: TimeSlot[];
  }>({
    morning: [],
    afternoon: [],
    evening: []
  });

  // Fetch clinic configuration
  const { data: clinicConfig } = useQuery({
    queryKey: ["/api/clinic/1/config"],
    select: (data: any): ClinicConfig => ({
      working_days: data.working_days || ['monday','tuesday','wednesday','thursday','friday'],
      work_start: data.work_start || "08:00",
      work_end: data.work_end || "18:00",
      has_lunch_break: data.has_lunch_break !== false,
      lunch_start: data.lunch_start || "12:00",
      lunch_end: data.lunch_end || "13:00"
    })
  });

  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateHeader = (date: Date) => {
    const dayName = format(date, "EEEE", { locale: ptBR });
    const formattedDate = format(date, "dd 'de' MMMM yyyy", { locale: ptBR });
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${formattedDate}`;
  };

  const handleTimeSelect = (startTime: string) => {
    setSelectedTime(startTime);
  };

  const handleConfirm = () => {
    if (selectedTime) {
      onTimeSelect(selectedTime);
      onClose();
    }
  };

  // Helper functions for working hours validation
  const getDayOfWeekKey = (date: Date): string => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[getDay(date)];
  };

  const isWorkingDay = (date: Date, config: ClinicConfig): boolean => {
    const dayKey = getDayOfWeekKey(date);
    return config.working_days.includes(dayKey);
  };

  const isWorkingHour = (time: string, config: ClinicConfig): boolean => {
    return time >= config.work_start && time <= config.work_end;
  };

  const isLunchTime = (time: string, config: ClinicConfig): boolean => {
    // If lunch break is disabled, never block lunch time
    if (!config.has_lunch_break) {
      return false;
    }
    return time >= config.lunch_start && time < config.lunch_end;
  };

  const getUnavailabilityReason = (date: Date, time: string, config: ClinicConfig): string | undefined => {
    if (!isWorkingDay(date, config)) {
      return "Dia não útil";
    }
    if (!isWorkingHour(time, config)) {
      return "Fora do horário de funcionamento";
    }
    if (isLunchTime(time, config)) {
      return "Horário de almoço";
    }
    return undefined;
  };

  // Generate time slots based on clinic configuration
  useEffect(() => {
    if (!clinicConfig) return;

    const generateTimeSlots = () => {
      const morning: TimeSlot[] = [];
      const afternoon: TimeSlot[] = [];
      const evening: TimeSlot[] = [];

      // Parse work hours
      const [workStartHour, workStartMinute] = clinicConfig.work_start.split(':').map(Number);
      const [workEndHour, workEndMinute] = clinicConfig.work_end.split(':').map(Number);
      
      // Generate slots from work start to work end in 30-minute intervals
      const startHour = Math.max(6, workStartHour); // Start from 6 AM minimum
      const endHour = Math.min(22, workEndHour); // End at 10 PM maximum
      
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const start = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const endHour = minute === 30 ? hour + 1 : hour;
          const endMinute = minute === 30 ? 0 : minute + 30;
          const end = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
          
          const unavailabilityReason = getUnavailabilityReason(currentDate, start, clinicConfig);
          const isAvailable = !unavailabilityReason;
          
          const timeSlot: TimeSlot = {
            startTime: start,
            endTime: end,
            label: `${start} - ${end}`,
            available: isAvailable,
            reason: unavailabilityReason
          };

          // Categorize time slots
          if (hour < 12) {
            morning.push(timeSlot);
          } else if (hour < 18) {
            afternoon.push(timeSlot);
          } else {
            evening.push(timeSlot);
          }
        }
      }

      setTimeSlots({ morning, afternoon, evening });
    };

    generateTimeSlots();
  }, [currentDate, clinicConfig]);

  const renderTimeSlots = (slots: TimeSlot[], title: string) => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-slate-700">{title}</h3>
      <div className="grid grid-cols-2 gap-2">
        {slots.map((slot) => (
          <Button
            key={slot.startTime}
            variant={selectedTime === slot.startTime ? "default" : "outline"}
            className={`h-auto p-3 flex flex-col items-start justify-start text-left relative ${
              !slot.available 
                ? 'opacity-50 border-orange-200 bg-orange-50 hover:bg-orange-100' 
                : slot.available && selectedTime !== slot.startTime
                ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                : ''
            }`}
            onClick={() => handleTimeSelect(slot.startTime)}
          >
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{slot.label}</span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              {slot.available ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  Disponível
                </Badge>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 text-orange-600" />
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                    {slot.reason}
                  </Badge>
                </>
              )}
            </div>
            <span className="text-xs text-slate-500 mt-1">
              Duração: {duration} min
            </span>
          </Button>
        ))}
      </div>
    </div>
  );

  // Check if selected date is a working day
  const isSelectedDateWorkingDay = clinicConfig ? isWorkingDay(currentDate, clinicConfig) : true;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <DialogHeader className="mb-6">
        <DialogTitle className="text-2xl">Procurar Horários Disponíveis</DialogTitle>
        <p className="text-slate-600">
          Selecione um horário para a consulta de {duration} minutos
        </p>
      </DialogHeader>

      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-6 p-4 bg-slate-50 rounded-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateDate('prev')}
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Anterior</span>
        </Button>
        
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-800">
            {formatDateHeader(currentDate)}
          </h2>
          {!isSelectedDateWorkingDay && (
            <div className="flex items-center justify-center space-x-2 mt-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                Dia não útil - Agendamento possível mas não recomendado
              </Badge>
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateDate('next')}
          className="flex items-center space-x-2"
        >
          <span>Próximo</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={goToToday}
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          Ir para Hoje
        </Button>
      </div>

      {/* Time Slots */}
      <div className="space-y-8 mb-8">
        {timeSlots.morning.length > 0 && renderTimeSlots(timeSlots.morning, "Manhã")}
        {timeSlots.afternoon.length > 0 && renderTimeSlots(timeSlots.afternoon, "Tarde")}
        {timeSlots.evening.length > 0 && renderTimeSlots(timeSlots.evening, "Noite")}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirm}
          disabled={!selectedTime}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Confirmar Horário
        </Button>
      </div>

      {/* Working Hours Info */}
      {clinicConfig && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Informações da Clínica</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Funcionamento:</strong> {clinicConfig.work_start} às {clinicConfig.work_end}</p>
            <p><strong>Almoço:</strong> {clinicConfig.lunch_start} às {clinicConfig.lunch_end}</p>
            <p><strong>Dias úteis:</strong> {clinicConfig.working_days.map(day => {
              const dayNames: { [key: string]: string } = {
                'monday': 'Segunda',
                'tuesday': 'Terça', 
                'wednesday': 'Quarta',
                'thursday': 'Quinta',
                'friday': 'Sexta',
                'saturday': 'Sábado',
                'sunday': 'Domingo'
              };
              return dayNames[day];
            }).join(', ')}</p>
          </div>
        </div>
      )}
    </div>
  );
}