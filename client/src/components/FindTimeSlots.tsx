import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FindTimeSlotsProps {
  selectedDate?: string;
  onTimeSelect: (time: string) => void;
  onClose: () => void;
}

// Generate time slots for different periods
const generateTimeSlots = (startHour: number, endHour: number, duration: number = 30) => {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += duration) {
      const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const endMinute = minute + duration;
      const endHour = endMinute >= 60 ? hour + 1 : hour;
      const adjustedEndMinute = endMinute >= 60 ? endMinute - 60 : endMinute;
      const endTime = `${endHour.toString().padStart(2, '0')}:${adjustedEndMinute.toString().padStart(2, '0')}`;
      
      if (endHour <= endHour || (endHour === endHour + 1 && adjustedEndMinute === 0)) {
        slots.push({
          startTime,
          endTime,
          label: `De ${startTime} às ${endTime}`,
          available: Math.random() > 0.3 // Mock availability - 70% chance of being available
        });
      }
    }
  }
  return slots;
};

const morningSlots = generateTimeSlots(7, 12);
const afternoonSlots = generateTimeSlots(13, 18);
const eveningSlots = generateTimeSlots(18, 22);

export function FindTimeSlots({ selectedDate, onTimeSelect, onClose }: FindTimeSlotsProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    if (selectedDate) {
      return new Date(selectedDate);
    }
    return new Date();
  });
  const [selectedTime, setSelectedTime] = useState<string>('');

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
    }
  };

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

      <div className="space-y-8">
        {renderTimeSlots(morningSlots, "Horários da manhã")}
        {renderTimeSlots(afternoonSlots, "Horários da tarde")}
        {renderTimeSlots(eveningSlots, "Horários da noite")}
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirm}
          disabled={!selectedTime}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Escolher horário
        </Button>
      </div>
    </div>
  );
}