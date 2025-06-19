import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface AvailabilityRequest {
  user_id: number;
  scheduled_date: string;
  scheduled_time: string;
  duration: number;
  appointment_id?: number;
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
  const checkAvailability = async (data: AvailabilityRequest): Promise<{
    conflict: any;
    workingHoursWarning: any;
  }> => {
    if (!data.user_id || !data.scheduled_date || !data.scheduled_time || !data.duration) {
      return { conflict: null, workingHoursWarning: null };
    }

    try {
      const startDateTime = new Date(`${data.scheduled_date}T${data.scheduled_time}`);
      const endDateTime = new Date(startDateTime.getTime() + data.duration * 60000);

      const response = await apiRequest('/api/availability/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString(),
          excludeAppointmentId: data.appointment_id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check availability');
      }

      const result = await response.json();

      if (result.conflict) {
        return {
          conflict: {
            hasConflict: true,
            message: formatConflictMessage(result.conflictType, result.conflictDetails),
            conflictType: result.conflictType
          },
          workingHoursWarning: null
        };
      }

      // Check working hours
      const time = data.scheduled_time;
      const [hours] = time.split(':').map(Number);
      
      let workingHoursWarning = null;
      if (hours < 8 || hours >= 18) {
        workingHoursWarning = {
          hasWarning: true,
          message: 'fora do horário comercial',
          details: 'Horário fora do padrão de funcionamento (8h às 18h)'
        };
      }

      return {
        conflict: {
          hasConflict: false,
          message: "Horário disponível",
          conflictType: undefined
        },
        workingHoursWarning
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      return { conflict: null, workingHoursWarning: null };
    }
  };

  return { checkAvailability };
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