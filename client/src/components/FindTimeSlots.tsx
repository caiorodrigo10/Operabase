import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  // Generate mock time slots for demonstration
  useEffect(() => {
    const generateTimeSlots = () => {
      const morning: TimeSlot[] = [];
      const afternoon: TimeSlot[] = [];
      const evening: TimeSlot[] = [];

      // Morning slots (8:00 - 12:00)
      for (let hour = 8; hour < 12; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const start = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const endHour = minute === 30 ? hour + 1 : hour;
          const endMinute = minute === 30 ? 0 : minute + 30;
          const end = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
          
          morning.push({
            startTime: start,
            endTime: end,
            label: `${start} - ${end}`,
            available: Math.random() > 0.3 // 70% chance of being available
          });
        }
      }

      // Afternoon slots (12:00 - 18:00)
      for (let hour = 12; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const start = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const endHour = minute === 30 ? hour + 1 : hour;
          const endMinute = minute === 30 ? 0 : minute + 30;
          const end = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
          
          afternoon.push({
            startTime: start,
            endTime: end,
            label: `${start} - ${end}`,
            available: Math.random() > 0.3
          });
        }
      }

      // Evening slots (18:00 - 22:00)
      for (let hour = 18; hour < 22; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const start = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const endHour = minute === 30 ? hour + 1 : hour;
          const endMinute = minute === 30 ? 0 : minute + 30;
          const end = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
          
          evening.push({
            startTime: start,
            endTime: end,
            label: `${start} - ${end}`,
            available: Math.random() > 0.4 // 60% chance for evening
          });
        }
      }

      return { morning, afternoon, evening };
    };

    const slots = generateTimeSlots();
    setTimeSlots(slots);
  }, [currentDate, duration]);

  const renderTimeSlots = (slots: TimeSlot[], title: string) => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-slate-700">{title}</h3>
      <div className="grid grid-cols-2 gap-2">
        {slots.map((slot, index) => (
          <Button
            key={index}
            variant={selectedTime === slot.startTime ? "default" : "outline"}
            className={`p-3 h-auto ${
              !slot.available 
                ? "opacity-50 cursor-not-allowed bg-gray-100" 
                : selectedTime === slot.startTime
                ? "bg-blue-600 text-white"
                : "hover:bg-blue-50"
            }`}
            disabled={!slot.available}
            onClick={() => slot.available && handleTimeSelect(slot.startTime)}
          >
            <div className="text-center">
              <div className="font-medium">{slot.startTime}</div>
              <div className="text-xs opacity-75">
                {duration} min
              </div>
            </div>
          </Button>
        ))}
      </div>
      {slots.filter(s => s.available).length === 0 && (
        <div className="text-center py-4 text-slate-500">
          Nenhum horário disponível neste período
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Encontrar Horário Disponível
        </DialogTitle>
      </DialogHeader>

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateDate('prev')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex-1 text-center">
          <h2 className="text-lg font-medium text-slate-800">
            {formatDateHeader(currentDate)}
          </h2>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateDate('next')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-center">
        <Button variant="outline" size="sm" onClick={goToToday}>
          Hoje
        </Button>
      </div>

      {/* Time Slots by Period */}
      <div className="space-y-6 max-h-96 overflow-y-auto">
        {renderTimeSlots(timeSlots.morning, "Manhã")}
        {renderTimeSlots(timeSlots.afternoon, "Tarde")}
        {renderTimeSlots(timeSlots.evening, "Noite")}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirm} 
          disabled={!selectedTime}
          className="flex-1"
        >
          Selecionar Horário
        </Button>
      </div>
    </div>
  );
}