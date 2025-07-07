import { useState, useMemo } from 'react';
import { addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';

export type CalendarView = 'month' | 'week' | 'day';
export type ViewMode = 'list' | 'calendar';

interface CalendarState {
  viewMode: ViewMode;
  calendarView: CalendarView;
  currentDate: Date;
  selectedProfessional: number | null;
  currentPage: number;
}

interface CalendarActions {
  setViewMode: (mode: ViewMode) => void;
  setCalendarView: (view: CalendarView) => void;
  setCurrentDate: (date: Date) => void;
  setSelectedProfessional: (id: number | null) => void;
  setCurrentPage: (page: number) => void;
  navigateCalendar: (direction: 'prev' | 'next') => void;
  selectProfessional: (professionalId: number) => void;
}

export function useCalendarState(initialProfessional?: number | null) {
  // Create stable reference for "today" to avoid timezone issues
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const [state, setState] = useState<CalendarState>({
    viewMode: 'calendar',
    calendarView: 'week',
    currentDate: new Date(),
    selectedProfessional: initialProfessional || null,
    currentPage: 1,
  });

  const actions: CalendarActions = {
    setViewMode: (mode: ViewMode) => {
      setState(prev => ({ ...prev, viewMode: mode }));
    },

    setCalendarView: (view: CalendarView) => {
      setState(prev => ({ ...prev, calendarView: view }));
    },

    setCurrentDate: (date: Date) => {
      setState(prev => ({ ...prev, currentDate: date }));
    },

    setSelectedProfessional: (id: number | null) => {
      setState(prev => ({ ...prev, selectedProfessional: id }));
    },

    setCurrentPage: (page: number) => {
      setState(prev => ({ ...prev, currentPage: page }));
    },

    navigateCalendar: (direction: 'prev' | 'next') => {
      setState(prev => {
        let newDate = prev.currentDate;
        
        if (direction === 'prev') {
          switch (prev.calendarView) {
            case 'month':
              newDate = subMonths(prev.currentDate, 1);
              break;
            case 'week':
              newDate = subWeeks(prev.currentDate, 1);
              break;
            case 'day':
              newDate = subDays(prev.currentDate, 1);
              break;
          }
        } else {
          switch (prev.calendarView) {
            case 'month':
              newDate = addMonths(prev.currentDate, 1);
              break;
            case 'week':
              newDate = addWeeks(prev.currentDate, 1);
              break;
            case 'day':
              newDate = addDays(prev.currentDate, 1);
              break;
          }
        }
        
        return { ...prev, currentDate: newDate };
      });
    },

    selectProfessional: (professionalId: number) => {
      setState(prev => ({ ...prev, selectedProfessional: professionalId }));
      
      // Save to localStorage for persistence
      try {
        localStorage.setItem('selected_professional_1', professionalId.toString());
        console.log('💾 Professional selection cached:', { professionalId, clinicId: 1 });
      } catch (error) {
        console.warn('Failed to save professional selection to cache:', error);
      }
    },
  };

  return {
    ...state,
    today,
    ...actions,
  };
} 