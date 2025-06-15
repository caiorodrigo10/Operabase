import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useFindAvailableSlots } from "@/hooks/useAvailability";

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

  const findSlotsMutation = useFindAvailableSlots();

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

  // Load available time slots when date or duration changes
  useEffect(() => {
    const loadTimeSlots = async () => {
      try {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const result = await findSlotsMutation.mutateAsync({
          date: dateStr,
          duration,
          workingHours: {
            start: "07:00",
            end: "22:00"
          }
        });

        // Organize slots by time periods
        const morning: TimeSlot[] = [];
        const afternoon: TimeSlot[] = [];
        const evening: TimeSlot[] = [];

        result.availableSlots.forEach(slot => {
          const hour = parseInt(slot.startTime.split('T')[1].split(':')[0]);
          const timeSlot: TimeSlot = {
            startTime: slot.startTime.split('T')[1].substring(0, 5),
            endTime: slot.endTime.split('T')[1].substring(0, 5),
            label: `De ${slot.startTime.split('T')[1].substring(0, 5)} às ${slot.endTime.split('T')[1].substring(0, 5)}`,
            available: true
          };

          if (hour < 12) {
            morning.push(timeSlot);
          } else if (hour < 18) {
            afternoon.push(timeSlot);
          } else {
            evening.push(timeSlot);
          }
        });

        setTimeSlots({ morning, afternoon, evening });
      } catch (error) {
        console.error('Erro ao carregar horários:', error);
      }
    };

    loadTimeSlots();
  }, [currentDate, duration, findSlotsMutation]);

  const renderTimeSlots = (slots: any[], title: string) => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-slate-700">{title}</h3>
      <div className="grid grid-cols-3 gap-3">
        {slots.map((slot, index) => (
          <label
            key={index}
            className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              slot.available
                ? selectedTime === slot.startTime
                  ? 'bg-blue-50 border-blue-300'
                  : 'hover:bg-slate-50 border-slate-200'
                : 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-50'
            }`}
          >
            <input
              type="radio"
              name="timeSlot"
              value={slot.startTime}
              checked={selectedTime === slot.startTime}
              onChange={() => slot.available && handleTimeSelect(slot.startTime)}
              disabled={!slot.available}
              className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
            />
            <span className={`text-sm ${slot.available ? 'text-slate-700' : 'text-slate-400'}`}>
              {slot.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <DialogHeader>
        <div className="flex items-center justify-between">
          <DialogTitle className="text-xl font-semibold">
            {formatDateHeader(currentDate)}
          </DialogTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="ml-2"
            >
              Hoje
            </Button>
          </div>
        </div>
      </DialogHeader>

      {findSlotsMutation.isPending ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Carregando horários disponíveis...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {timeSlots.morning.length > 0 && renderTimeSlots(timeSlots.morning, "Horários da manhã")}
          {timeSlots.afternoon.length > 0 && renderTimeSlots(timeSlots.afternoon, "Horários da tarde")}
          {timeSlots.evening.length > 0 && renderTimeSlots(timeSlots.evening, "Horários da noite")}
          
          {timeSlots.morning.length === 0 && timeSlots.afternoon.length === 0 && timeSlots.evening.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum horário disponível para esta data com duração de {duration} minutos.
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirm}
          disabled={!selectedTime || findSlotsMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Escolher horário
        </Button>
      </div>
    </div>
  );
}