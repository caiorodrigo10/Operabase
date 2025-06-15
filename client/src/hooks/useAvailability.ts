import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface AvailabilityRequest {
  startDateTime: string;
  endDateTime: string;
  excludeAppointmentId?: number;
}

interface ConflictDetails {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
}

interface AvailabilityResponse {
  available: boolean;
  conflict: boolean;
  conflictType?: 'appointment' | 'google_calendar';
  conflictDetails?: ConflictDetails;
}

export function useAvailabilityCheck() {
  return useMutation({
    mutationFn: async (data: AvailabilityRequest): Promise<AvailabilityResponse> => {
      const response = await apiRequest('POST', '/api/availability/check', data);
      return response.json();
    }
  });
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  duration: number;
}

interface FindSlotsRequest {
  date: string;
  duration?: number;
  workingHours?: {
    start: string;
    end: string;
  };
}

interface FindSlotsResponse {
  date: string;
  duration: number;
  workingHours: {
    start: string;
    end: string;
  };
  availableSlots: TimeSlot[];
  busyBlocks: {
    startTime: string;
    endTime: string;
    type: string;
    title: string;
  }[];
}

export function useFindAvailableSlots() {
  return useMutation({
    mutationFn: async (data: FindSlotsRequest): Promise<FindSlotsResponse> => {
      const response = await apiRequest('POST', '/api/availability/find-slots', data);
      return response.json();
    }
  });
}

export function createTimeSlots(date: Date, startHour: number = 8, endHour: number = 18, intervalMinutes: number = 30) {
  const slots = [];
  const baseDate = new Date(date);
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const slotTime = new Date(baseDate);
      slotTime.setHours(hour, minute, 0, 0);
      
      const timeString = slotTime.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      slots.push({
        time: timeString,
        datetime: slotTime,
        value: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      });
    }
  }
  
  return slots;
}

export function formatConflictMessage(conflictType: string, conflictDetails: ConflictDetails): string {
  const startTime = new Date(conflictDetails.startTime).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const endTime = new Date(conflictDetails.endTime).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  if (conflictType === 'appointment') {
    return `Conflito com consulta já agendada: "${conflictDetails.title}" das ${startTime} às ${endTime}`;
  } else if (conflictType === 'google_calendar') {
    return `Conflito com evento do Google Calendar: "${conflictDetails.title}" das ${startTime} às ${endTime}`;
  }
  
  return `Conflito de horário das ${startTime} às ${endTime}`;
}